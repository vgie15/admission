import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import { CheckCircle } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const StudentCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await studentService.getAvailableCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrolling(true);
    try {
      await studentService.selectCourse(courseId);
      setSelectedCourse(courseId);
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setEnrolling(false);
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        {selectedCourse && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">Successfully enrolled! Redirecting...</p>
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
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrolling || selectedCourse === course.id}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {selectedCourse === course.id ? 'Enrolled!' : enrolling ? 'Enrolling...' : 'Enroll Now'}
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
