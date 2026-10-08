import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  Shield,
  Users,
  ArrowRight 
} from 'lucide-react';

export const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read query parameter: ?portal=admin vs ?portal=user
  const portalParam = searchParams.get('portal');
  const [portalType, setPortalType] = useState(portalParam === 'admin' ? 'admin' : 'user');

  useEffect(() => {
    if (portalParam === 'admin') {
      setPortalType('admin');
    } else if (portalParam === 'user') {
      setPortalType('user');
    }
  }, [portalParam]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Target destination after login (or default to /dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  // If already authenticated, redirect immediately
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handlePortalSwitch = (type) => {
    setPortalType(type);
    setSearchParams({ portal: type });
    setErrorMessage('');
    if (type === 'admin') {
      setEmail('admin@example.com');
      setPassword('lohith2605');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error);
    }
  };

  // Quick fill helper for testing initial admin credentials
  const fillAdminCredentials = () => {
    setEmail('admin@example.com');
    setPassword('lohith2605');
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-14 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-xl sm:max-w-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 items-center justify-center text-white shadow-2xl shadow-indigo-500/35 mb-4 ring-4 ring-indigo-500/10 transition-transform hover:scale-105">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            HRMS Enterprise Portal
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            {portalType === 'admin' 
              ? 'Administrative & Human Resource Governance Console' 
              : 'Sign in to access your digital workforce workspace'}
          </p>
        </div>

        {/* Portal Mode Switcher Tabs (Large, prominent & clearly labeled) */}
        <div className="grid grid-cols-2 p-1.5 mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-inner">
          <button
            type="button"
            onClick={() => handlePortalSwitch('user')}
            className={`flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
              portalType === 'user'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/80 dark:border-slate-700 scale-[1.01]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>User Login</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('admin')}
            className={`flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
              portalType === 'admin'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.01]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4.5 h-4.5" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Big Visible Login Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 dark:shadow-black/60 transition-all">
          {portalType === 'admin' && (
            <div className="mb-6 px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Elevated Administrative Session</span>
              </span>
              <span className="text-[11px] font-mono uppercase bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30 font-bold">
                MASTER RBAC
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 rounded-2xl text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300" htmlFor="password">
                  Account Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 rounded-2xl text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Large Prominent Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-violet-500 active:scale-[0.99] text-white font-black text-base rounded-2xl transition-all shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  {portalType === 'admin' ? (
                    <Shield className="w-5 h-5" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  <span>
                    {portalType === 'admin' ? 'Enter Admin Console' : 'Sign In as Employee'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            {portalType === 'admin' ? (
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fill Seed Admin Credentials (admin@example.com)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Need test credentials? Click to fill seeded login</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-6 font-medium">
          HRMS Portal &bull; Protected by Stateless JWT &amp; Role-Based Access Control
        </p>
      </div>
    </div>
  );
};

export default Login;
