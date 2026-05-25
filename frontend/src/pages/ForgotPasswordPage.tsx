import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { AlertCircle, CheckCircle, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react';

type Step = 'email' | 'code' | 'password' | 'done';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearErrors = () => { setError(''); setFieldErrors({}); };

  // Step 1 — send code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setStep('code');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!code.trim()) { setError('Please enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      await authService.verifyResetCode(email.trim(), code.trim());
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!newPassword || !confirmPassword) { setError('All fields are required.'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(email.trim(), code.trim(), newPassword, confirmPassword);
      setStep('done');
    } catch (err: any) {
      if (err.response?.data?.fields) setFieldErrors(err.response.data.fields);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field?: string) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      field && fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">

        {step !== 'done' && (
          <button
            type="button"
            onClick={() => step === 'email' ? navigate('/login') : setStep(step === 'code' ? 'email' : 'code')}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 'email' ? 'Back to Login' : 'Back'}
          </button>
        )}

        {/* Step indicators */}
        {step !== 'done' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['email', 'code', 'password'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === s ? 'bg-blue-600 text-white' :
                  (['email', 'code', 'password'] as Step[]).indexOf(step) > i ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {(['email', 'code', 'password'] as Step[]).indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`h-0.5 w-8 ${(['email', 'code', 'password'] as Step[]).indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1 — Email */}
        {step === 'email' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Forgot Password</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your registered email and we'll send you a reset code.</p>
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        {/* Step 2 — Enter Code */}
        {step === 'code' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Enter Reset Code</h1>
            <p className="text-gray-500 text-sm mb-1">We sent a 6-digit code to <strong>{email}</strong>.</p>
            <p className="text-gray-400 text-xs mb-6">Check your spam folder if you don't see it. Code expires in 15 minutes.</p>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-bold tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition">
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button type="button" onClick={() => { clearErrors(); handleSendCode({ preventDefault: () => {} } as any); }}
                className="w-full text-sm text-blue-600 hover:underline">
                Resend code
              </button>
            </form>
          </>
        )}

        {/* Step 3 — New Password */}
        {step === 'password' && (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Set New Password</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your new password below.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={`pl-10 ${inputClass('new_password')}`}
                    required
                  />
                </div>
                {fieldErrors.new_password && <p className="mt-1 text-sm text-red-600">{fieldErrors.new_password}</p>}
                <p className="mt-1 text-xs text-gray-400">Must have uppercase, number, and special character.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your new password"
                    className={`pl-10 ${inputClass('confirm_password')}`}
                    required
                  />
                </div>
                {fieldErrors.confirm_password && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirm_password}</p>}
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition">
                {loading ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Updated!</h2>
            <p className="text-gray-600 mb-6">Your password has been reset successfully. You can now log in with your new password.</p>
            <button onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
              Go to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
