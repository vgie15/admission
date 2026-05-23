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

def date_matches_filters(date_value, school_year='', semester=''):
    if not date_value:
        return not school_year and not semester

    try:
        parsed = datetime.fromisoformat(str(date_value).replace('Z', '+00:00'))
    except ValueError:
        return False

    if school_year:
        try:
            start_year, end_year = [int(part) for part in school_year.split('-')]
            start_date = datetime(start_year, 1, 1)
            end_date = datetime(end_year, 12, 31, 23, 59, 59)
            if parsed.replace(tzinfo=None) < start_date or parsed.replace(tzinfo=None) > end_date:
                return False
        except ValueError:
            return False

    if semester == '1st':
        return parsed.month in [8, 9, 10, 11, 12]
    if semester == '2nd':
        return parsed.month in [1, 2, 3, 4, 5]
    if semester == 'summer':
        return parsed.month in [6, 7]

    return True

def enrollment_matches_filters(enrollment, filters):
    if filters.get('course') and enrollment.get('course_id') != filters['course']:
        return False

    date_value = enrollment.get('created_at') or enrollment.get('selected_at')
    return date_matches_filters(date_value, filters.get('school_year'), filters.get('semester'))

def student_matches_filters(student, filters):
    enrollments = student.get('enrollments') or []
    if filters.get('course'):
        return any(enrollment_matches_filters(enrollment, filters) for enrollment in enrollments)

    if filters.get('school_year') or filters.get('semester'):
        if any(enrollment_matches_filters(enrollment, filters) for enrollment in enrollments):
            return True
        return date_matches_filters(student.get('created_at'), filters.get('school_year'), filters.get('semester'))

    return True

@admin_bp.route('/dashboard-stats', methods=['GET'])
@staff_required
def get_dashboard_stats():
    """Get KPI summary for dashboard"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        all_students = supabase.table('students').select('*, enrollments(*)').execute()
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
        query = supabase.table('students').select('*, enrollments(*)')
        
        # Apply filters
        if status_filter:
            query = query.eq('status', status_filter)
        
        result = query.execute()
        students = result.data
        
        # Filter by course if specified
        if course_filter:
            students = [s for s in students if any(e.get('course_id') == course_filter for e in s.get('enrollments', []))]
        
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
        
        # Get enrollments
        enrollments = supabase.table('enrollments').select('*, courses(*)').eq('student_id', student_id).execute()
        
        # Get documents
        documents = supabase.table('documents').select('*').eq('student_id', student_id).execute()
        
        student_data = student.data[0]
        student_data.pop('password', None)
        
        return jsonify({
            'student': student_data,
            'enrollments': enrollments.data,
            'documents': documents.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/student/<student_id>', methods=['DELETE'])
@admin_required
def delete_student(student_id):
    """Delete a student applicant and related records."""
    try:
        supabase = get_supabase()

        student = supabase.table('students').select('id').eq('id', student_id).execute()
        if not student.data:
            return jsonify({'error': 'Student not found'}), 404

        supabase.table('documents').delete().eq('student_id', student_id).execute()
        supabase.table('enrollments').delete().eq('student_id', student_id).execute()
        supabase.table('students').delete().eq('id', student_id).execute()

        return jsonify({'message': 'Applicant deleted successfully'}), 200

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
        if claims.get('role') != 'admin':
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

@admin_bp.route('/approve-student/<student_id>', methods=['PUT'])
@admin_required
def approve_student(student_id):
    """Approve student application"""
    try:
        data = request.get_json() or {}
        supabase = get_supabase()
        approved_enrollment_id = data.get('approved_enrollment_id')

        if not approved_enrollment_id:
            return jsonify({'error': 'Select the course choice to approve'}), 400

        enrollment = supabase.table('enrollments').select('*').eq('id', approved_enrollment_id).eq('student_id', student_id).execute()
        if not enrollment.data:
            return jsonify({'error': 'Selected course choice was not found'}), 400
        
        update_data = {
            'status': 'approved',
            'approved_at': datetime.now().isoformat(),
            'approved_by': get_jwt_identity()
        }
        
        if data.get('notes'):
            update_data['admin_notes'] = data['notes']
        
        result = supabase.table('students').update(update_data).eq('id', student_id).execute()
        supabase.table('enrollments').update({'status': 'not_selected'}).eq('student_id', student_id).neq('id', approved_enrollment_id).execute()
        supabase.table('enrollments').update({'status': 'enrolled'}).eq('id', approved_enrollment_id).execute()
        
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
        students_result = supabase.table('students').select('*, enrollments(*, courses(*))').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]
        
        # Create Excel workbook
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Students"
        
        # Add headers
        headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 
                  'Course', 'Enrollment Status', 'Approved At']
        ws.append(headers)
        
        # Add data
        for student in students:
            for enrollment in student.get('enrollments', []):
                if not enrollment_matches_filters(enrollment, filters):
                    continue
                row = [
                    student.get('id'),
                    student.get('first_name'),
                    student.get('last_name'),
                    student.get('email'),
                    student.get('phone', ''),
                    student.get('status'),
                    enrollment.get('courses', {}).get('name', ''),
                    enrollment.get('status', 'pending'),
                    student.get('approved_at', '')
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

@admin_bp.route('/analytics/enrollment-trend', methods=['GET'])
@staff_required
def get_enrollment_trend():
    """Get enrollment trend data"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        enrollments = supabase.table('enrollments').select('*, created_at').execute()
        filtered_enrollments = [e for e in enrollments.data if enrollment_matches_filters(e, filters)]
        
        # Group by month
        trend_data = {}
        for enrollment in filtered_enrollments:
            if enrollment.get('created_at'):
                month = enrollment['created_at'][:7]  # YYYY-MM
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
        enrollments = supabase.table('enrollments').select('*, courses(*)').execute()
        filtered_enrollments = [e for e in enrollments.data if enrollment_matches_filters(e, filters)]
        
        # Count per course
        course_counts = {}
        for enrollment in filtered_enrollments:
            course_name = enrollment.get('courses', {}).get('name', 'Unknown')
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
        students_result = supabase.table('students').select('gender, created_at, enrollments(*)').execute()
        students = [s for s in students_result.data if student_matches_filters(s, filters)]
        
        gender_dist = {}
        for student in students:
            gender = student.get('gender', 'Not Specified')
            gender_dist[gender] = gender_dist.get(gender, 0) + 1
        
        return jsonify(gender_dist), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/analytics/enrollment-status', methods=['GET'])
@staff_required
def get_enrollment_status_distribution():
    """Get enrollment status distribution"""
    try:
        supabase = get_supabase()
        
        filters = get_filter_params()
        students_result = supabase.table('students').select('status, created_at, enrollments(*)').execute()
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
        enrollments = supabase.table('enrollments').select('*, students(status), courses(name)').execute()
        filtered_enrollments = [e for e in enrollments.data if enrollment_matches_filters(e, filters)]
        
        # Calculate approval rates
        course_stats = {}
        for enrollment in filtered_enrollments:
            course_name = enrollment.get('courses', {}).get('name', 'Unknown')
            status = enrollment.get('students', {}).get('status', 'pending')
            
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
