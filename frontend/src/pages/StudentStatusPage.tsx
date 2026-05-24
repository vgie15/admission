import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const StudentStatusPage = () => {
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await studentService.getApplicationStatus();
      setApplicationStatus(response.data);
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-12 h-12 text-red-600" />;
      default:
        return <Clock className="w-12 h-12 text-yellow-600" />;
    }
  };

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

  const getCourseChoiceColor = (course_choice: any) => {
    if (course_choice.status === 'enrolled') return 'bg-green-50 border-green-200 text-green-800';
    if (course_choice.status === 'not_selected') return 'bg-gray-50 border-gray-200 text-gray-700';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="Application Status"
        subtitle="Track your admission application progress"
        backLabel="Back to Dashboard"
        onBack={() => navigate('/student/dashboard')}
      />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Status Card */}
        <div className={`rounded-lg shadow p-12 mb-8 border ${getStatusColor(applicationStatus?.overall_status)}`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon(applicationStatus?.overall_status)}
            </div>
            <h2 className="text-3xl font-bold mb-2 capitalize">
              {applicationStatus?.overall_status || 'Pending'}
            </h2>
            <p className="text-lg opacity-75">
              Your application status
            </p>
          </div>
        </div>

        {/* Course Choices */}
        {applicationStatus?.course_choices && applicationStatus.course_choices.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Course Choices</h3>
            <div className="space-y-4">
              {[...applicationStatus.course_choices]
                .sort((a: any, b: any) => (a.choice_rank || 1) - (b.choice_rank || 1))
                .map((course_choice: any) => (
                <div key={course_choice.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-blue-600 mb-1">
                        {course_choice.choice_rank === 2 ? 'Second Choice' : 'First Choice'}
                      </p>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {course_choice.courses?.name || 'Unknown Course'}
                      </h4>
                      <p className="text-gray-600">
                        Code: <span className="font-semibold">{course_choice.courses?.code}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Selected on {new Date(course_choice.selected_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getCourseChoiceColor(course_choice)}`}>
                      {getCourseChoiceBadge(course_choice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!applicationStatus?.course_choices || applicationStatus.course_choices.length === 0) && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">You have not selected any course choices yet.</p>
            <button
              onClick={() => navigate('/student/courses')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Select a Course
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentStatusPage;
