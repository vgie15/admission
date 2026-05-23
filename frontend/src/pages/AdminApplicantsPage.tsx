import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import { Search, Eye, Trash2 } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const AdminApplicantsPage = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadApplicants();
  }, [statusFilter]);

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
    return (
      app.first_name?.toLowerCase().includes(searchLower) ||
      app.last_name?.toLowerCase().includes(searchLower) ||
      app.email?.toLowerCase().includes(searchLower)
    );
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

  const handleDelete = async (applicant: any) => {
    const name = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.email;
    const confirmed = window.confirm(`Delete applicant "${name}"? This will remove their profile, course choices, and uploaded documents.`);
    if (!confirmed) return;

    setDeletingId(applicant.id);
    try {
      await adminService.deleteStudent(applicant.id);
      setApplicants((prev) => prev.filter((item) => item.id !== applicant.id));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete applicant');
    } finally {
      setDeletingId('');
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/admin/student/${applicant.id}`)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(applicant)}
                        disabled={deletingId === applicant.id}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:bg-gray-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId === applicant.id ? 'Deleting...' : 'Delete'}
                      </button>
                      </div>
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
