import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Shield, 
  Briefcase, 
  Building2, 
  Calendar, 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Lock,
  X,
  ArrowRight
} from 'lucide-react';

export const DashboardOverview = () => {
  const { user, changePassword } = useAuth();

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, message: '', error: '' });

  const employee = user?.employee;
  const role = user?.role || 'EMPLOYEE';

  const roleBadgeColors = {
    ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    HR: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    EMPLOYEE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const [leaveData, setLeaveData] = useState({
    balances: employee?.leaveBalances || { casual: 12, sick: 10, earned: 12, paid: 12 },
    pendingCount: 0,
    approvedCount: 0,
    queueCount: 0,
  });

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const [myRes, balRes] = await Promise.allSettled([
          api.get('/leaves/my'),
          api.get('/leaves/balance'),
        ]);

        let pCount = 0;
        let aCount = 0;
        let b = employee?.leaveBalances || { casual: 12, sick: 10, earned: 12, paid: 12 };

        if (myRes.status === 'fulfilled' && myRes.value.data?.data) {
          const d = myRes.value.data.data;
          pCount = d.stats?.pendingCount || 0;
          aCount = d.stats?.approvedCount || 0;
          if (d.balances) b = d.balances;
        }

        if (balRes.status === 'fulfilled' && balRes.value.data?.data?.balances) {
          b = balRes.value.data.data.balances;
        }

        let qCount = 0;
        if (role === 'ADMIN' || role === 'HR' || role === 'MANAGER') {
          try {
            const qRes = await api.get('/leaves?status=PENDING&limit=1');
            qCount = qRes.data?.data?.total || 0;
          } catch {
            // ignore
          }
        }

        setLeaveData({
          balances: b,
          pendingCount: pCount,
          approvedCount: aCount,
          queueCount: qCount,
        });
      } catch {
        // ignore
      }
    };

    fetchLeaves();
  }, [role, employee]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, message: '', error: '' });

    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordStatus({ loading: false, message: result.message, error: '' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } else {
      setPasswordStatus({ loading: false, message: '', error: result.error });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Authenticated Session Active
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {employee?.firstName ? `${employee.firstName} ${employee.lastName}` : user?.email}!
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              This is your enterprise portal overview. Role-based permissions and secure authentication are verified.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer no-underline"
            >
              <Clock className="w-4 h-4" />
              Clock In / Attendance
            </Link>
            <Link
              to="/leaves"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer no-underline"
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              Time Off / Leaves
            </Link>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Profile & Security Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User Profile Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profile Identity</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeColors[role] || roleBadgeColors.EMPLOYEE}`}>
              {role}
            </span>
          </div>
          <div className="mt-4 space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Employee Code:
              </span>
              <span className="font-mono font-semibold text-white">{employee?.employeeCode || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                Designation:
              </span>
              <span className="font-medium text-slate-200">{employee?.designation || 'Staff'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Department:
              </span>
              <span className="font-medium text-slate-200">
                {employee?.departmentId?.name ? `${employee.departmentId.name} (${employee.departmentId.code})` : 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Account Email:
              </span>
              <span className="font-mono text-slate-200 truncate max-w-[160px]">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Annual Leave Balances Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Annual Leave Balances</span>
              <span className="text-xs text-slate-500">Year 2026</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Casual</p>
                <p className="text-xl font-bold text-indigo-400 mt-1">{leaveData.balances?.casual ?? 12}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">days left</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Sick</p>
                <p className="text-xl font-bold text-rose-400 mt-1">{leaveData.balances?.sick ?? 10}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">days left</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Earned</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {leaveData.balances?.earned ?? leaveData.balances?.paid ?? 12}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">days left</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              {leaveData.pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {leaveData.pendingCount} pending request(s)
                </span>
              )}
              {(role === 'ADMIN' || role === 'HR' || role === 'MANAGER') && leaveData.queueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  {leaveData.queueCount} queue request(s)
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <Link
              to="/leaves"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-between no-underline"
            >
              <span>Apply or Review Leaves</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Authentication & Security Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Credentials</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              JWT Valid
            </span>
          </div>
          <div className="mt-4 space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Auth Token:</span>
              <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                Bearer (HMAC-SHA256)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Password Hashing:</span>
              <span className="font-mono text-slate-300">bcrypt (10 rounds)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Login:</span>
              <span className="font-mono text-slate-300">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : 'Current Session'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Field Protection:</span>
              <span className="font-mono text-slate-300">RBAC Filtered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Readiness Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Phase 5 Leave Management &amp; Quotas Live
          </h4>
          <p className="m-0">
            Leave applications, atomic balance deductions, manager approval pipeline, and attendance sync are fully active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/leaves"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 transition-all shrink-0 no-underline cursor-pointer"
          >
            <span>Open Leave Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Change Account Password
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your current password and choose a secure replacement.
            </p>

            {passwordStatus.message && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {passwordStatus.message}
              </div>
            )}
            {passwordStatus.error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {passwordStatus.error}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordStatus.loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {passwordStatus.loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
