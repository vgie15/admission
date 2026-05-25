import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentDocumentsPage from './pages/StudentDocumentsPage';
import StudentCoursesPage from './pages/StudentCoursesPage';
import StudentStatusPage from './pages/StudentStatusPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminApplicantsPage from './pages/AdminApplicantsPage';
import AdminStudentProfilePage from './pages/AdminStudentProfilePage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string | string[];
}) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [];
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<StudentRegisterPage />} />
          <Route path="/login" element={<LoginPage role="student" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/login" element={<LoginPage role="admin" />} />
          <Route path="/registrar/login" element={<LoginPage role="registrar" />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/documents"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/status"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentStatusPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole={['admin', 'registrar']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrar/dashboard"
            element={
              <ProtectedRoute requiredRole="registrar">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applicants"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminApplicantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/student/:studentId"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminStudentProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
