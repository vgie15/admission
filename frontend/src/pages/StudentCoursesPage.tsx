import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import { AlertCircle, CheckCircle } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const StudentCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const [coursesResponse, statusResponse] = await Promise.all([
        studentService.getAvailableCourses(),
        studentService.getApplicationStatus(),
      ]);
      setCourses(coursesResponse.data);
      setApplicationStatus(statusResponse.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const existingChoices = applicationStatus?.course_choices || [];
  const approvedChoice = existingChoices.find((choice: any) => choice.status === 'enrolled');
  const selectedChoice = existingChoices[0];

  useEffect(() => {
    if (applicationStatus?.overall_status === 'approved' && approvedChoice?.courses?.name) {
      setNotice(`Application already approved for ${approvedChoice.courses.name}.`);
    } else if (existingChoices.length > 0) {
      setNotice('Course already selected.');
    }
  }, [applicationStatus]);

  const handleSelectCourse = async (courseId: string) => {
    if (applicationStatus?.overall_status === 'approved' && approvedChoice?.courses?.name) {
      setNotice(`Application already approved for ${approvedChoice.courses.name}.`);
      return;
    }

    if (existingChoices.length > 0) {
      setNotice('Course already selected.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await studentService.selectCourse(courseId);
      setSelectedCourse(courseId);
      setNotice('Course choice saved. Redirecting...');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (error: any) {
      setError(error?.response?.data?.error || 'Course selection failed.');
      console.error('Course selection failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="Course Selection"
        subtitle="Review available course choices for your application"
        backLabel="Back to Dashboard"
        onBack={() => navigate('/student/dashboard')}
      />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {notice && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{notice}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.length === 0 ? (
            <p className="col-span-2 text-gray-600">No courses available at the moment.</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.name}</h3>
                <p className="text-sm text-gray-600 mb-1">Code: {course.code}</p>
                <p className="text-gray-700 mb-4">{course.description}</p>
                <button
                  onClick={() => handleSelectCourse(course.id)}
                  disabled={submitting || selectedCourse === course.id || existingChoices.length > 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {approvedChoice?.course_id === course.id
                    ? 'Approved Choice'
                    : selectedChoice?.course_id === course.id || selectedCourse === course.id
                      ? 'Course Already Selected'
                      : existingChoices.length > 0
                        ? 'Selection Locked'
                        : submitting
                          ? 'Saving...'
                          : 'Select Course'}
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentCoursesPage;
