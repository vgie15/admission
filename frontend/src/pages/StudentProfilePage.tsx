import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import { Save, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [decision, setDecision] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zip_code: '',
    strand: '',
    gpa: '',
    previous_school: '',
    gender: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await studentService.getProfile();
      const profile = response.data;
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        middle_name: profile.middle_name || '',
        date_of_birth: profile.date_of_birth || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        province: profile.province || '',
        zip_code: profile.zip_code || '',
        strand: profile.strand || '',
        gpa: profile.gpa || '',
        previous_school: profile.previous_school || '',
        gender: profile.gender || '',
      });
      setDecision(profile);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    const requiredFields: Array<[keyof typeof formData, string]> = [
      ['first_name', 'First name is required'],
      ['last_name', 'Last name is required'],
      ['gender', 'Please select a gender'],
      ['phone', 'Phone number is required'],
      ['date_of_birth', 'Date of birth is required'],
      ['address', 'Street/Barangay is required'],
      ['city', 'City is required'],
      ['province', 'Province is required'],
      ['zip_code', 'Zip code is required'],
      ['strand', 'Strand is required'],
      ['gpa', 'GPA is required'],
      ['previous_school', 'Previous school is required'],
    ];

    requiredFields.forEach(([field, message]) => {
      if (!String(formData[field]).trim()) {
        errors[field] = message;
      }
    });

    if (formData.phone.trim() && !/^(09\d{9}|\+639\d{9})$/.test(formData.phone.trim())) {
      errors.phone = 'Enter a valid PH mobile number, like 09123456789 or +639123456789';
    }

    if (formData.date_of_birth) {
      const birthDate = new Date(`${formData.date_of_birth}T00:00:00`);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (Number.isNaN(birthDate.getTime())) {
        errors.date_of_birth = 'Enter a valid date of birth';
      } else if (birthDate > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future';
      } else if (adjustedAge < 15) {
        errors.date_of_birth = 'Student must be at least 15 years old';
      }
    }

    if (formData.zip_code.trim() && !/^\d{4}$/.test(formData.zip_code.trim())) {
      errors.zip_code = 'Zip code must be 4 digits';
    }

    if (formData.gpa.trim()) {
      const gpa = Number(formData.gpa);
      if (Number.isNaN(gpa) || gpa < 75 || gpa > 100) {
        errors.gpa = 'GPA must be a number from 75 to 100';
      }
    }

    return errors;
  };

  const inputClassName = (field: string) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? <p className="mt-1 text-sm text-red-600">{fieldErrors[field]}</p> : null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccess(false);

    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please complete the required fields correctly.');
      return;
    }

    setLoading(true);

    try {
      const payload = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value.trim()])
      );
      await studentService.updateProfile(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionDisplay = () => {
    if (!decision || !decision.status) {
      return {
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
        title: 'Application Pending',
        body: 'Your application is still pending review.',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      };
    }

    if (decision.status === 'approved') {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        title: 'Application Accepted',
        body: decision.admin_notes || 'Your application has been accepted.',
        className: 'bg-green-50 border-green-200 text-green-800',
      };
    }

    if (decision.status === 'rejected') {
      return {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        title: 'Application Declined',
        body: decision.rejection_reason || 'Your application has been declined.',
        className: 'bg-red-50 border-red-200 text-red-800',
      };
    }

    return {
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      title: 'Application Pending',
      body: 'Your application is still pending review.',
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    };
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const decisionDisplay = getDecisionDisplay();

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="Profile Information"
        subtitle="Review and update your application profile"
        backLabel="Back to Dashboard"
        onBack={() => navigate('/student/dashboard')}
      />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">Profile updated successfully! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={inputClassName('first_name')}
                  />
                  {renderFieldError('first_name')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={inputClassName('last_name')}
                  />
                  {renderFieldError('last_name')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    className={inputClassName('middle_name')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={inputClassName('gender')}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {renderFieldError('gender')}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClassName('phone')}
                  />
                  {renderFieldError('phone')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className={inputClassName('date_of_birth')}
                  />
                  {renderFieldError('date_of_birth')}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street/Barangay</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClassName('address')}
                  />
                  {renderFieldError('address')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City/Municipality</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={inputClassName('city')}
                    />
                    {renderFieldError('city')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className={inputClassName('province')}
                    />
                    {renderFieldError('province')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleChange}
                      className={inputClassName('zip_code')}
                    />
                    {renderFieldError('zip_code')}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strand</label>
                  <input
                    type="text"
                    name="strand"
                    value={formData.strand}
                    onChange={handleChange}
                    className={inputClassName('strand')}
                  />
                  {renderFieldError('strand')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                  <input
                    type="number"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleChange}
                    step="0.01"
                    min="75"
                    max="100"
                    className={inputClassName('gpa')}
                  />
                  {renderFieldError('gpa')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous School</label>
                  <input
                    type="text"
                    name="previous_school"
                    value={formData.previous_school}
                    onChange={handleChange}
                    className={inputClassName('previous_school')}
                  />
                  {renderFieldError('previous_school')}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Profile'}
            </button>

            <div className={`flex gap-3 rounded-lg border p-4 ${decisionDisplay.className}`}>
              {decisionDisplay.icon}
              <div>
                <h3 className="font-semibold">{decisionDisplay.title}</h3>
                <p className="text-sm mt-1">{decisionDisplay.body}</p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default StudentProfilePage;
