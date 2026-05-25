import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/api';
import { LogOut, FileUp, Clock, User, Hash } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, statusRes, feedbackRes] = await Promise.all([
        studentService.getProfile(),
        studentService.getApplicationStatus(),
        studentService.getFeedback(),
      ]);
      setProfile(profileRes.data);
      setApplicationStatus(statusRes.data);
      setFeedback(feedbackRes.data || []);
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

  const getCourseChoiceBadge = (course_choice: any) => {
    if (course_choice.status === 'enrolled') return 'Approved Choice';
    if (course_choice.status === 'not_selected') return 'Not Selected';
    return 'Pending Review';
  };

  const getStudentId = () => {
    if (profile?.student_id) return profile.student_id;

    const source = String(profile?.id || profile?.email || 'student');
    const hash = [...source].reduce((total, char) => total + char.charCodeAt(0), 0) % 10000;
    return `26-UR-${String(hash || 151).padStart(4, '0')}`;
  };

  const isApproved = applicationStatus?.overall_status === 'approved';

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
      <main className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-5">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-white rounded-xl shadow p-5 mb-5 border border-blue-100">
          <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-blue-50 to-transparent" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Student Dashboard</p>
              <h2 className="text-xl font-bold text-gray-900 mt-1 sm:text-2xl">
                Welcome, {profile?.first_name} {profile?.last_name}!
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-600">{profile?.email}</span>
                {isApproved ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 ring-1 ring-blue-100">
                    <Hash className="h-4 w-4" />
                    Student ID: {getStudentId()}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 ring-1 ring-blue-100">
                    Applicant
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/student/profile')}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 group-hover:bg-blue-100 transition">
                  <User className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition">Profile</span>
              </button>
              <button
                onClick={() => navigate('/student/documents')}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 ring-1 ring-green-100 group-hover:bg-green-100 transition">
                  <FileUp className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-green-600 transition">Documents</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className={`rounded-lg shadow p-5 mb-5 border ${getStatusColor(applicationStatus?.overall_status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">Application Status</p>
              <p className="text-xl font-bold capitalize mt-1">{applicationStatus?.overall_status || 'Pending'}</p>
            </div>
            <Clock className="w-10 h-10 opacity-50" />
          </div>
        </div>

        {feedback.length > 0 && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 shadow-sm">
            <p className="font-semibold">Latest Feedback</p>
            <p className="mt-1 text-sm">{feedback[0].message}</p>
          </div>
        )}


        {/* Course Choices */}
        {applicationStatus?.course_choices && applicationStatus.course_choices.length > 0 && (
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Course Choices</h3>
            <div className="space-y-3">
              {[...applicationStatus.course_choices]
                .sort((a: any, b: any) => (a.choice_rank || 1) - (b.choice_rank || 1))
                .map((course_choice: any) => (
                <div key={course_choice.id} className="flex flex-wrap justify-between items-center gap-2 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{course_choice.courses?.name || 'Unknown Course'}</p>
                    <p className="text-sm text-gray-600">
                      {course_choice.choice_rank === 2 ? 'Second Choice' : 'First Choice'} - Selected on{' '}
                      {new Date(course_choice.selected_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      course_choice.status === 'enrolled'
                        ? 'bg-green-100 text-green-800'
                        : course_choice.status === 'not_selected'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {getCourseChoiceBadge(course_choice)}
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
