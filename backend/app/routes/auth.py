from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from app.utils import get_supabase
from functools import wraps
from datetime import datetime, timedelta
import os
import re
import secrets

# In-memory token store: { token: { email, expires_at } }
reset_tokens = {}

auth_bp = Blueprint('auth', __name__)

APPLICATION_DOCUMENTS = {
    'birth_certificate': 'Birth Certificate / PSA',
    'form_137': 'Form 137 / Report Card',
    'good_moral': 'Certificate of Good Moral',
    'id_photo': '2x2 ID Photo',
}
APPLICATION_FILE_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
MAX_APPLICATION_FILE_SIZE = 5 * 1024 * 1024

def allowed_application_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in APPLICATION_FILE_EXTENSIONS

def clean_form_value(data, key):
    return (data.get(key) or '').strip()

def password_policy_error(password):
    if len(password) < 8:
        return 'Password must be at least 8 characters'
    if not re.search(r'[A-Z]', password):
        return 'Password must include at least 1 uppercase letter, 1 number, and 1 special character.'
    if not re.search(r'\d', password):
        return 'Password must include at least 1 uppercase letter, 1 number, and 1 special character.'
    if not re.search(r'[^A-Za-z0-9]', password):
        return 'Password must include at least 1 uppercase letter, 1 number, and 1 special character.'
    return ''

def validate_application_form(data, files):
    errors = {}
    required_fields = {
        'first_name': 'First name is required',
        'last_name': 'Last name is required',
        'email': 'Email address is required',
        'phone': 'Phone number is required',
        'password': 'Password is required',
        'confirm_password': 'Confirm password is required',
        'date_of_birth': 'Date of birth is required',
        'gender': 'Gender is required',
        'address': 'Complete address is required',
        'city': 'City/Municipality is required',
        'province': 'Province is required',
        'zip_code': 'Zip code is required',
        'application_type': 'Application type is required',
        'previous_school': 'Previous school is required',
        'strand': 'Strand/Track is required',
        'gpa': 'General weighted average is required',
        'first_choice_course': 'First choice course is required',
        'second_choice_course': 'Second choice course is required',
        'school_year': 'School year is required',
        'semester': 'Semester is required',
    }

    for field, message in required_fields.items():
        if not clean_form_value(data, field):
            errors[field] = message

    email = clean_form_value(data, 'email')
    if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        errors['email'] = 'Enter a valid email address'

    phone = clean_form_value(data, 'phone')
    if phone and not re.match(r'^09\d{9}$', phone):
        errors['phone'] = 'Enter a valid PH mobile number, like 09123456789'

    password = clean_form_value(data, 'password')
    confirm_password = clean_form_value(data, 'confirm_password')
    if password:
        password_error = password_policy_error(password)
        if password_error:
            errors['password'] = password_error
    if password and confirm_password and password != confirm_password:
        errors['confirm_password'] = 'Passwords do not match'

    birth_date = clean_form_value(data, 'date_of_birth')
    if birth_date:
        try:
            parsed_birth_date = datetime.strptime(birth_date, '%Y-%m-%d').date()
            if parsed_birth_date > datetime.now().date():
                errors['date_of_birth'] = 'Date of birth cannot be in the future'
        except ValueError:
            errors['date_of_birth'] = 'Enter a valid date of birth'

    zip_code = clean_form_value(data, 'zip_code')
    if zip_code and not re.match(r'^\d{4}$', zip_code):
        errors['zip_code'] = 'Zip code must be 4 digits'

    gpa = clean_form_value(data, 'gpa')
    if gpa:
        try:
            numeric_gpa = float(gpa)
            if numeric_gpa < 75 or numeric_gpa > 100:
                errors['gpa'] = 'GWA must be from 75 to 100'
        except ValueError:
            errors['gpa'] = 'GWA must be a number from 75 to 100'

    if clean_form_value(data, 'first_choice_course') and clean_form_value(data, 'first_choice_course') == clean_form_value(data, 'second_choice_course'):
        errors['second_choice_course'] = 'Second choice must be different from first choice'

    for document_type, label in APPLICATION_DOCUMENTS.items():
        file = files.get(document_type)
        if not file or file.filename == '':
            errors[document_type] = f'{label} is required'
        elif not allowed_application_file(file.filename):
            errors[document_type] = 'Accepted formats: PDF, JPG, JPEG, PNG'
        else:
            file.seek(0, os.SEEK_END)
            size = file.tell()
            file.seek(0)
            if size > MAX_APPLICATION_FILE_SIZE:
                errors[document_type] = 'File must be 5MB or smaller'

    return errors

@auth_bp.route('/student-register', methods=['POST'])
def student_register():
    """Register new student"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['email', 'password', 'first_name', 'last_name']
        if not all(k in data for k in required):
            return jsonify({'error': 'Missing required fields'}), 400

        password_error = password_policy_error(data['password'])
        if password_error:
            return jsonify({'error': password_error, 'fields': {'password': password_error}}), 400
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Check if email already exists
        supabase = get_supabase()
        existing = supabase.table('students').select('*').eq('email', data['email']).execute()
        if existing.data:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create student record
        student_data = {
            'email': data['email'],
            'password': hashed_password,
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'role': 'student',
            'status': 'pending'
        }
        
        response = supabase.table('students').insert(student_data).execute()
        
        return jsonify({
            'message': 'Student registered successfully',
            'student_id': response.data[0]['id']
        }), 201
        
    except Exception as e:
        error_text = str(e)
        if 'application_type' in error_text or 'school_year' in error_text or 'semester' in error_text or 'choice_rank' in error_text:
            return jsonify({
                'error': 'Database needs the registration wizard schema update. Please run registration_wizard_schema_update.sql in Supabase SQL Editor, then try again.'
            }), 500
        return jsonify({'error': 'Application submission failed. Please try again.'}), 500

@auth_bp.route('/student-application-register', methods=['POST'])
def student_application_register():
    """Register a complete student application with profile, choices, and documents."""
    try:
        data = request.form
        files = request.files
        errors = validate_application_form(data, files)

        if errors:
            return jsonify({
                'error': 'Please complete the required fields correctly.',
                'fields': errors
            }), 400

        supabase = get_supabase()
        email = clean_form_value(data, 'email')
        existing = supabase.table('students').select('id').eq('email', email).execute()
        if existing.data:
            return jsonify({
                'error': 'Email already registered',
                'fields': {'email': 'Email already registered'}
            }), 409

        for course_field in ['first_choice_course', 'second_choice_course']:
            course_id = clean_form_value(data, course_field)
            course = supabase.table('courses').select('id').eq('id', course_id).execute()
            if not course.data:
                return jsonify({
                    'error': 'Selected course was not found.',
                    'fields': {course_field: 'Selected course was not found'}
                }), 400

        student_data = {
            'email': email,
            'password': generate_password_hash(clean_form_value(data, 'password')),
            'first_name': clean_form_value(data, 'first_name'),
            'last_name': clean_form_value(data, 'last_name'),
            'middle_name': clean_form_value(data, 'middle_name') or None,
            'gender': clean_form_value(data, 'gender'),
            'date_of_birth': clean_form_value(data, 'date_of_birth'),
            'phone': clean_form_value(data, 'phone'),
            'address': clean_form_value(data, 'address'),
            'city': clean_form_value(data, 'city'),
            'province': clean_form_value(data, 'province'),
            'zip_code': clean_form_value(data, 'zip_code'),
            'strand': clean_form_value(data, 'strand'),
            'gpa': clean_form_value(data, 'gpa'),
            'previous_school': clean_form_value(data, 'previous_school'),
            'application_type': clean_form_value(data, 'application_type'),
            'school_year': clean_form_value(data, 'school_year'),
            'semester': clean_form_value(data, 'semester'),
            'role': 'student',
            'status': 'pending',
        }

        student_response = supabase.table('students').insert(student_data).execute()
        student = student_response.data[0]
        student_id = student['id']

        course_choice_rows = [
            {
                'student_id': student_id,
                'course_id': clean_form_value(data, 'first_choice_course'),
                'choice_rank': 1,
                'status': 'selected',
                'selected_at': datetime.now().isoformat(),
            },
            {
                'student_id': student_id,
                'course_id': clean_form_value(data, 'second_choice_course'),
                'choice_rank': 2,
                'status': 'selected',
                'selected_at': datetime.now().isoformat(),
            },
        ]
        supabase.table('course_choices').insert(course_choice_rows).execute()

        upload_folder = os.getenv('UPLOAD_FOLDER', './uploads')
        os.makedirs(upload_folder, exist_ok=True)
        document_rows = []

        for document_type in APPLICATION_DOCUMENTS.keys():
            file = files[document_type]
            filename = secure_filename(f"{student_id}_{document_type}_{datetime.now().timestamp()}_{file.filename}")
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            document_rows.append({
                'student_id': student_id,
                'document_type': document_type,
                'filename': filename,
                'file_path': filepath,
                'uploaded_at': datetime.now().isoformat(),
            })

        supabase.table('documents').insert(document_rows).execute()

        access_token = create_access_token(
            identity=student_id,
            additional_claims={'role': 'student', 'email': email}
        )

        return jsonify({
            'message': 'Application submitted successfully',
            'access_token': access_token,
            'student_id': student_id,
            'email': email,
            'role': 'student'
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/student-login', methods=['POST'])
def student_login():
    """Student login"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Get student from database
        supabase = get_supabase()
        result = supabase.table('students').select('*').eq('email', data['email']).execute()
        
        if not result.data:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        student = result.data[0]
        
        # Verify password
        if not check_password_hash(student['password'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create JWT token
        access_token = create_access_token(
            identity=student['id'],
            additional_claims={'role': 'student', 'email': student['email']}
        )
        
        return jsonify({
            'access_token': access_token,
            'student_id': student['id'],
            'email': student['email'],
            'role': 'student'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/admin-login', methods=['POST'])
def admin_login():
    """Admin login"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Get admin from database
        supabase = get_supabase()
        result = supabase.table('admins').select('*').eq('email', data['email']).execute()
        
        if not result.data:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        admin = result.data[0]
        
        # Verify password
        if not check_password_hash(admin['password'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        role = admin.get('role', 'admin')

        # Create JWT token
        access_token = create_access_token(
            identity=admin['id'],
            additional_claims={'role': role, 'email': admin['email']}
        )
        
        return jsonify({
            'access_token': access_token,
            'admin_id': admin['id'],
            'email': admin['email'],
            'role': role
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify JWT token"""
    try:
        identity = get_jwt_identity()
        return jsonify({
            'valid': True,
            'user_id': identity
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send a 6-digit reset code to the student's email"""
    try:
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        supabase = get_supabase()
        result = supabase.table('students').select('id, first_name').eq('email', email).execute()
        if not result.data:
            return jsonify({'error': 'No account found with that email address.'}), 404

        student = result.data[0]
        first_name = student.get('first_name', 'Student')

        # Generate a 6-digit code valid for 15 minutes
        code = str(secrets.randbelow(900000) + 100000)
        reset_tokens[email] = {
            'code': code,
            'expires_at': datetime.now() + timedelta(minutes=15),
        }

        from app import mail
        msg = Message(
            subject='PSU-UCC Admission Portal – Password Reset Code',
            recipients=[email],
        )
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #1e40af; margin: 0;">PSU-UCC Admission Portal</h2>
                <p style="color: #6b7280; font-size: 14px;">Incoming Freshmen Application System</p>
            </div>
            <div style="background: white; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
                <p style="color: #111827; font-size: 16px;">Hi <strong>{first_name}</strong>,</p>
                <p style="color: #374151;">Use the code below to reset your password. This code expires in <strong>15 minutes</strong>.</p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px 40px;">
                        <p style="margin: 0; font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #1d4ed8;">{code}</p>
                    </div>
                </div>
                <p style="color: #6b7280; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        </div>
        """
        mail.send(msg)

        return jsonify({'message': 'Reset code sent to your email.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """Verify the 6-digit reset code"""
    try:
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()
        code = (data.get('code') or '').strip()

        if not email or not code:
            return jsonify({'error': 'Email and code are required'}), 400

        token_data = reset_tokens.get(email)
        if not token_data:
            return jsonify({'error': 'No reset code found. Please request a new one.'}), 400

        if datetime.now() > token_data['expires_at']:
            del reset_tokens[email]
            return jsonify({'error': 'Code has expired. Please request a new one.'}), 400

        if token_data['code'] != code:
            return jsonify({'error': 'Incorrect code. Please try again.'}), 400

        return jsonify({'message': 'Code verified.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password after code has been verified"""
    try:
        data = request.get_json()
        email = (data.get('email') or '').strip().lower()
        code = (data.get('code') or '').strip()
        new_password = (data.get('new_password') or '').strip()
        confirm_password = (data.get('confirm_password') or '').strip()

        if not email or not code or not new_password or not confirm_password:
            return jsonify({'error': 'All fields are required'}), 400

        if new_password != confirm_password:
            return jsonify({'error': 'Passwords do not match', 'fields': {'confirm_password': 'Passwords do not match'}}), 400

        password_error = password_policy_error(new_password)
        if password_error:
            return jsonify({'error': password_error, 'fields': {'new_password': password_error}}), 400

        token_data = reset_tokens.get(email)
        if not token_data:
            return jsonify({'error': 'No reset code found. Please request a new one.'}), 400

        if datetime.now() > token_data['expires_at']:
            del reset_tokens[email]
            return jsonify({'error': 'Code has expired. Please request a new one.'}), 400

        if token_data['code'] != code:
            return jsonify({'error': 'Incorrect code.'}), 400

        supabase = get_supabase()
        hashed = generate_password_hash(new_password)
        supabase.table('students').update({'password': hashed}).eq('email', email).execute()

        del reset_tokens[email]

        return jsonify({'message': 'Password reset successfully. You can now log in.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
