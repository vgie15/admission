import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_BASE_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Service
export const authService = {
  studentRegister: (data: any) => apiClient.post('/auth/student-register', data),
  studentApplicationRegister: (data: FormData) =>
    apiClient.post('/auth/student-application-register', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  studentLogin: (email: string, password: string) =>
    apiClient.post('/auth/student-login', { email, password }),
  adminLogin: (email: string, password: string) =>
    apiClient.post('/auth/admin-login', { email, password }),
  verifyToken: () => apiClient.get('/auth/verify-token'),
};

// Student Service
export const studentService = {
  getProfile: () => apiClient.get('/student/profile'),
  updateProfile: (data: any) => apiClient.put('/student/profile', data),
  uploadDocument: (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return apiClient.post('/student/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAvailableCourses: () => apiClient.get('/student/courses'),
  selectCourse: (courseId: string) =>
    apiClient.post('/student/course-selection', { course_id: courseId }),
  getApplicationStatus: () => apiClient.get('/student/application-status'),
  getDocuments: () => apiClient.get('/student/documents'),
};

// Admin Service
export const adminService = {
  getDashboardStats: (filters?: any) => apiClient.get('/admin/dashboard-stats', { params: filters }),
  getApplicants: (filters?: any) => apiClient.get('/admin/applicants', { params: filters }),
  getStudentProfile: (studentId: string) => apiClient.get(`/admin/student/${studentId}`),
  deleteStudent: (studentId: string) => apiClient.delete(`/admin/student/${studentId}`),
  getDocumentViewUrl: (documentId: string) => `${API_BASE_URL}/admin/document/${documentId}/view`,
  approveStudent: (studentId: string, notes?: string, approvedEnrollmentId?: string) =>
    apiClient.put(`/admin/approve-student/${studentId}`, { notes, approved_enrollment_id: approvedEnrollmentId }),
  rejectStudent: (studentId: string, reason?: string) =>
    apiClient.put(`/admin/reject-student/${studentId}`, { reason }),
  exportData: (filters?: any) => apiClient.get('/admin/export-data', { params: filters, responseType: 'blob' }),
  getEnrollmentTrend: (filters?: any) => apiClient.get('/admin/analytics/enrollment-trend', { params: filters }),
  getApplicantsPerCourse: (filters?: any) => apiClient.get('/admin/analytics/applicants-per-course', { params: filters }),
  getGenderDistribution: (filters?: any) => apiClient.get('/admin/analytics/gender-distribution', { params: filters }),
  getEnrollmentStatus: (filters?: any) => apiClient.get('/admin/analytics/enrollment-status', { params: filters }),
  getApprovalRatePerCourse: (filters?: any) => apiClient.get('/admin/analytics/approval-rate-per-course', { params: filters }),
  getCourses: () => apiClient.get('/admin/courses'),
  createCourse: (data: any) => apiClient.post('/admin/courses', data),
};

export default apiClient;
