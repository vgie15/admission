from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.utils import get_supabase
from werkzeug.utils import secure_filename
import os
from datetime import datetime

student_bp = Blueprint('student', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save file
        filename = secure_filename(f"{student_id}_{document_type}_{datetime.now().timestamp()}_{file.filename}")
        upload_folder = os.getenv('UPLOAD_FOLDER', './uploads')
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        # Record in database
        supabase = get_supabase()
        doc_data = {
            'student_id': student_id,
            'document_type': document_type,
            'filename': filename,
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
    """Get available courses for enrollment"""
    try:
        supabase = get_supabase()
        result = supabase.table('courses').select('*').execute()
        
        return jsonify(result.data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/course-selection', methods=['POST'])
@jwt_required()
def select_course():
    """Select course"""
    try:
        student_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('course_id'):
            return jsonify({'error': 'Course ID required'}), 400
        
        supabase = get_supabase()
        
        # Check if course exists
        course = supabase.table('courses').select('*').eq('id', data['course_id']).execute()
        if not course.data:
            return jsonify({'error': 'Course not found'}), 404
        
        # Create enrollment record
        enrollment_data = {
            'student_id': student_id,
            'course_id': data['course_id'],
            'selected_at': datetime.now().isoformat()
        }
        
        result = supabase.table('enrollments').insert(enrollment_data).execute()
        
        return jsonify({
            'message': 'Course selected successfully',
            'enrollment_id': result.data[0]['id'] if result.data else None
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
        
        # Get enrollments
        enrollments = supabase.table('enrollments').select('*, courses(*)').eq('student_id', student_id).execute()
        
        return jsonify({
            'student_id': student_id,
            'overall_status': student.data[0].get('status', 'pending'),
            'enrollments': enrollments.data
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
