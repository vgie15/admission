import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import { Search, Eye, Download } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const AdminApplicantsPage = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schoolYearFilter, setSchoolYearFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [statusFilter]);

  const loadCourses = async () => {
    try {
      const res = await adminService.getCourses();
      setCourses(res.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const loadApplicants = async () => {
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      const response = await adminService.getApplicants(filters);
      setApplicants(response.data);
    } catch (error) {
      console.error('Failed to load applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplicants = applicants.filter((app) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      app.first_name?.toLowerCase().includes(searchLower) ||
      app.last_name?.toLowerCase().includes(searchLower) ||
      app.email?.toLowerCase().includes(searchLower);

    const matchesSchoolYear = !schoolYearFilter || app.school_year === schoolYearFilter;
    const matchesSemester = !semesterFilter || (app.semester || '').toLowerCase().includes(semesterFilter.toLowerCase());
    const matchesCourse = !courseFilter || (app.course_choices || []).some((c: any) => c.course_id === courseFilter);

    return matchesSearch && matchesSchoolYear && matchesSemester && matchesCourse;
  });

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (schoolYearFilter) filters.school_year = schoolYearFilter;
      if (semesterFilter) filters.semester = semesterFilter;
      if (courseFilter) filters.course = courseFilter;

      const response = await adminService.exportData(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'applicants_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="Applicants Management"
        subtitle="Review, search, and manage admission applications"
        backLabel="Back to Dashboard"
        onBack={() => navigate('/admin/dashboard')}
      />

      <main className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-5 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
              <select
                value={schoolYearFilter}
                onChange={(e) => setSchoolYearFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All School Years</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Semesters</option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="summer">Summer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code ? `${course.code} - ${course.name}` : course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Showing {filteredApplicants.length} of {applicants.length} applicants. Export respects active filters.
          </p>
        </div>

        {/* Applicants Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {filteredApplicants.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No applicants found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map((applicant) => (
                  <tr key={applicant.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {applicant.first_name} {applicant.last_name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{applicant.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(applicant.status)}`}>
                        {applicant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/admin/student/${applicant.id}`)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminApplicantsPage;
