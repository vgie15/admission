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
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  verifyResetCode: (email: string, code: string) =>
    apiClient.post('/auth/verify-reset-code', { email, code }),
  resetPassword: (email: string, code: string, new_password: string, confirm_password: string) =>
    apiClient.post('/auth/reset-password', { email, code, new_password, confirm_password }),
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
  getDocumentViewUrl: (documentId: string) => `${API_BASE_URL}/student/document/${documentId}/view`,
  getFeedback: () => apiClient.get('/student/feedback'),
  markFeedbackRead: (feedbackId: string) => apiClient.put(`/student/feedback/${feedbackId}/read`),
};

// Admin Service
export const adminService = {
  getDashboardStats: (filters?: any) => apiClient.get('/admin/dashboard-stats', { params: filters }),
  getApplicants: (filters?: any) => apiClient.get('/admin/applicants', { params: filters }),
  getStudentProfile: (studentId: string) => apiClient.get(`/admin/student/${studentId}`),
  getDocumentViewUrl: (documentId: string) => `${API_BASE_URL}/admin/document/${documentId}/view`,
  sendFeedback: (studentId: string, message: string, templateKey?: string) =>
    apiClient.post(`/admin/student/${studentId}/feedback`, { message, template_key: templateKey }),
  approveStudent: (studentId: string, notes?: string, approvedChoiceId?: string) =>
    apiClient.put(`/admin/approve-student/${studentId}`, { notes, approved_choice_id: approvedChoiceId }),
  rejectStudent: (studentId: string, reason?: string) =>
    apiClient.put(`/admin/reject-student/${studentId}`, { reason }),
  exportData: (filters?: any) => apiClient.get('/admin/export-data', { params: filters, responseType: 'blob' }),
  getApprovedAdmissions: (filters?: any) => apiClient.get('/admin/approved-admissions', { params: filters }),
  exportApprovedAdmissions: (filters?: any) =>
    apiClient.get('/admin/export-approved-admissions', { params: filters, responseType: 'blob' }),
  getApplicationTrend: (filters?: any) => apiClient.get('/admin/analytics/application-trend', { params: filters }),
  getApplicantsPerCourse: (filters?: any) => apiClient.get('/admin/analytics/applicants-per-course', { params: filters }),
  getFirstChoiceDistribution: (filters?: any) => apiClient.get('/admin/analytics/first-choice-distribution', { params: filters }),
  getGenderDistribution: (filters?: any) => apiClient.get('/admin/analytics/gender-distribution', { params: filters }),
  getApprovedGenderDistribution: (filters?: any) => apiClient.get('/admin/analytics/approved-gender-distribution', { params: filters }),
  getCityDistribution: (filters?: any) => apiClient.get('/admin/analytics/city-distribution', { params: filters }),
  getApprovedCityDistribution: (filters?: any) => apiClient.get('/admin/analytics/approved-city-distribution', { params: filters }),
  getApplicationStatusDistribution: (filters?: any) => apiClient.get('/admin/analytics/application-status', { params: filters }),
  getApprovalRatePerCourse: (filters?: any) => apiClient.get('/admin/analytics/approval-rate-per-course', { params: filters }),
  getCourses: () => apiClient.get('/admin/courses'),
  createCourse: (data: any) => apiClient.post('/admin/courses', data),
};

export default apiClient;
