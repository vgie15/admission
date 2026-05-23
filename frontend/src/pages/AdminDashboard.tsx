import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';
import { LogOut, Users, Download, BookOpen } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const courseChartColors = ['#3b82f6', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const wrapChartLabel = (label: string, maxLength = 28) => {
  const words = label.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

const courseDistributionOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '52%',
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        boxWidth: 44,
        padding: 18,
      },
    },
    tooltip: {
      callbacks: {
        title: (items: any[]) => wrapChartLabel(items[0]?.label || ''),
        label: (item: any) => `Applicants: ${item.formattedValue}`,
      },
    },
  },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, role } = useAuth();
  const isRegistrar = role === 'registrar';
  const [stats, setStats] = useState<any>(null);
  const [enrollmentTrend, setEnrollmentTrend] = useState<any>(null);
  const [applicantsPerCourse, setApplicantsPerCourse] = useState<any>(null);
  const [genderDistribution, setGenderDistribution] = useState<any>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<any>(null);
  const [approvalRate, setApprovalRate] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    school_year: '2026-2027',
    semester: '',
    course: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const activeFilters = () => {
    const params: any = {};
    if (filters.school_year) params.school_year = filters.school_year;
    if (filters.semester) params.semester = filters.semester;
    if (filters.course) params.course = filters.course;
    return params;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = activeFilters();
      const [
        statsRes,
        trendRes,
        courseRes,
        genderRes,
        statusRes,
        rateRes,
        coursesRes,
      ] = await Promise.all([
        adminService.getDashboardStats(params),
        adminService.getEnrollmentTrend(params),
        adminService.getApplicantsPerCourse(params),
        adminService.getGenderDistribution(params),
        adminService.getEnrollmentStatus(params),
        adminService.getApprovalRatePerCourse(params),
        adminService.getCourses(),
      ]);

      setStats(statsRes.data);
      setEnrollmentTrend(trendRes.data);
      setApplicantsPerCourse(courseRes.data);
      setGenderDistribution(genderRes.data);
      setEnrollmentStatus(statusRes.data);
      setApprovalRate(rateRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExport = async () => {
    try {
      const response = await adminService.exportData(activeFilters());
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title={isRegistrar ? 'Registrar Dashboard' : 'Admin Dashboard'}
        subtitle={isRegistrar ? 'View-only admission analytics and data visualizations' : 'Admission management and application analytics'}
        actions={
          <>
            {!isRegistrar && (
              <>
                <button
                  onClick={() => navigate('/admin/applicants')}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                >
                  <Users className="w-4 h-4" />
                  View Applicants
                </button>
                <button
                  onClick={() => navigate('/admin/courses')}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                >
                  <BookOpen className="w-4 h-4" />
                  Manage Courses
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 font-semibold shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        }
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Panel */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_1fr_1.2fr_auto] md:items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">School Year</label>
              <select
                value={filters.school_year}
                onChange={(e) => handleFilterChange('school_year', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All School Years</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Semester</label>
              <select
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Semesters</option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="summer">Summer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Filter by Course</label>
              <select
                value={filters.course}
                onChange={(e) => handleFilterChange('course', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code ? `${course.code} - ${course.name}` : course.name}
                  </option>
                ))}
              </select>
            </div>

            {!isRegistrar && (
              <button
                onClick={handleExport}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 font-bold text-white hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Applicants</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_applicants || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats?.total_approved || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats?.total_pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats?.total_rejected || 0}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Enrollment Trend */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trend</h3>
            {enrollmentTrend && Object.keys(enrollmentTrend).length > 0 && (
              <div className="h-[320px]">
                <Line
                  data={{
                    labels: Object.keys(enrollmentTrend),
                    datasets: [
                      {
                        label: 'Enrollments',
                        data: Object.values(enrollmentTrend),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            )}
          </div>

          {/* Applicants per Course */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicants per Course</h3>
            {applicantsPerCourse && Object.keys(applicantsPerCourse).length > 0 && (
              <div className="h-[320px]">
                <Bar
                  data={{
                    labels: Object.keys(applicantsPerCourse),
                    datasets: [
                      {
                        label: 'Number of Applicants',
                        data: Object.values(applicantsPerCourse),
                        backgroundColor: '#10b981',
                      },
                    ],
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            )}
          </div>

          {/* Course Distribution */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Distribution</h3>
            {applicantsPerCourse && Object.keys(applicantsPerCourse).length > 0 ? (
                <div className="mx-auto h-[320px] w-full max-w-[360px]">
                  <Doughnut
                    data={{
                      labels: Object.keys(applicantsPerCourse),
                      datasets: [
                        {
                          data: Object.values(applicantsPerCourse),
                          backgroundColor: Object.keys(applicantsPerCourse).map(
                            (_, index) => courseChartColors[index % courseChartColors.length]
                          ),
                          borderColor: '#ffffff',
                          borderWidth: 5,
                          hoverOffset: 8,
                        },
                      ],
                    }}
                    options={courseDistributionOptions}
                  />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No course distribution data available.</p>
            )}
          </div>

          {/* Gender Distribution */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
            {genderDistribution && Object.keys(genderDistribution).length > 0 && (
              <div className="mx-auto h-[320px] w-full max-w-[360px]">
                <Doughnut
                  data={{
                    labels: Object.keys(genderDistribution),
                    datasets: [
                      {
                        data: Object.values(genderDistribution),
                        backgroundColor: ['#ec4899', '#3b82f6', '#8b5cf6'],
                        borderColor: '#ffffff',
                        borderWidth: 4,
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              </div>
            )}
          </div>

          {/* Enrollment Status */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Status</h3>
            {enrollmentStatus && Object.keys(enrollmentStatus).length > 0 && (
              <div className="mx-auto h-[320px] w-full max-w-[360px]">
                <Pie
                  data={{
                    labels: Object.keys(enrollmentStatus),
                    datasets: [
                      {
                        data: Object.values(enrollmentStatus),
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderColor: '#ffffff',
                        borderWidth: 4,
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              </div>
            )}
          </div>

          {/* Approval Rate per Course */}
          <div className="bg-white rounded-lg shadow p-6 min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Rate per Course</h3>
            {approvalRate && Object.keys(approvalRate).length > 0 && (
              <div className="h-[320px]">
                <Bar
                  data={{
                    labels: Object.keys(approvalRate),
                    datasets: [
                      {
                        label: 'Approval Rate (%)',
                        data: Object.values(approvalRate),
                        backgroundColor: '#8b5cf6',
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }}
                />
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
