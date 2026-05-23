import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/api';
import { LogOut, FileUp, BookOpen, Clock, User, Hash } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, statusRes] = await Promise.all([
        studentService.getProfile(),
        studentService.getApplicationStatus(),
      ]);
      setProfile(profileRes.data);
      setApplicationStatus(statusRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getCourseChoiceBadge = (enrollment: any) => {
    if (enrollment.status === 'enrolled') return 'approved course';
    if (enrollment.status === 'not_selected') return 'not selected';
    return 'pending review';
  };

  const getApplicationNumber = () => {
    if (profile?.application_number) return profile.application_number;

    const source = String(profile?.id || profile?.email || 'student');
    const hash = [...source].reduce((total, char) => total + char.charCodeAt(0), 0) % 10000;
    return `26-UR-${String(hash || 151).padStart(4, '0')}`;
  };

  const hasOfficialStudentId = applicationStatus?.overall_status === 'approved' && profile?.student_id;
  const identityLabel = hasOfficialStudentId ? 'Student ID' : 'Application No.';
  const identityValue = hasOfficialStudentId ? profile.student_id : getApplicationNumber();

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="PSU-UCC Admission Portal"
        subtitle="Incoming Freshmen Application System"
        actions={
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 font-semibold shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        }
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-white rounded-xl shadow p-7 mb-8 border border-blue-100">
          <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-blue-50 to-transparent" />
          <div className="relative flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Student Dashboard</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                Welcome, {profile?.first_name} {profile?.last_name}!
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-600">{profile?.email}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 ring-1 ring-blue-100">
                  <Hash className="h-4 w-4" />
                  {identityLabel}: {identityValue}
                </span>
              </div>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <User className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className={`rounded-lg shadow p-6 mb-8 border ${getStatusColor(applicationStatus?.overall_status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">Application Status</p>
              <p className="text-2xl font-bold capitalize mt-1">{applicationStatus?.overall_status || 'Pending'}</p>
            </div>
            <Clock className="w-12 h-12 opacity-50" />
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => navigate('/student/profile')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
          >
            <User className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Profile Information</h3>
            <p className="text-gray-600 text-sm mt-1">Edit your basic info</p>
          </button>

          <button
            onClick={() => navigate('/student/documents')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
          >
            <FileUp className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Upload Documents</h3>
            <p className="text-gray-600 text-sm mt-1">Upload required docs</p>
          </button>

          <button
            onClick={() => navigate('/student/courses')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
          >
            <BookOpen className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Course Selection</h3>
            <p className="text-gray-600 text-sm mt-1">Choose your course</p>
          </button>

          <button
            onClick={() => navigate('/student/status')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
          >
            <Clock className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Status Tracking</h3>
            <p className="text-gray-600 text-sm mt-1">Check application status</p>
          </button>
        </div>

        {/* Course Choices */}
        {applicationStatus?.enrollments && applicationStatus.enrollments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Course Choices</h3>
            <div className="space-y-3">
              {[...applicationStatus.enrollments]
                .sort((a: any, b: any) => (a.choice_rank || 1) - (b.choice_rank || 1))
                .map((enrollment: any) => (
                <div key={enrollment.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{enrollment.courses?.name || 'Unknown Course'}</p>
                    <p className="text-sm text-gray-600">
                      {enrollment.choice_rank === 2 ? 'Second Choice' : 'First Choice'} - Selected on{' '}
                      {new Date(enrollment.selected_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      enrollment.status === 'enrolled'
                        ? 'bg-green-100 text-green-800'
                        : enrollment.status === 'not_selected'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {getCourseChoiceBadge(enrollment)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
