import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  Shield,
  Users,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
  Zap,
  LockKeyhole
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

// Google SSO icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.48-1.92.12-.04z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.18-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * Enterprise Teamwork & Workforce Growth Illustration (Scalable Vector)
 * Incorporates Corporate Blue (#2563EB), Violet Accent (#7C3AED),
 * Teal Accent (#0D9488 / #14B8A6), and Growth Green (#10B981).
 */
const WorkforceIllustration = () => (
  <div className="relative w-full max-w-md mx-auto aspect-[16/11] my-4 select-none">
    {/* Soft ambient background glow blurs */}
    <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/4 w-44 h-44 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />
    <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-teal-400/15 rounded-full blur-xl pointer-events-none" />

    <svg
      viewBox="0 0 540 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-2xl relative z-10"
      aria-hidden="true"
    >
      <defs>
        {/* Soft linear gradients for node cards */}
        <linearGradient id="cardGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>

        <linearGradient id="badgePulse" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>

      {/* Connection Mesh & Neural Lines */}
      <path
        d="M110 110 C 180 80, 240 180, 270 185"
        stroke="url(#blueGlow)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        strokeOpacity="0.7"
      />
      <path
        d="M270 185 C 330 190, 390 120, 430 130"
        stroke="url(#blueGlow)"
        strokeWidth="2.5"
        strokeOpacity="0.8"
      />
      <path
        d="M270 185 C 260 250, 160 280, 140 290"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeOpacity="0.6"
      />
      <path
        d="M270 185 C 320 250, 380 270, 420 280"
        stroke="#14B8A6"
        strokeWidth="2.5"
        strokeOpacity="0.7"
      />

      {/* Central Leadership / Core Hub Card */}
      <g filter="drop-shadow(0 12px 24px rgba(0,0,0,0.45))">
        <rect
          x="195"
          y="130"
          width="150"
          height="110"
          rx="18"
          fill="url(#cardGradDark)"
          stroke="#3B82F6"
          strokeWidth="1.5"
        />
        {/* Hub Header Badge */}
        <rect x="210" y="145" width="40" height="40" rx="12" fill="url(#badgePulse)" />
        {/* Core People Symbol */}
        <circle cx="230" cy="160" r="5" fill="#FFFFFF" />
        <path d="M222 176 C222 170, 226 168, 230 168 C234 168, 238 170, 238 176 Z" fill="#93C5FD" />
        {/* Hub Text Details */}
        <text x="260" y="160" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="sans-serif">
          Workforce Hub
        </text>
        <text x="260" y="174" fill="#94A3B8" fontSize="9" fontWeight="500" fontFamily="sans-serif">
          Realtime Sync
        </text>
        {/* Status Chip */}
        <rect x="210" y="200" width="120" height="24" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="1" />
        <circle cx="222" cy="212" r="3.5" fill="#10B981" />
        <text x="232" y="215" fill="#CBD5E1" fontSize="9" fontWeight="600" fontFamily="sans-serif">
          98.8% Active Presence
        </text>
      </g>

      {/* Node 1: Top Left - Engineering & Product */}
      <g filter="drop-shadow(0 8px 16px rgba(0,0,0,0.35))">
        <rect
          x="40"
          y="70"
          width="135"
          height="75"
          rx="14"
          fill="url(#cardGradDark)"
          stroke="#475569"
          strokeWidth="1.2"
        />
        <circle cx="65" cy="100" r="14" fill="#2563EB" fillOpacity="0.25" stroke="#3B82F6" strokeWidth="1.2" />
        <circle cx="65" cy="97" r="4.5" fill="#60A5FA" />
        <path d="M57 110 C57 105, 61 104, 65 104 C69 104, 73 105, 73 110 Z" fill="#93C5FD" />
        <text x="90" y="98" fill="#F8FAFC" fontSize="11" fontWeight="700" fontFamily="sans-serif">
          Engineering
        </text>
        <text x="90" y="112" fill="#38BDF8" fontSize="9" fontWeight="600" fontFamily="sans-serif">
          48 Online
        </text>
      </g>

      {/* Node 2: Top Right - Management & Growth */}
      <g filter="drop-shadow(0 8px 16px rgba(0,0,0,0.35))">
        <rect
          x="365"
          y="85"
          width="135"
          height="75"
          rx="14"
          fill="url(#cardGradDark)"
          stroke="#7C3AED"
          strokeWidth="1.2"
        />
        <circle cx="390" cy="115" r="14" fill="#7C3AED" fillOpacity="0.25" stroke="#A855F7" strokeWidth="1.2" />
        <circle cx="390" cy="112" r="4.5" fill="#C084FC" />
        <path d="M382 125 C382 120, 386 119, 390 119 C394 119, 398 120, 398 125 Z" fill="#E9D5FF" />
        <text x="415" y="113" fill="#F8FAFC" fontSize="11" fontWeight="700" fontFamily="sans-serif">
          HR & Ops
        </text>
        <text x="415" y="127" fill="#C084FC" fontSize="9" fontWeight="600" fontFamily="sans-serif">
          12 Approvals
        </text>
      </g>

      {/* Node 3: Bottom Left - Analytics & Leaves */}
      <g filter="drop-shadow(0 8px 16px rgba(0,0,0,0.35))">
        <rect
          x="55"
          y="245"
          width="145"
          height="70"
          rx="14"
          fill="url(#cardGradDark)"
          stroke="#334155"
          strokeWidth="1"
        />
        <rect x="70" y="260" width="28" height="28" rx="8" fill="url(#tealGrad)" />
        {/* Trend Bar lines */}
        <rect x="76" y="275" width="3" height="7" rx="1.5" fill="#FFFFFF" />
        <rect x="82" y="270" width="3" height="12" rx="1.5" fill="#FFFFFF" />
        <rect x="88" y="266" width="3" height="16" rx="1.5" fill="#FFFFFF" />
        <text x="108" y="275" fill="#F8FAFC" fontSize="11" fontWeight="700" fontFamily="sans-serif">
          Attendance
        </text>
        <text x="108" y="289" fill="#2DD4BF" fontSize="9" fontWeight="600" fontFamily="sans-serif">
          +4.2% This Month
        </text>
      </g>

      {/* Node 4: Bottom Right - Enterprise Security */}
      <g filter="drop-shadow(0 8px 16px rgba(0,0,0,0.35))">
        <rect
          x="350"
          y="240"
          width="145"
          height="70"
          rx="14"
          fill="url(#cardGradDark)"
          stroke="#1E293B"
          strokeWidth="1.2"
        />
        <rect x="365" y="255" width="28" height="28" rx="8" fill="#1E293B" stroke="#3B82F6" strokeWidth="1" />
        {/* Security Shield */}
        <path
          d="M379 263 L385 266 V273 C385 277, 379 280, 379 280 C379 280, 373 277, 373 273 V266 Z"
          fill="#3B82F6"
        />
        <text x="403" y="271" fill="#F8FAFC" fontSize="11" fontWeight="700" fontFamily="sans-serif">
          SOC 2 Type II
        </text>
        <text x="403" y="285" fill="#94A3B8" fontSize="9" fontWeight="500" fontFamily="sans-serif">
          256-Bit SSL Encrypted
        </text>
      </g>

      {/* Upward Growth Arrow Trajectory (Teal & Blue) */}
      <path
        d="M130 330 Q 270 300 450 170"
        stroke="url(#blueGlow)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.4"
      />
      <circle cx="450" cy="170" r="5" fill="#14B8A6" filter="drop-shadow(0 0 8px #14B8A6)" />
    </svg>
  </div>
);

export const Login = () => {
  const { login, loginWithGoogle, isAuthenticated, verify2FALogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read query parameter: ?portal=admin vs ?portal=user
  const portalParam = searchParams.get('portal');
  const portalType = portalParam === 'admin' ? 'admin' : 'user';

  // Remember-me initialization from local storage
  const savedRememberEmail = localStorage.getItem('hrms_remember_email') || '';
  const [rememberMe, setRememberMe] = useState(Boolean(savedRememberEmail));

  const [email, setEmail] = useState(() => {
    if (savedRememberEmail) return savedRememberEmail;
    if (portalParam === 'admin') return 'admin@hrms.portal';
    return '';
  });

  const [password, setPassword] = useState(() => {
    if (portalParam === 'admin') return 'AdminSecure@2026!';
    return '';
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  // 2FA state management
  const [requires2FA, setRequires2FA] = useState(false);
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Target destination after login (preserves role redirection or defaults to /dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  // If already authenticated, redirect immediately
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Email format validation helper
  const isValidEmailFormat = (val) => {
    if (!val) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handlePortalSwitch = (type) => {
    setSearchParams({ portal: type });
    setErrorMessage('');
    setEmailTouched(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Disable repeated submission

    setErrorMessage('');
    setEmailTouched(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your work email address.');
      return;
    }

    if (!isValidEmailFormat(trimmedEmail)) {
      setErrorMessage('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    // Persist or clear remember-me preference
    if (rememberMe) {
      localStorage.setItem('hrms_remember_email', trimmedEmail);
    } else {
      localStorage.removeItem('hrms_remember_email');
    }

    setSubmitting(true);
    try {
      const result = await login(trimmedEmail, password);
      setSubmitting(false);

      if (result.success) {
        if (result.requires2FA) {
          setRequires2FA(true);
          setChallengeToken(result.challengeToken);
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setErrorMessage(result.error || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMessage(
        err.message || 'Unable to communicate with the authentication server. Please check your network connection.'
      );
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMessage('');

    if (!twoFactorCode.trim()) {
      setErrorMessage('Please enter the 2FA verification code.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await verify2FALogin(challengeToken, twoFactorCode.trim(), isRecoveryMode);
      setSubmitting(false);

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.error || '2FA verification code is invalid or expired.');
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    }
  };

  // Quick fill helper for testing initial admin credentials
  const fillAdminCredentials = () => {
    setSearchParams({ portal: 'admin' });
    setEmail('admin@example.com');
    setPassword('lohith2605');
    setErrorMessage('');
    setEmailTouched(false);
  };

  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-x-hidden bg-slate-50 dark:bg-[#070C18] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* =========================================================================
          LEFT PANEL: BRAND IDENTITY & WORKFORCE COLLABORATION (Desktop Only)
          ========================================================================= */}
      <section
        className="hidden lg:flex lg:w-1/2 xl:w-[48%] flex-col justify-between p-8 xl:p-12 relative overflow-hidden bg-slate-900 dark:bg-[#0A0F1D] text-white border-r border-slate-800/80 shadow-2xl z-10"
        aria-label="HRMS Brand Overview and Highlights"
      >
        {/* Subtle Ambient Background Gradients (Corporate Blue, Violet, Subtle Teal) */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Delicate geometric background texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />


        {/* Central Narrative & Dynamic Workforce Vector Illustration */}
        <div className="relative z-10 my-auto py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Next-Gen Workforce Operating System
          </div>

          <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight mb-3">
            Better People.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-violet-300 to-teal-300 bg-clip-text text-transparent">
              Stronger Teams.
            </span>
          </h2>

          <p className="text-sm xl:text-base text-slate-300 max-w-lg leading-relaxed mb-4">
            Unified human resource management designed for modern enterprises. Coordinate teams, automate attendance &
            leaves, and power organizational growth with enterprise-grade security.
          </p>

          {/* People & Teamwork Graphic Illustration */}
          <WorkforceIllustration />

          {/* Three Feature Highlight Pills */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1.5">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white mb-0.5">Unified Directory</p>
              <p className="text-[11px] text-slate-400 leading-tight">Org charts & roles</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center mb-1.5">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white mb-0.5">Smart Workflows</p>
              <p className="text-[11px] text-slate-400 leading-tight">Zero-delay leaves</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-1.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white mb-0.5">RBAC & 2FA</p>
              <p className="text-[11px] text-slate-400 leading-tight">Hardened security</p>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance Bar */}
        <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <LockKeyhole className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted Session</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-slate-400">
            <span>SOC 2 Type II</span>
            <span>•</span>
            <span>ISO 27001</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RIGHT PANEL: CLEAN ENTERPRISE LOGIN FORM
          ========================================================================= */}
      <section
        className="flex-1 w-full flex flex-col justify-between p-4 sm:p-8 lg:p-10 xl:p-12 overflow-y-auto"
        aria-label="Account Login Area"
      >
        {/* Back to Home Navigation Link */}
        <div className="w-full max-w-md mx-auto flex items-center justify-start mb-4 sm:mb-6">
          <Link
            to="/"
            id="back-to-home-btn"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Navigate back to HRMS Homepage"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Main Centered Login Card */}
        <div className="w-full max-w-md mx-auto my-auto">
          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your corporate credentials to access your workspace.
            </p>
          </div>

          {/* Segmented Portal Switcher: User Login vs Admin Portal */}
          <div
            role="tablist"
            aria-label="Portal selection"
            className="grid grid-cols-2 p-1 mb-5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-inner"
          >
            <button
              type="button"
              role="tab"
              aria-selected={portalType === 'user'}
              onClick={() => handlePortalSwitch('user')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                portalType === 'user'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Login</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={portalType === 'admin'}
              onClick={() => handlePortalSwitch('admin')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                portalType === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* Form Container Card */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-black/50 backdrop-blur-md">
            {/* Clear Error Notification Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-0.5"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 2FA Challenge View (Preserved) */}
            {requires2FA ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isRecoveryMode
                      ? 'Enter one of your emergency recovery codes.'
                      : 'Enter the 6-digit code from your authenticator app.'}
                  </p>
                </div>

                <form onSubmit={handle2FASubmit} className="space-y-4">
                  <div>
                    <label htmlFor="twoFactorCode" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Verification Code
                    </label>
                    <input
                      id="twoFactorCode"
                      type="text"
                      placeholder={isRecoveryMode ? 'Recovery Code (e.g. a1b2-c3d4)' : '000000'}
                      value={twoFactorCode}
                      onChange={(e) =>
                        setTwoFactorCode(isRecoveryMode ? e.target.value : e.target.value.replace(/\D/g, ''))
                      }
                      maxLength={isRecoveryMode ? 24 : 6}
                      required
                      autoFocus
                      className="w-full text-center tracking-widest text-lg font-mono px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl outline-none transition-all shadow-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (!isRecoveryMode && twoFactorCode.length !== 6)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify and Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(!isRecoveryMode);
                      setTwoFactorCode('');
                      setErrorMessage('');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                  >
                    {isRecoveryMode ? 'Use Authenticator App instead' : 'Lost access to your authenticator app?'}
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Credentials Login Form */
              <>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Email Field with Validation */}
                  <div>
                    <label
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                      htmlFor="login-email"
                    >
                      Work Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="name@company.com"
                        required
                        disabled={submitting}
                        className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm focus:ring-2 disabled:opacity-60 ${
                          emailTouched && email && !isValidEmailFormat(email)
                            ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                      />
                    </div>
                    {emailTouched && email && !isValidEmailFormat(email) && (
                      <p className="mt-1 text-[11px] text-rose-500 font-medium">
                        Please enter a valid email format (e.g. employee@company.com).
                      </p>
                    )}
                  </div>

                  {/* Password Field with Show/Hide Control */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                        htmlFor="login-password"
                      >
                        Account Password <span className="text-rose-500">*</span>
                      </label>

                      {/* Verified Functional Forgot Password Link */}
                      <Link
                        to="/forgot-password"
                        id="forgot-password-link"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                        title="Reset your password via verified email recovery flow"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="••••••••••••"
                        required
                        disabled={submitting}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all shadow-sm disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-blue-500"
                        tabIndex={0}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Auxiliary Controls: Remember Me Checkbox */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={submitting}
                        className="w-4 h-4 text-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="font-medium">Remember my work email</span>
                    </label>
                  </div>

                  {/* Primary Submit Button with Loading State */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        {portalType === 'admin' ? <Shield className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                        <span>{portalType === 'admin' ? 'Enter Admin Console' : 'Sign In as Employee'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-5 relative flex items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                  <span className="shrink-0 mx-3 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                    or continue with
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                </div>

                {/* Google SSO Button */}
                <div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      setErrorMessage('');
                      setSubmitting(true);
                      const result = await loginWithGoogle();
                      setSubmitting(false);
                      if (result.success) {
                        navigate(from, { replace: true });
                      } else {
                        setErrorMessage(result.error);
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Discreet Demo Quick-Fill Pill */}
          <div className="mt-4 pt-3 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need to test the portal?{' '}
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Auto-fill Admin Demo
              </button>
            </p>
          </div>
        </div>

        {/* Footer Security Assurance */}
        <div className="w-full max-w-md mx-auto pt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>© {CURRENT_YEAR} HRMS Portal. All corporate rights reserved.</p>
        </div>
      </section>
    </div>
  );
};

export default Login;
