from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, decode_token
from app.utils import get_supabase
from werkzeug.utils import secure_filename
import os
from datetime import datetime

student_bp = Blueprint('student', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
REQUIRED_DOCUMENT_TYPES = {'birth_certificate', 'form_137', 'good_moral', 'id_photo'}
MAX_FILE_SIZE = 5 * 1024 * 1024

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def document_file_path(filename):
    upload_folder = os.getenv('UPLOAD_FOLDER', './uploads')
    filepath = os.path.abspath(os.path.join(upload_folder, filename))
    upload_root = os.path.abspath(upload_folder)
    if os.path.commonpath([upload_root, filepath]) != upload_root:
        return None
    return filepath

def validate_profile_payload(data):
    errors = {}
    required_fields = {
        'first_name': 'First name is required',
        'last_name': 'Last name is required',
        'gender': 'Gender is required',
        'phone': 'Phone number is required',
        'date_of_birth': 'Date of birth is required',
        'address': 'Address is required',
        'city': 'City is required',
        'province': 'Province is required',
        'zip_code': 'Zip code is required',
        'strand': 'Strand is required',
        'gpa': 'GPA is required',
        'previous_school': 'Previous school is required',
    }

    normalized = {}
    for key, value in data.items():
        normalized[key] = value.strip() if isinstance(value, str) else value

    for field, message in required_fields.items():
        if not str(normalized.get(field, '')).strip():
            errors[field] = message

    phone = str(normalized.get('phone', '')).strip()
    if phone and not (phone.startswith('09') and len(phone) == 11 and phone.isdigit()) and not (
        phone.startswith('+639') and len(phone) == 13 and phone[1:].isdigit()
    ):
        errors['phone'] = 'Enter a valid PH mobile number'

    birth_date = normalized.get('date_of_birth')
    if birth_date:
        try:
            parsed_birth_date = datetime.strptime(birth_date, '%Y-%m-%d').date()
            today = datetime.now().date()
            age = today.year - parsed_birth_date.year - (
                (today.month, today.day) < (parsed_birth_date.month, parsed_birth_date.day)
            )
            if parsed_birth_date > today:
                errors['date_of_birth'] = 'Date of birth cannot be in the future'
            elif age < 15:
                errors['date_of_birth'] = 'Student must be at least 15 years old'
        except ValueError:
            errors['date_of_birth'] = 'Enter a valid date of birth'

    zip_code = str(normalized.get('zip_code', '')).strip()
    if zip_code and (len(zip_code) != 4 or not zip_code.isdigit()):
        errors['zip_code'] = 'Zip code must be 4 digits'

    gpa = normalized.get('gpa')
    if str(gpa).strip():
        try:
            numeric_gpa = float(gpa)
            if numeric_gpa < 75 or numeric_gpa > 100:
                errors['gpa'] = 'GPA must be a number from 75 to 100'
        except (TypeError, ValueError):
            errors['gpa'] = 'GPA must be a number from 75 to 100'

    return errors, normalized

@student_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get student profile"""
    try:
        student_id = get_jwt_identity()
        supabase = get_supabase()
        
        result = supabase.table('students').select('*').eq('id', student_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Student not found'}), 404
        
        student = result.data[0]
        
        # Remove password from response
        student.pop('password', None)
        
        return jsonify(student), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update student profile"""
    try:
        student_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Allowed fields to update
        allowed_fields = ['first_name', 'last_name', 'middle_name', 'date_of_birth', 
                         'phone', 'address', 'city', 'province', 'zip_code', 
                         'strand', 'gpa', 'previous_school', 'gender']
        
        errors, normalized_data = validate_profile_payload(data)
        if errors:
            return jsonify({
                'error': 'Please complete the required fields correctly.',
                'fields': errors
            }), 400

        update_data = {k: v for k, v in normalized_data.items() if k in allowed_fields}
        
        supabase = get_supabase()
        result = supabase.table('students').update(update_data).eq('id', student_id).execute()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'data': result.data[0] if result.data else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/upload-document', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload required documents"""
    try:
        student_id = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        document_type = request.form.get('document_type', 'other')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if document_type not in REQUIRED_DOCUMENT_TYPES:
            return jsonify({'error': 'Invalid document type'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > MAX_FILE_SIZE:
            return jsonify({'error': 'File must be 5MB or smaller'}), 400
        
        # Save file
        filename = secure_filename(f"{student_id}_{document_type}_{datetime.now().timestamp()}_{file.filename}")
        upload_folder = os.getenv('UPLOAD_FOLDER', './uploads')
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        # Replace any previous upload for this document type.
        supabase = get_supabase()
        existing_docs = (
            supabase.table('documents')
            .select('*')
            .eq('student_id', student_id)
            .eq('document_type', document_type)
            .execute()
        )
        for doc in existing_docs.data:
            old_path = document_file_path(doc.get('filename', ''))
            if old_path and os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    pass
        supabase.table('documents').delete().eq('student_id', student_id).eq('document_type', document_type).execute()

        doc_data = {
            'student_id': student_id,
            'document_type': document_type,
            'filename': filename,
            'file_path': filepath,
            'uploaded_at': datetime.now().isoformat()
        }
        
        result = supabase.table('documents').insert(doc_data).execute()
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'document_id': result.data[0]['id'] if result.data else None
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/courses', methods=['GET'])
def get_available_courses():
    """Get available courses for application choices."""
    try:
        supabase = get_supabase()
        result = supabase.table('courses').select('*').execute()
        
        return jsonify(result.data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/course-selection', methods=['POST'])
@jwt_required()
def select_course():
    """Select a course choice from the student dashboard."""
    try:
        student_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('course_id'):
            return jsonify({'error': 'Course ID required'}), 400
        
        supabase = get_supabase()

        student = supabase.table('students').select('status').eq('id', student_id).execute()
        if not student.data:
            return jsonify({'error': 'Student not found'}), 404

        current_status = student.data[0].get('status', 'pending')
        existing_choices = (
            supabase.table('course_choices')
            .select('*, courses(*)')
            .eq('student_id', student_id)
            .execute()
        )

        if current_status == 'approved':
            approved_choice = next(
                (choice for choice in existing_choices.data if choice.get('status') == 'enrolled'),
                None
            )
            approved_course = (approved_choice.get('courses') or {}).get('name') if approved_choice else None
            message = f"Application already approved for {approved_course}." if approved_course else 'Application already approved.'
            return jsonify({'error': message}), 409

        if existing_choices.data:
            return jsonify({'error': 'Course already selected'}), 409
        
        # Check if course exists
        course = supabase.table('courses').select('*').eq('id', data['course_id']).execute()
        if not course.data:
            return jsonify({'error': 'Course not found'}), 404
        
        # Create course_choice record
        course_choice_data = {
            'student_id': student_id,
            'course_id': data['course_id'],
            'selected_at': datetime.now().isoformat()
        }
        
        result = supabase.table('course_choices').insert(course_choice_data).execute()
        
        return jsonify({
            'message': 'Course selected successfully',
            'course_choice_id': result.data[0]['id'] if result.data else None
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/application-status', methods=['GET'])
@jwt_required()
def get_application_status():
    """Get application status"""
    try:
        student_id = get_jwt_identity()
        supabase = get_supabase()
        
        # Get student info
        student = supabase.table('students').select('*').eq('id', student_id).execute()
        
        if not student.data:
            return jsonify({'error': 'Student not found'}), 404
        
        # Get course_choices
        course_choices = supabase.table('course_choices').select('*, courses(*)').eq('student_id', student_id).execute()
        
        return jsonify({
            'student_id': student_id,
            'overall_status': student.data[0].get('status', 'pending'),
            'course_choices': course_choices.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/documents', methods=['GET'])
@jwt_required()
def get_documents():
    """Get uploaded documents"""
    try:
        student_id = get_jwt_identity()
        supabase = get_supabase()
        
        result = supabase.table('documents').select('*').eq('student_id', student_id).execute()
        
        return jsonify(result.data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/document/<document_id>/view', methods=['GET'])
def view_own_document(document_id):
    """View a student's own uploaded document."""
    try:
        auth_header = request.headers.get('Authorization', '')
        token = request.args.get('token')
        if auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '', 1)

        if not token:
            return jsonify({'error': 'Student access required'}), 401

        claims = decode_token(token)
        if claims.get('role') != 'student':
            return jsonify({'error': 'Student access required'}), 403

        student_id = claims.get('sub')
        supabase = get_supabase()

        document = (
            supabase.table('documents')
            .select('*')
            .eq('id', document_id)
            .eq('student_id', student_id)
            .execute()
        )
        if not document.data:
            return jsonify({'error': 'Document not found'}), 404

        filename = document.data[0].get('filename')
        filepath = document_file_path(filename or '')
        if not filepath or not os.path.exists(filepath):
            return jsonify({'error': 'Uploaded file not found on server'}), 404

        return send_file(filepath, as_attachment=False, download_name=filename)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/feedback', methods=['GET'])
@jwt_required()
def get_feedback():
    """Get admin feedback for the current student."""
    try:
        student_id = get_jwt_identity()
        supabase = get_supabase()

        result = (
            supabase.table('application_feedback')
            .select('*')
            .eq('student_id', student_id)
            .order('created_at', desc=True)
            .execute()
        )

        return jsonify(result.data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/feedback/<feedback_id>/read', methods=['PUT'])
@jwt_required()
def mark_feedback_read(feedback_id):
    """Mark one feedback item as read."""
    try:
        student_id = get_jwt_identity()
        supabase = get_supabase()

        result = (
            supabase.table('application_feedback')
            .update({'is_read': True})
            .eq('id', feedback_id)
            .eq('student_id', student_id)
            .execute()
        )

        return jsonify({'message': 'Feedback marked as read', 'data': result.data[0] if result.data else None}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
