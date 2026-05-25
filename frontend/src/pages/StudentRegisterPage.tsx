import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, studentService } from '../services/api';
import { AlertCircle } from 'lucide-react';

type FormValues = {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  province: string;
  zip_code: string;
  application_type: string;
  previous_school: string;
  strand: string;
  gpa: string;
  first_choice_course: string;
  second_choice_course: string;
  school_year: string;
  semester: string;
};

type DocumentKey = 'birth_certificate' | 'form_137' | 'good_moral' | 'id_photo';

const initialFormData: FormValues = {
  first_name: '',
  last_name: '',
  middle_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
  date_of_birth: '',
  gender: 'Male',
  address: '',
  city: '',
  province: 'Pangasinan',
  zip_code: '',
  application_type: 'Incoming Freshmen',
  previous_school: '',
  strand: '',
  gpa: '',
  first_choice_course: '',
  second_choice_course: '',
  school_year: '2026-2027',
  semester: 'First Semester',
};

const documentFields: Array<{ key: DocumentKey; label: string }> = [
  { key: 'birth_certificate', label: 'Birth Certificate (PSA)' },
  { key: 'form_137', label: 'Form 137 (Report Card)' },
  { key: 'good_moral', label: 'Certificate of Good Moral' },
  { key: 'id_photo', label: '2x2 ID Photo' },
];

const strandOptions = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'ICT', 'Arts and Design', 'Sports'];
const schoolYears = ['2026-2027', '2025-2026', '2024-2025'];
const semesters = ['First Semester', 'Second Semester', 'Summer'];
const maxFileSize = 5 * 1024 * 1024;
const passwordPolicyMessage = 'Password must include at least 1 uppercase letter, 1 number, and 1 special character.';

const StudentRegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormValues>(initialFormData);
  const [documents, setDocuments] = useState<Record<DocumentKey, File | null>>({
    birth_certificate: null,
    form_137: null,
    good_moral: null,
    id_photo: null,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({});
  const [documentSubmitAttempted, setDocumentSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await studentService.getAvailableCourses();
      setCourses(response.data);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError('Failed to load available courses.');
    }
  };

  const getFieldStep = (field: string) => {
    if (
      [
        'first_name',
        'last_name',
        'email',
        'phone',
        'password',
        'confirm_password',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'province',
        'zip_code',
      ].includes(field)
    ) {
      return 1;
    }
    if (['application_type', 'previous_school', 'strand', 'gpa'].includes(field)) return 2;
    if (['first_choice_course', 'second_choice_course', 'school_year', 'semester'].includes(field)) return 3;
    return 4;
  };

  const shouldShowError = (field: string) => Boolean(fieldErrors[field] && attemptedSteps[getFieldStep(field)]);
  const shouldShowStepError = Boolean(error && attemptedSteps[step]);
  const shouldShowDocumentError = (key: DocumentKey) => Boolean(documentSubmitAttempted && fieldErrors[key]);

  const inputClassName = (field: string) =>
    `w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
      shouldShowError(field) ? 'border-red-400 bg-red-50' : 'border-transparent bg-gray-100'
    }`;

  const fieldError = (field: string) =>
    shouldShowError(field) ? <p className="mt-1 text-sm text-red-600">{fieldErrors[field]}</p> : null;

  const documentFieldError = (field: DocumentKey) =>
    shouldShowDocumentError(field) ? <p className="mt-1 text-sm text-red-600">{fieldErrors[field]}</p> : null;

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleFileChange = (key: DocumentKey, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [key]: file }));
    setDocumentSubmitAttempted(false);
    setError('');
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep = (targetStep = step) => {
    const errors: Record<string, string> = {};
    const required = (field: keyof FormValues, message: string) => {
      if (!String(formData[field]).trim()) errors[field] = message;
    };

    if (targetStep === 1) {
      required('first_name', 'First name is required');
      required('last_name', 'Last name is required');
      required('email', 'Email address is required');
      required('phone', 'Phone number is required');
      required('password', 'Password is required');
      required('confirm_password', 'Confirm password is required');
      required('date_of_birth', 'Date of birth is required');
      required('gender', 'Gender is required');
      required('address', 'Complete address is required');
      required('city', 'City/Municipality is required');
      required('province', 'Province is required');
      required('zip_code', 'Zip code is required');

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Enter a valid email address';
      }
      if (formData.phone && !/^09\d{9}$/.test(formData.phone)) {
        errors.phone = 'Enter a valid PH mobile number, like 09123456789';
      }
      if (formData.password && formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (formData.password && !/[A-Z]/.test(formData.password)) {
        errors.password = passwordPolicyMessage;
      } else if (formData.password && !/\d/.test(formData.password)) {
        errors.password = passwordPolicyMessage;
      } else if (formData.password && !/[^A-Za-z0-9]/.test(formData.password)) {
        errors.password = passwordPolicyMessage;
      }
      if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
        errors.confirm_password = 'Passwords do not match';
      }
      if (formData.date_of_birth) {
        const parsedDate = new Date(`${formData.date_of_birth}T00:00:00`);
        if (Number.isNaN(parsedDate.getTime())) {
          errors.date_of_birth = 'Enter a valid date of birth';
        } else if (parsedDate > new Date()) {
          errors.date_of_birth = 'Date of birth cannot be in the future';
        }
      }
      if (formData.zip_code && !/^\d{4}$/.test(formData.zip_code)) {
        errors.zip_code = 'Zip code must be 4 digits';
      }
    }

    if (targetStep === 2) {
      required('application_type', 'Application type is required');
      required('previous_school', 'Previous school is required');
      required('strand', 'Strand/Track is required');
      required('gpa', 'General weighted average is required');
      const gwa = Number(formData.gpa);
      if (formData.gpa && (Number.isNaN(gwa) || gwa < 75 || gwa > 100)) {
        errors.gpa = 'GWA must be from 75 to 100';
      }
    }

    if (targetStep === 3) {
      required('first_choice_course', 'First choice course is required');
      required('second_choice_course', 'Second choice course is required');
      required('school_year', 'School year is required');
      required('semester', 'Semester is required');
      if (
        formData.first_choice_course &&
        formData.second_choice_course &&
        formData.first_choice_course === formData.second_choice_course
      ) {
        errors.second_choice_course = 'Second choice must be different from first choice';
      }
    }

    if (targetStep === 4) {
      documentFields.forEach(({ key }) => {
        const file = documents[key];
        if (!file) {
          errors[key] = 'This document is required';
        } else if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
          errors[key] = 'Accepted formats: PDF, JPG, JPEG, PNG';
        } else if (file.size > maxFileSize) {
          errors[key] = 'File must be 5MB or smaller';
        }
      });
    }

    setFieldErrors(errors);
    setError(Object.keys(errors).length ? 'Please complete the required fields correctly.' : '');
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    setAttemptedSteps((prev) => ({ ...prev, [step]: true }));
    if (validateStep(step)) setStep((prev) => Math.min(prev + 1, 4));
  };

  const goPrevious = () => {
    setError('');
    setFieldErrors({});
    setDocumentSubmitAttempted(false);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAttemptedSteps((prev) => ({ ...prev, 4: true }));
    setDocumentSubmitAttempted(true);
    if (!validateStep(4)) return;

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value.trim()));
    documentFields.forEach(({ key }) => {
      const file = documents[key];
      if (file) payload.append(key, file);
    });

    setLoading(true);
    setError('');
    try {
      const response = await authService.studentApplicationRegister(payload);
      login(
        response.data.access_token,
        { id: response.data.student_id, email: response.data.email },
        'student'
      );
      navigate('/student/dashboard');
    } catch (err: any) {
      if (err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
        setDocumentSubmitAttempted(true);
      }
      setError(err.response?.data?.error || 'Application submission failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepper = () => (
    <div className="mb-9 flex items-center">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex flex-1 items-center last:flex-none">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold ${
              step >= item ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {item}
          </div>
          {item < 4 && (
            <div className={`mx-3 h-1 flex-1 ${step > item ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderTextInput = (
    name: keyof FormValues,
    label: string,
    options: { type?: string; placeholder?: string; required?: boolean } = {}
  ) => (
    <div>
      <label className="mb-2 block font-semibold text-gray-900">
        {label}{options.required ? ' *' : ''}
      </label>
      <input
        type={options.type || 'text'}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={options.placeholder}
        className={inputClassName(name)}
      />
      {fieldError(name)}
    </div>
  );

  const renderSelect = (name: keyof FormValues, label: string, options: string[] | any[], placeholder: string) => (
    <div>
      <label className="mb-2 block font-semibold text-gray-900">{label} *</label>
      <select name={name} value={formData[name]} onChange={handleChange} className={inputClassName(name)}>
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.id;
          const labelText = typeof option === 'string' ? option : `${option.code ? `${option.code} - ` : ''}${option.name}`;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
      {fieldError(name)}
    </div>
  );

  const stepContent = () => {
    if (step === 1) {
      return (
        <section className="space-y-5">
          <h2 className="text-2xl font-bold text-gray-950">Personal Information</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {renderTextInput('first_name', 'First Name', { required: true })}
            {renderTextInput('last_name', 'Last Name', { required: true })}
            {renderTextInput('middle_name', 'Middle Name')}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {renderTextInput('email', 'Email Address', { type: 'email', required: true })}
            {renderTextInput('phone', 'Phone Number', { placeholder: '09XXXXXXXXX', required: true })}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              {renderTextInput('password', 'Create Password', {
                type: 'password',
                placeholder: 'Minimum 8 characters',
                required: true,
              })}
              <p className="mt-2 text-sm text-gray-500">You'll use this to login to your student account</p>
            </div>
            {renderTextInput('confirm_password', 'Confirm Password', {
              type: 'password',
              placeholder: 'Re-type your password',
              required: true,
            })}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {renderTextInput('date_of_birth', 'Date of Birth', { type: 'date', required: true })}
            <div>
              <label className="mb-4 block font-semibold text-gray-900">Gender *</label>
              <div className="flex gap-6">
                {['Male', 'Female'].map((gender) => (
                  <label key={gender} className="flex items-center gap-2 font-semibold">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={handleChange}
                    />
                    {gender}
                  </label>
                ))}
              </div>
              {fieldError('gender')}
            </div>
          </div>
          {renderTextInput('address', 'Street/Barangay', {
            placeholder: 'Street, Barangay',
            required: true,
          })}
          <div className="grid gap-5 md:grid-cols-3">
            {renderTextInput('city', 'City/Municipality', { required: true })}
            {renderTextInput('province', 'Province', { required: true })}
            {renderTextInput('zip_code', 'Zip Code', { required: true })}
          </div>
        </section>
      );
    }

    if (step === 2) {
      return (
        <section className="space-y-5">
          <h2 className="text-2xl font-bold text-gray-950">Academic Background</h2>
          <div>
            <label className="mb-3 block font-semibold text-gray-900">Application Type *</label>
            <div className="flex gap-6">
              {['Incoming Freshmen', 'Transferee'].map((type) => (
                <label key={type} className="flex items-center gap-2 font-semibold">
                  <input
                    type="radio"
                    name="application_type"
                    value={type}
                    checked={formData.application_type === type}
                    onChange={handleChange}
                  />
                  {type}
                </label>
              ))}
            </div>
            {fieldError('application_type')}
          </div>
          {renderTextInput('previous_school', 'Previous School', {
            placeholder: 'Name of your previous school',
            required: true,
          })}
          <div className="grid gap-5 md:grid-cols-2">
            {renderSelect('strand', 'Strand/Track', strandOptions, 'Select strand')}
            {renderTextInput('gpa', 'General Weighted Average', {
              type: 'number',
              placeholder: '85.00',
              required: true,
            })}
          </div>
        </section>
      );
    }

    if (step === 3) {
      return (
        <section className="space-y-5">
          <h2 className="text-2xl font-bold text-gray-950">Course Selection</h2>
          {renderSelect('first_choice_course', 'First Choice Course', courses, 'Select your first choice')}
          {renderSelect('second_choice_course', 'Second Choice Course', courses, 'Select your second choice')}
          <div className="grid gap-5 md:grid-cols-2">
            {renderSelect('school_year', 'School Year', schoolYears, 'Select school year')}
            {renderSelect('semester', 'Semester', semesters, 'Select semester')}
          </div>
        </section>
      );
    }

    return (
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-gray-950">Upload Required Documents</h2>
        {documentFields.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-2 block font-semibold text-gray-900">{label} *</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => handleFileChange(key, event.target.files?.[0] || null)}
              className={`w-full rounded-xl px-4 py-3 file:mr-3 file:border-0 file:bg-transparent file:font-semibold ${
                shouldShowDocumentError(key) ? 'bg-red-50 text-red-700' : 'bg-gray-100'
              }`}
            />
            {documents[key] && <p className="mt-1 text-sm text-gray-500">Selected: {documents[key]?.name}</p>}
            {documentFieldError(key)}
          </div>
        ))}
        <div className="rounded-xl bg-yellow-50 px-5 py-4 text-yellow-800">
          <span className="font-bold">Note:</span> Please ensure all documents are clear and readable. Accepted
          formats: PDF, JPG, PNG (Max 5MB per file)
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8 text-gray-950">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="w-full rounded-lg bg-white p-5 shadow-xl sm:p-8 md:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800">Student Application</h1>
            <p className="mt-2 text-gray-600">Complete your admission application</p>
          </div>

          {renderStepper()}

          {shouldShowStepError && (
            <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {stepContent()}

            <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-8">
              <button
                type="button"
                onClick={goPrevious}
                disabled={step === 1 || loading}
                className={`rounded-xl border px-6 py-3 font-bold ${
                  step === 1 ? 'invisible' : 'border-gray-200 bg-white text-gray-950 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-xl bg-gray-950 px-7 py-3 font-bold text-white hover:bg-gray-800"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-gray-950 px-7 py-3 font-bold text-white hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-semibold text-blue-600 hover:underline">
              Login here
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default StudentRegisterPage;
