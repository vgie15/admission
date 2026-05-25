from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, decode_token
from app.utils import get_supabase
from datetime import datetime
from functools import wraps
import openpyxl
from io import BytesIO
import os

admin_bp = Blueprint('admin', __name__)

def role_required(*allowed_roles):
    """Decorator to limit staff endpoints by role."""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') not in allowed_roles:
                return jsonify({'error': 'Access denied'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required(fn):
    """Decorator to ensure only admins can access"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

staff_required = role_required('admin', 'registrar')

def get_filter_params():
    return {
        'school_year': request.args.get('school_year', ''),
        'semester': request.args.get('semester', ''),
        'course': request.args.get('course', ''),
    }

def semester_matches_filter(value, semester_filter=''):
    if not semester_filter:
        return True

    normalized = (value or '').strip().lower()
    aliases = {
        '1st': {'1st', 'first', 'first semester', '1st semester'},
        '2nd': {'2nd', 'second', 'second semester', '2nd semester'},
        'summer': {'summer', 'summer semester'},
    }
    return normalized in aliases.get(semester_filter, {semester_filter})

def school_period_matches(student, filters):
    if filters.get('school_year') and student.get('school_year') != filters['school_year']:
        return False
    if not semester_matches_filter(student.get('semester'), filters.get('semester')):
        return False
    return True

def course_choice_matches_filters(course_choice, filters):
    if filters.get('course') and course_choice.get('course_id') != filters['course']:
        return False

    student = course_choice.get('students') or {}
    if student:
        return school_period_matches(student, filters)

    return not filters.get('school_year') and not filters.get('semester')

def student_matches_filters(student, filters):
    if not school_period_matches(student, filters):
        return False

    course_choices = student.get('course_choices') or []
    if filters.get('course'):
        return any(course_choice.get('course_id') == filters['course'] for course_choice in course_choices)

    return True

def sorted_course_choices(student):
    return sorted(student.get('course_choices') or [], key=lambda e: e.get('choice_rank') or 1)

def course_choice_course_name(course_choice):
    return (course_choice.get('courses') or {}).get('name', '')

def approved_admission_rows(students, filters):
    rows = []
    for student in students:
        choices = sorted_course_choices(student)
        if filters.get('course') and not any(e.get('course_id') == filters['course'] for e in choices):
            continue

        approved_choice = next((e for e in choices if e.get('status') == 'enrolled'), None)
        if filters.get('course') and (not approved_choice or approved_choice.get('course_id') != filters['course']):
            continue

        first_choice = next((e for e in choices if (e.get('choice_rank') or 1) == 1), None)
        second_choice = next((e for e in choices if e.get('choice_rank') == 2), None)
        rows.append({
            'id': student.get('id'),
            'name': f"{student.get('first_name', '')} {student.get('last_name', '')}".strip(),
            'email': student.get('email', ''),
            'phone': student.get('phone', ''),
            'city': student.get('city', ''),
            'school_year': student.get('school_year', ''),
            'semester': student.get('semester', ''),
            'approved_at': student.get('approved_at', ''),
            'first_choice': course_choice_course_name(first_choice or {}),
            'second_choice': course_choice_course_name(second_choice or {}),
            'approved_choice': course_choice_course_name(approved_choice or {}),
            'approved_course_code': (approved_choice.get('courses') or {}).get('code', '') if approved_choice else '',
        })
    return rows

def count_by_field(students, field):
    counts = {}
    for student in students:
        value = (student.get(field) or 'Not Specified').strip() if isinstance(student.get(field), str) else student.get(field)
        value = value or 'Not Specified'
        counts[value] = counts.get(value, 0) + 1
    return counts

@admin_bp.route('/dashboard-stats', methods=['GET'])
@staff_required
def get_dashboard_stats():
    """Get KPI summary for dashboard"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        all_students = supabase.table('students').select('*, course_choices(*)').execute()
        students = [s for s in all_students.data if student_matches_filters(s, filters)]
        
        total_applicants = len(students)
        total_approved = len([s for s in students if s.get('status') == 'approved'])
        total_pending = len([s for s in students if s.get('status') == 'pending'])
        total_rejected = len([s for s in students if s.get('status') == 'rejected'])
        
        return jsonify({
            'total_applicants': total_applicants,
            'total_approved': total_approved,
            'total_pending': total_pending,
            'total_rejected': total_rejected
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/applicants', methods=['GET'])
@admin_required
def get_applicants():
    """Get list of all applicants"""
    try:
        supabase = get_supabase()
        
        # Get filter parameters
        course_filter = request.args.get('course')
        status_filter = request.args.get('status')
        search = request.args.get('search')
        
        # Base query
        query = supabase.table('students').select('*, course_choices(*)')
        
        # Apply filters
        if status_filter:
            query = query.eq('status', status_filter)
        
        result = query.execute()
        students = result.data
        
        # Filter by course if specified
        if course_filter:
            students = [s for s in students if any(e.get('course_id') == course_filter for e in s.get('course_choices', []))]
        
        # Filter by search term
        if search:
            search_lower = search.lower()
            students = [s for s in students if 
                       search_lower in s.get('first_name', '').lower() or
                       search_lower in s.get('last_name', '').lower() or
                       search_lower in s.get('email', '').lower()]
        
        return jsonify(students), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/student/<student_id>', methods=['GET'])
@admin_required
def get_student_profile(student_id):
    """Get detailed student profile"""
    try:
        supabase = get_supabase()
        
        # Get student info
        student = supabase.table('students').select('*').eq('id', student_id).execute()
        if not student.data:
            return jsonify({'error': 'Student not found'}), 404
        
        # Get course_choices
        course_choices = supabase.table('course_choices').select('*, courses(*)').eq('student_id', student_id).execute()
        
        # Get documents
        documents = supabase.table('documents').select('*').eq('student_id', student_id).execute()

        feedback = (
            supabase.table('application_feedback')
            .select('*')
            .eq('student_id', student_id)
            .order('created_at', desc=True)
            .execute()
        )
        
        student_data = student.data[0]
        student_data.pop('password', None)
        
        return jsonify({
            'student': student_data,
            'course_choices': course_choices.data,
            'documents': documents.data,
            'feedback': feedback.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/document/<document_id>/view', methods=['GET'])
def view_document(document_id):
    """View an uploaded student requirement."""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = request.args.get('token')
        if auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '', 1)

        if not token:
            return jsonify({'error': 'Admin access required'}), 401

        claims = decode_token(token)
        if claims.get('role') not in ['admin', 'registrar']:
            return jsonify({'error': 'Admin access required'}), 403

        supabase = get_supabase()
        document = supabase.table('documents').select('*').eq('id', document_id).execute()

        if not document.data:
            return jsonify({'error': 'Document not found'}), 404

        doc = document.data[0]
        filename = doc.get('filename')
        if not filename:
            return jsonify({'error': 'Document file is missing'}), 404

        upload_folder = os.getenv('UPLOAD_FOLDER', './uploads')
        filepath = os.path.abspath(os.path.join(upload_folder, filename))
        upload_root = os.path.abspath(upload_folder)

        if os.path.commonpath([upload_root, filepath]) != upload_root or not os.path.exists(filepath):
            return jsonify({'error': 'Uploaded file not found on server'}), 404

        return send_file(filepath, as_attachment=False, download_name=filename)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/student/<student_id>/feedback', methods=['POST'])
@admin_required
def send_student_feedback(student_id):
    """Send feedback without changing the application decision."""
    try:
        data = request.get_json() or {}
        message = (data.get('message') or '').strip()
        template_key = (data.get('template_key') or '').strip() or None

        if not message:
            return jsonify({'error': 'Feedback message is required'}), 400

        supabase = get_supabase()
        student = supabase.table('students').select('id').eq('id', student_id).execute()
        if not student.data:
            return jsonify({'error': 'Student not found'}), 404

        result = supabase.table('application_feedback').insert({
            'student_id': student_id,
            'message': message,
            'template_key': template_key,
            'created_by': get_jwt_identity(),
            'is_read': False,
            'created_at': datetime.now().isoformat()
        }).execute()

        return jsonify({
            'message': 'Feedback sent successfully',
            'data': result.data[0] if result.data else None
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/approve-student/<student_id>', methods=['PUT'])
@admin_required
def approve_student(student_id):
    """Approve student application"""
    try:
        data = request.get_json() or {}
        supabase = get_supabase()
        approved_choice_id = data.get('approved_choice_id')

        if not approved_choice_id:
            return jsonify({'error': 'Select the course choice to approve'}), 400

        course_choice = supabase.table('course_choices').select('*').eq('id', approved_choice_id).eq('student_id', student_id).execute()
        if not course_choice.data:
            return jsonify({'error': 'Selected course choice was not found'}), 400
        
        update_data = {
            'status': 'approved',
            'approved_at': datetime.now().isoformat(),
            'approved_by': get_jwt_identity()
        }
        
        if data.get('notes'):
            update_data['admin_notes'] = data['notes']
        
        result = supabase.table('students').update(update_data).eq('id', student_id).execute()
        supabase.table('course_choices').update({'status': 'not_selected'}).eq('student_id', student_id).neq('id', approved_choice_id).execute()
        supabase.table('course_choices').update({'status': 'enrolled'}).eq('id', approved_choice_id).execute()
        
        return jsonify({
            'message': 'Student approved successfully',
            'data': result.data[0] if result.data else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reject-student/<student_id>', methods=['PUT'])
@admin_required
def reject_student(student_id):
    """Reject student application"""
    try:
        data = request.get_json()
        supabase = get_supabase()
        
        update_data = {
            'status': 'rejected',
            'rejected_at': datetime.now().isoformat(),
            'rejected_by': get_jwt_identity()
        }
        
        if data.get('reason'):
            update_data['rejection_reason'] = data['reason']
        
        result = supabase.table('students').update(update_data).eq('id', student_id).execute()
        
        return jsonify({
            'message': 'Student rejected',
            'data': result.data[0] if result.data else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/export-data', methods=['GET'])
@admin_required
def export_data():
    """Export student data to Excel"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        students_result = supabase.table('students').select('*, course_choices(*, courses(*))').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]
        
        # Create Excel workbook
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Students"
        
        # Add headers
        headers = [
            'ID', 'Email', 'First Name', 'Last Name', 'Middle Name', 'Gender',
            'Date of Birth', 'Phone', 'Street/Barangay', 'City/Municipality',
            'Province', 'Zip Code', 'Strand/Track', 'GPA', 'Previous School',
            'Application Type', 'School Year', 'Semester', 'Role',
            'Application Status', 'First Choice Course', 'First Choice Code',
            'Second Choice Course', 'Second Choice Code', 'Approved Choice',
            'Approved Choice Code', 'Approved At', 'Approved By', 'Admin Notes',
            'Rejected At', 'Rejected By', 'Rejection Reason', 'Created At', 'Updated At'
        ]
        ws.append(headers)
        
        # Add data
        for student in students:
            choices = sorted_course_choices(student)
            matching_choices = [e for e in choices if course_choice_matches_filters(e, filters)]
            if filters.get('course') and not matching_choices:
                continue

            first_choice = next((e for e in choices if (e.get('choice_rank') or 1) == 1), None)
            second_choice = next((e for e in choices if e.get('choice_rank') == 2), None)
            approved_choice = next((e for e in choices if e.get('status') == 'enrolled'), None)
            row = [
                student.get('id'),
                student.get('email'),
                student.get('first_name'),
                student.get('last_name'),
                student.get('middle_name', ''),
                student.get('gender', ''),
                student.get('date_of_birth', ''),
                student.get('phone', ''),
                student.get('address', ''),
                student.get('city', ''),
                student.get('province', ''),
                student.get('zip_code', ''),
                student.get('strand', ''),
                student.get('gpa', ''),
                student.get('previous_school', ''),
                student.get('application_type', ''),
                student.get('school_year', ''),
                student.get('semester', ''),
                student.get('role', ''),
                student.get('status', ''),
                course_choice_course_name(first_choice or {}),
                (first_choice.get('courses') or {}).get('code', '') if first_choice else '',
                course_choice_course_name(second_choice or {}),
                (second_choice.get('courses') or {}).get('code', '') if second_choice else '',
                course_choice_course_name(approved_choice or {}),
                (approved_choice.get('courses') or {}).get('code', '') if approved_choice else '',
                student.get('approved_at', ''),
                student.get('approved_by', ''),
                student.get('admin_notes', ''),
                student.get('rejected_at', ''),
                student.get('rejected_by', ''),
                student.get('rejection_reason', ''),
                student.get('created_at', ''),
                student.get('updated_at', '')
            ]
            ws.append(row)
        
        # Save to BytesIO
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        return output.getvalue(), 200, {
            'Content-Disposition': 'attachment; filename=students_export.xlsx',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/approved-admissions', methods=['GET'])
@staff_required
def get_approved_admissions():
    """Get approved admission students for view-only registrar reporting."""
    try:
        supabase = get_supabase()
        filters = get_filter_params()
        sort_by = request.args.get('sort_by', 'approved_at')
        sort_order = request.args.get('sort_order', 'desc')

        students_result = (
            supabase.table('students')
            .select('*, course_choices(*, courses(*))')
            .eq('status', 'approved')
            .execute()
        )
        students = [s for s in students_result.data if student_matches_filters(s, filters)]
        rows = approved_admission_rows(students, filters)

        if sort_by == 'course':
            rows.sort(key=lambda row: row.get('approved_choice') or '')
        else:
            rows.sort(key=lambda row: row.get('approved_at') or '', reverse=sort_order != 'asc')

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/export-approved-admissions', methods=['GET'])
@staff_required
def export_approved_admissions():
    """Export approved admission students to Excel."""
    try:
        supabase = get_supabase()
        filters = get_filter_params()
        students_result = (
            supabase.table('students')
            .select('*, course_choices(*, courses(*))')
            .eq('status', 'approved')
            .execute()
        )
        students = [s for s in students_result.data if student_matches_filters(s, filters)]
        rows = approved_admission_rows(students, filters)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Approved Admissions"
        ws.append([
            'Student ID', 'Name', 'Email', 'Phone', 'City/Municipality',
            'School Year', 'Semester', 'First Choice Course', 'Second Choice Course',
            'Approved Choice', 'Approved At'
        ])

        for row in rows:
            ws.append([
                row.get('id'),
                row.get('name'),
                row.get('email'),
                row.get('phone'),
                row.get('city'),
                row.get('school_year'),
                row.get('semester'),
                row.get('first_choice'),
                row.get('second_choice'),
                row.get('approved_choice'),
                row.get('approved_at'),
            ])

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        return output.getvalue(), 200, {
            'Content-Disposition': 'attachment; filename=approved_admissions.xlsx',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/application-trend', methods=['GET'])
@staff_required
def get_application_trend():
    """Get application trend data"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        course_choices = supabase.table('course_choices').select('*, students(school_year, semester)').execute()
        filtered_course_choices = [e for e in course_choices.data if course_choice_matches_filters(e, filters)]
        
        # Group by month
        trend_data = {}
        for course_choice in filtered_course_choices:
            if course_choice.get('created_at'):
                month = course_choice['created_at'][:7]  # YYYY-MM
                trend_data[month] = trend_data.get(month, 0) + 1
        
        return jsonify(trend_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/applicants-per-course', methods=['GET'])
@staff_required
def get_applicants_per_course():
    """Get number of applicants per course"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        course_choices = supabase.table('course_choices').select('*, students(school_year, semester), courses(*)').execute()
        filtered_course_choices = [e for e in course_choices.data if course_choice_matches_filters(e, filters)]
        
        # Count per course
        course_counts = {}
        for course_choice in filtered_course_choices:
            course_name = course_choice.get('courses', {}).get('name', 'Unknown')
            course_counts[course_name] = course_counts.get(course_name, 0) + 1
        
        return jsonify(course_counts), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/first-choice-distribution', methods=['GET'])
@staff_required
def get_first_choice_distribution():
    """Get first choice course distribution, one count per applicant."""
    try:
        supabase = get_supabase()

        filters = get_filter_params()
        students_result = supabase.table('students').select('*, course_choices(*, courses(*))').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]

        course_counts = {}
        for student in students:
            choices = sorted_course_choices(student)
            first_choice = next((choice for choice in choices if (choice.get('choice_rank') or 1) == 1), None)
            if not first_choice:
                continue
            if filters.get('course') and first_choice.get('course_id') != filters['course']:
                continue

            course_name = course_choice_course_name(first_choice) or 'Unknown'
            course_counts[course_name] = course_counts.get(course_name, 0) + 1

        return jsonify(course_counts), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/gender-distribution', methods=['GET'])
@staff_required
def get_gender_distribution():
    """Get gender distribution of applicants"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        students_result = supabase.table('students').select('gender, school_year, semester, course_choices(*)').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]
        
        gender_dist = {}
        for student in students:
            gender = student.get('gender', 'Not Specified')
            gender_dist[gender] = gender_dist.get(gender, 0) + 1
        
        return jsonify(gender_dist), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/approved-gender-distribution', methods=['GET'])
@staff_required
def get_approved_gender_distribution():
    """Get gender distribution of approved applicants."""
    try:
        supabase = get_supabase()

        filters = get_filter_params()
        students_result = supabase.table('students').select('gender, status, school_year, semester, course_choices(*)').eq('status', 'approved').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]

        return jsonify(count_by_field(students, 'gender')), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/city-distribution', methods=['GET'])
@staff_required
def get_city_distribution():
    """Get city/town distribution of applicants."""
    try:
        supabase = get_supabase()

        filters = get_filter_params()
        students_result = supabase.table('students').select('city, school_year, semester, course_choices(*)').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]

        return jsonify(count_by_field(students, 'city')), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/approved-city-distribution', methods=['GET'])
@staff_required
def get_approved_city_distribution():
    """Get city/town distribution of approved applicants."""
    try:
        supabase = get_supabase()

        filters = get_filter_params()
        students_result = supabase.table('students').select('city, status, school_year, semester, course_choices(*)').eq('status', 'approved').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]

        return jsonify(count_by_field(students, 'city')), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/application-status', methods=['GET'])
@staff_required
def get_application_status_distribution():
    """Get application status distribution"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        students_result = supabase.table('students').select('status, school_year, semester, course_choices(*)').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]
        
        status_dist = {}
        for student in students:
            status = student.get('status', 'unknown')
            status_dist[status] = status_dist.get(status, 0) + 1
        
        return jsonify(status_dist), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/approval-rate-per-course', methods=['GET'])
@staff_required
def get_approval_rate_per_course():
    """Get approval rate per course"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        course_choices = supabase.table('course_choices').select('*, students(status, school_year, semester), courses(name)').execute()
        filtered_course_choices = [e for e in course_choices.data if course_choice_matches_filters(e, filters)]
        
        # Calculate approval rates
        course_stats = {}
        for course_choice in filtered_course_choices:
            course_name = course_choice.get('courses', {}).get('name', 'Unknown')
            status = course_choice.get('students', {}).get('status', 'pending')
            
            if course_name not in course_stats:
                course_stats[course_name] = {'approved': 0, 'total': 0}
            
            course_stats[course_name]['total'] += 1
            if status == 'approved':
                course_stats[course_name]['approved'] += 1
        
        # Calculate rates
        approval_rates = {}
        for course, stats in course_stats.items():
            rate = (stats['approved'] / stats['total'] * 100) if stats['total'] > 0 else 0
            approval_rates[course] = round(rate, 2)
        
        return jsonify(approval_rates), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/courses', methods=['GET'])
@staff_required
def get_courses():
    """Get all courses"""
    try:
        supabase = get_supabase()
        result = supabase.table('courses').select('*').execute()
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/courses', methods=['POST'])
@admin_required
def create_course():
    """Create new course"""
    try:
        data = request.get_json()
        supabase = get_supabase()
        
        course_data = {
            'name': data.get('name'),
            'code': data.get('code'),
            'description': data.get('description', '')
        }
        
        result = supabase.table('courses').insert(course_data).execute()
        return jsonify(result.data[0] if result.data else None), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
