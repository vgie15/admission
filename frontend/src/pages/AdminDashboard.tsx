import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';
import { LogOut, Users, BookOpen, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
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
  const [applicationTrend, setApplicationTrend] = useState<any>(null);
  const [applicantsPerCourse, setApplicantsPerCourse] = useState<any>(null);
  const [firstChoiceDistribution, setFirstChoiceDistribution] = useState<any>(null);
  const [genderDistribution, setGenderDistribution] = useState<any>(null);
  const [approvedGenderDistribution, setApprovedGenderDistribution] = useState<any>(null);
  const [cityDistribution, setCityDistribution] = useState<any>(null);
  const [approvedCityDistribution, setApprovedCityDistribution] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [approvalRate, setApprovalRate] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [approvedAdmissions, setApprovedAdmissions] = useState<any[]>([]);
  const [approvedSort, setApprovedSort] = useState({
    sort_by: 'approved_at',
    sort_order: 'desc',
  });
  const [filters, setFilters] = useState({
    school_year: '',
    semester: '',
    course: '',
  });
  const [lastYearStats, setLastYearStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fallbackData = (result: PromiseSettledResult<any>, fallback: any = {}) =>
    result.status === 'fulfilled' ? result.value.data : fallback;

  useEffect(() => {
    loadDashboardData();
  }, [filters, approvedSort]);

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
      const results = await Promise.allSettled([
        adminService.getDashboardStats(params),
        adminService.getApplicationTrend(params),
        adminService.getApplicantsPerCourse(params),
        adminService.getFirstChoiceDistribution(params),
        adminService.getGenderDistribution(params),
        adminService.getApprovedGenderDistribution(params),
        adminService.getCityDistribution(params),
        adminService.getApprovedCityDistribution(params),
        adminService.getApplicationStatusDistribution(params),
        adminService.getApprovalRatePerCourse(params),
        adminService.getCourses(),
        adminService.getApprovedAdmissions({ ...params, ...approvedSort }),
      ]);

      const [
        statsRes,
        trendRes,
        courseRes,
        firstChoiceRes,
        genderRes,
        approvedGenderRes,
        cityRes,
        approvedCityRes,
        statusRes,
        rateRes,
        coursesRes,
        approvedAdmissionsRes,
      ] = results;

      const currentStats = fallbackData(statsRes, null);
      setStats(currentStats);

      // Load last year stats for KPI comparison arrows — only when a specific year is selected
      const selectedYear = params.school_year;
      if (selectedYear) {
        const parts = selectedYear.split('-');
        if (parts.length === 2) {
          const prevYear = `${parseInt(parts[0]) - 1}-${parseInt(parts[1]) - 1}`;
          try {
            const prevRes = await adminService.getDashboardStats({ ...params, school_year: prevYear });
            const prevData = prevRes.data;
            // Only show arrows if previous year actually has data
            if (prevData && prevData.total_applicants > 0) {
              setLastYearStats(prevData);
            } else {
              setLastYearStats(null);
            }
          } catch {
            setLastYearStats(null);
          }
        }
      } else {
        setLastYearStats(null);
      }

      setApplicationTrend(fallbackData(trendRes));
      setApplicantsPerCourse(fallbackData(courseRes));
      setFirstChoiceDistribution(fallbackData(firstChoiceRes));
      setGenderDistribution(fallbackData(genderRes));
      setApprovedGenderDistribution(fallbackData(approvedGenderRes));
      setCityDistribution(fallbackData(cityRes));
      setApprovedCityDistribution(fallbackData(approvedCityRes));
      setApplicationStatus(fallbackData(statusRes));
      setApprovalRate(fallbackData(rateRes));
      setCourses(fallbackData(coursesRes, []));
      setApprovedAdmissions(fallbackData(approvedAdmissionsRes, []));
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

  const getKpiChange = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === null || !lastYearStats) return null;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const KpiArrow = ({ pct }: { pct: number | null }) => {
    if (pct === null) return null;
    if (pct > 0)
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600">
          <TrendingUp className="w-3 h-3" />
          {pct}% vs last year
        </span>
      );
    if (pct < 0)
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500">
          <TrendingDown className="w-3 h-3" />
          {Math.abs(pct)}% vs last year
        </span>
      );
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-400">
        <Minus className="w-3 h-3" />
        No change vs last year
      </span>
    );
  };

  const handleExportApprovedAdmissions = async () => {
    try {
      const response = await adminService.exportApprovedAdmissions(activeFilters());
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'approved_admissions.xlsx');
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

  const handleApprovedSortChange = (name: string, value: string) => {
    setApprovedSort((prev) => ({ ...prev, [name]: value }));
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
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Filter Panel */}
        <div className="mb-5 sm:mb-8 rounded-2xl bg-white p-4 sm:p-6 shadow">
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

            {isRegistrar && (
              <button
                onClick={handleExportApprovedAdmissions}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 font-bold text-white hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-5 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <p className="text-gray-600 text-sm font-medium">Total Applicants</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats?.total_applicants || 0}</p>
            <div className="mt-2">
              <KpiArrow pct={getKpiChange(stats?.total_applicants || 0, lastYearStats?.total_applicants)} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <p className="text-gray-600 text-sm font-medium">Approved</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{stats?.total_approved || 0}</p>
            <div className="mt-2">
              <KpiArrow pct={getKpiChange(stats?.total_approved || 0, lastYearStats?.total_approved)} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-2">{stats?.total_pending || 0}</p>
            <div className="mt-2">
              <KpiArrow pct={getKpiChange(stats?.total_pending || 0, lastYearStats?.total_pending)} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <p className="text-gray-600 text-sm font-medium">Rejected</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">{stats?.total_rejected || 0}</p>
            <div className="mt-2">
              <KpiArrow pct={getKpiChange(stats?.total_rejected || 0, lastYearStats?.total_rejected)} />
            </div>
          </div>
        </div>

        {isRegistrar && (
          <div className="mb-5 sm:mb-8 rounded-2xl bg-white p-4 sm:p-6 shadow">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Approved for Admission</h3>
                <p className="text-sm text-gray-500">View-only list of students accepted for admission.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Sort by</label>
                  <select
                    value={approvedSort.sort_by}
                    onChange={(e) => handleApprovedSortChange('sort_by', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="approved_at">Approval Time</option>
                    <option value="course">Approved Course</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Order</label>
                  <select
                    value={approvedSort.sort_order}
                    onChange={(e) => handleApprovedSortChange('sort_order', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Approved Choice</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">School Year</th>
                    <th className="px-4 py-3">Approved At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approvedAdmissions.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                        No approved admission students found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    approvedAdmissions.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{student.approved_choice || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{student.approved_course_code}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{student.city || 'Not specified'}</td>
                        <td className="px-4 py-3 text-gray-700">{student.school_year || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {student.approved_at ? new Date(student.approved_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-8">
          {/* Application Trend */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Trend</h3>
            {applicationTrend && Object.keys(applicationTrend).length > 0 ? (
              <div className="h-[320px]">
                <Line
                  data={{
                    labels: Object.keys(applicationTrend),
                    datasets: [
                      {
                        label: 'Applications',
                        data: Object.values(applicationTrend),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No application trend data available.</p>
            )}
          </div>

          {/* Applicants per Course */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicants per Course</h3>
            {applicantsPerCourse && Object.keys(applicantsPerCourse).length > 0 ? (
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
            ) : (
              <p className="text-sm text-gray-500">No applicants per course data available.</p>
            )}
          </div>

          {/* First Choice Distribution */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">First Choice Distribution</h3>
            {firstChoiceDistribution && Object.keys(firstChoiceDistribution).length > 0 ? (
                <div className="mx-auto h-[320px] w-full max-w-[360px]">
                  <Doughnut
                    data={{
                      labels: Object.keys(firstChoiceDistribution),
                      datasets: [
                        {
                          data: Object.values(firstChoiceDistribution),
                          backgroundColor: Object.keys(firstChoiceDistribution).map(
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
              <p className="text-sm text-gray-500">No first choice distribution data available.</p>
            )}
          </div>

          {/* Overall Gender Distribution */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Gender Distribution</h3>
            {genderDistribution && Object.keys(genderDistribution).length > 0 ? (
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
            ) : (
              <p className="text-sm text-gray-500">No gender distribution data available.</p>
            )}
          </div>

          {/* Approved Gender Distribution */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approved Gender Distribution</h3>
            {approvedGenderDistribution && Object.keys(approvedGenderDistribution).length > 0 ? (
              <div className="mx-auto h-[320px] w-full max-w-[360px]">
                <Doughnut
                  data={{
                    labels: Object.keys(approvedGenderDistribution),
                    datasets: [
                      {
                        data: Object.values(approvedGenderDistribution),
                        backgroundColor: ['#ec4899', '#3b82f6', '#8b5cf6'],
                        borderColor: '#ffffff',
                        borderWidth: 4,
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No approved gender data available.</p>
            )}
          </div>

          {/* Overall City Distribution */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall City/Town Distribution</h3>
            {cityDistribution && Object.keys(cityDistribution).length > 0 ? (
              <div className="h-[320px]">
                <Bar
                  data={{
                    labels: Object.keys(cityDistribution),
                    datasets: [
                      {
                        label: 'Applicants',
                        data: Object.values(cityDistribution),
                        backgroundColor: '#06b6d4',
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No city/town data available.</p>
            )}
          </div>

          {/* Approved City Distribution */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approved City/Town Distribution</h3>
            {approvedCityDistribution && Object.keys(approvedCityDistribution).length > 0 ? (
              <div className="h-[320px]">
                <Bar
                  data={{
                    labels: Object.keys(approvedCityDistribution),
                    datasets: [
                      {
                        label: 'Approved Applicants',
                        data: Object.values(approvedCityDistribution),
                        backgroundColor: '#10b981',
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No approved city/town data available.</p>
            )}
          </div>

          {/* Application Status */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
            {applicationStatus && Object.keys(applicationStatus).length > 0 ? (
              <div className="mx-auto h-[320px] w-full max-w-[360px]">
                <Pie
                  data={{
                    labels: Object.keys(applicationStatus),
                    datasets: [
                      {
                        data: Object.values(applicationStatus),
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderColor: '#ffffff',
                        borderWidth: 4,
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No application status data available.</p>
            )}
          </div>

          {/* Approval Rate per Course */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-h-[360px] sm:min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Rate per Course</h3>
            {approvalRate && Object.keys(approvalRate).length > 0 ? (
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
            ) : (
              <p className="text-sm text-gray-500">No approval rate data available.</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
