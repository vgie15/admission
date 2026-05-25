import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileText, TrendingUp, Lock, Clock, Users, BookOpen, Award, BarChart3 } from 'lucide-react';

type PortalRole = 'student' | 'admin' | 'registrar';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<PortalRole>('student');

  const portalContent = {
    student: {
      icon: <GraduationCap className="w-7 h-7 text-white" />,
      items: [
        { title: 'Complete Application Form', desc: 'Follow the admission profile and course process' },
        { title: 'Upload Required Documents', desc: 'Submit Form 137, PSA, Good Moral, and 2x2 Photo' },
        { title: 'Track Your Application', desc: 'View pending, accepted, or declined status updates' },
      ],
      cta: 'Access Student Portal',
      route: '/login',
      footer: 'New applicant? Submit your application',
      footerRoute: '/register',
    },
    admin: {
      icon: <GraduationCap className="w-7 h-7 text-white" />,
      items: [
        { title: 'Application Management', desc: 'Review, accept, and decline student applications' },
        { title: 'Analytics Dashboard', desc: 'Access admission insights, charts, and KPIs' },
        { title: 'Export & Reporting', desc: 'Generate detailed Excel reports and analytics' },
      ],
      cta: 'Access Admin Portal',
      route: '/admin/login',
      footer: 'Authorized personnel only - secure login required',
      footerRoute: '',
    },
    registrar: {
      icon: <GraduationCap className="w-7 h-7 text-white" />,
      items: [
        { title: 'View-Only Dashboard', desc: 'Monitor admission data without changing records' },
        { title: 'Data Visualizations', desc: 'Review charts for applicants, courses, gender, and status' },
        { title: 'Read-Only Registrar Access', desc: 'No approval, decline, export, or course management actions' },
      ],
      cta: 'Access Registrar Portal',
      route: '/registrar/login',
      footer: 'Registrar account required - view-only access',
      footerRoute: '',
    },
  };

  const activePortal = portalContent[selectedRole];

  const roleButtonClass = (role: PortalRole) =>
    selectedRole === role
      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  const renderPortalCard = (isMobile = false) => (
    <div className={`bg-white shadow-2xl ${isMobile ? 'rounded-3xl p-6' : 'rounded-3xl p-8 w-full max-w-lg'}`}>
      <div className={isMobile ? 'text-center mb-6' : 'text-center mb-6'}>
        <div className={`inline-flex items-center justify-center ${isMobile ? 'w-14 h-14' : 'w-14 h-14'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-3 shadow-lg`}>
          {activePortal.icon}
        </div>
        <h3 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-1`}>Access Portal</h3>
        <p className="text-gray-500">Select your role to continue</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 rounded-2xl bg-gray-100 p-1.5">
        <button
          onClick={() => setSelectedRole('student')}
          className={`${roleButtonClass('student')} rounded-xl py-3 text-sm font-bold transition-all`}
        >
          Student
        </button>
        <button
          onClick={() => setSelectedRole('admin')}
          className={`${roleButtonClass('admin')} rounded-xl py-3 text-sm font-bold transition-all`}
        >
          Admin
        </button>
        <button
          onClick={() => setSelectedRole('registrar')}
          className={`${roleButtonClass('registrar')} rounded-xl py-3 text-sm font-bold transition-all`}
        >
          Registrar
        </button>
      </div>

      <div className="space-y-3">
        {activePortal.items.map((item, index) => (
          <div
            key={item.title}
            className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">
              {index + 1}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(activePortal.route)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 font-bold text-white transition-all hover:shadow-xl"
      >
        {selectedRole === 'registrar' ? <BarChart3 className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
        {activePortal.cta}
        <span>-&gt;</span>
      </button>

      <div className="mt-4 text-center text-sm text-gray-500">
        {activePortal.footerRoute ? (
          <button
            type="button"
            onClick={() => navigate(activePortal.footerRoute)}
            className="font-semibold text-blue-600 hover:underline"
          >
            {activePortal.footer}
          </button>
        ) : (
          <p>{activePortal.footer}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 mx-auto max-w-7xl h-full px-4 sm:px-6 lg:h-screen lg:flex lg:flex-col lg:justify-center lg:py-6">
        <div className="grid grid-cols-1 items-center gap-8 py-6 lg:py-0 lg:grid-cols-[1fr_0.85fr]">

          {/* Left Section */}
          <div className="text-white space-y-4 sm:space-y-5">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/30">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold leading-tight">PSU- Urdaneta City Campus</h1>
                  <p className="text-blue-200 text-sm">Incoming Freshmen Admission System</p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/30 border border-cyan-400/50 rounded-full px-4 py-2 backdrop-blur-sm w-fit">
              <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">Now Accepting Applications for S.Y. 2026-2027</span>
            </div>

            {/* Main Heading */}
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold leading-none">
                Your Future
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">Starts Here</span>
              </h2>
            </div>

            {/* Description */}
            <p className="text-lg text-blue-100 leading-relaxed max-w-xl">
              Join Pangasinan State University - Urdaneta City Campus and embark on your academic journey with our streamlined digital admission system.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1 sm:gap-4">
              {/* Digital Application */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all hover:border-cyan-400/50">
                <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-1">Digital Application</h3>
                <p className="text-xs text-blue-200">100% paperless admission</p>
              </div>

              {/* Real-time Tracking */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all hover:border-cyan-400/50">
                <div className="bg-teal-500 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-1">Real-time Tracking</h3>
                <p className="text-xs text-blue-200">Monitor status live</p>
              </div>

              {/* Secure & Protected */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all hover:border-cyan-400/50">
                <div className="bg-purple-500 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-1">Secure & Protected</h3>
                <p className="text-xs text-blue-200">Your data is safe</p>
              </div>

              {/* 24/7 Access */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all hover:border-cyan-400/50">
                <div className="bg-pink-500 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-1">24/7 Access</h3>
                <p className="text-xs text-blue-200">Apply anytime</p>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/20 sm:gap-6">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">CHED Recognized</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-sm">Thousands of Alumni</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-300" />
                <span className="text-sm">10 Programs</span>
              </div>
            </div>
          </div>

          {/* Right Section - Portal Access */}
          <div className="hidden lg:flex justify-end">
            {renderPortalCard()}
          </div>
        </div>

        {/* Mobile Portal Card */}
        <div className="lg:hidden pb-8">
          {renderPortalCard(true)}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
