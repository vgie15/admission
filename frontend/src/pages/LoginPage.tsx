import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { AlertCircle, Mail, Lock } from 'lucide-react';

interface LoginPageProps {
  role: 'student' | 'admin' | 'registrar';
}

const LoginPage: React.FC<LoginPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginFn = role === 'student' ? authService.studentLogin : authService.adminLogin;
      const response = await loginFn(email, password);

      const { access_token, student_id, admin_id, role: accountRole } = response.data;
      const userId = student_id || admin_id;
      const resolvedRole = accountRole || role;

      if (role !== 'student' && resolvedRole !== role) {
        setError(`This account is registered as ${resolvedRole}, not ${role}.`);
        return;
      }

      login(access_token, { id: userId, email }, resolvedRole);

      if (resolvedRole === 'student') {
        navigate('/student/dashboard');
      } else if (resolvedRole === 'registrar') {
        navigate('/registrar/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          {role === 'student' ? 'Student' : role === 'registrar' ? 'Registrar' : 'Admin'} Login
        </h1>
        <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {role === 'student' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </form>

        {role === 'student' && (
          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Register here
            </button>
          </p>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            {role === 'student' ? (
              <>
                Admin?{' '}
                <button
                  onClick={() => navigate('/admin/login')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Login here
                </button>
                <span className="mx-2 text-gray-400">|</span>
                Registrar?{' '}
                <button
                  onClick={() => navigate('/registrar/login')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Login here
                </button>
              </>
            ) : (
              <>
                Student?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Login here
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
