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
  ArrowRight,
  CheckSquare,
  AlertTriangle,
  Bell,
  History
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

  const [taskData, setTaskData] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    completed: 0,
    overdue: 0,
  });

  // Phase 7: Notifications & Activity Dashboard Data
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchLeavesAndTasks = async () => {
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

        // Fetch tasks stats
        try {
          const taskEndpoint = role === 'EMPLOYEE' ? '/tasks/my?limit=1' : '/tasks?limit=1';
          const taskRes = await api.get(taskEndpoint);
          if (taskRes.data?.data?.stats) {
            setTaskData(taskRes.data.data.stats);
          }
        } catch {
          // ignore
        }

        // Fetch Phase 7: Notifications preview
        try {
          const notifRes = await api.get('/notifications?limit=3');
          if (notifRes.data?.data) {
            setRecentNotifications(notifRes.data.data.notifications || []);
            setUnreadNotifCount(notifRes.data.data.unreadCount || 0);
          }
        } catch {
          // ignore
        }

        // Fetch Phase 7: Activity stream preview
        try {
          const actRes = await api.get('/activity?limit=4');
          if (actRes.data?.data) {
            setRecentActivities(actRes.data.data.logs || []);
          }
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    };

    fetchLeavesAndTasks();
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
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer no-underline"
            >
              <CheckSquare className="w-4 h-4 text-sky-400" />
              Task Board
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

      {/* Profile & Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <span className="font-medium text-slate-200 truncate max-w-[120px]">
                {employee?.departmentId?.name ? `${employee.departmentId.name}` : 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Account Email:
              </span>
              <span className="font-mono text-slate-200 truncate max-w-[130px]">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Annual Leave Balances Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Leave Balances</span>
              <span className="text-xs text-slate-500">Year 2026</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Casual</p>
                <p className="text-lg font-bold text-indigo-400 mt-1">{leaveData.balances?.casual ?? 12}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">days left</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Sick</p>
                <p className="text-lg font-bold text-rose-400 mt-1">{leaveData.balances?.sick ?? 10}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">days left</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Earned</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">
                  {leaveData.balances?.earned ?? leaveData.balances?.paid ?? 12}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">days left</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-1 text-[11px]">
              {leaveData.pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {leaveData.pendingCount} pending
                </span>
              )}
              {(role === 'ADMIN' || role === 'HR' || role === 'MANAGER') && leaveData.queueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  {leaveData.queueCount} queue
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

        {/* Task & Workflow Tracking Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {role === 'EMPLOYEE' ? 'My Tasks' : 'Workforce Tasks'}
              </span>
              <span className="text-xs text-slate-500">Live Status</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Active</p>
                <p className="text-lg font-bold text-sky-400 mt-1">{taskData.inProgress}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">in progress</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Review</p>
                <p className="text-lg font-bold text-purple-400 mt-1">{taskData.review}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">pending</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Done</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">{taskData.completed}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">completed</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-400 font-medium">
                Total: <span className="text-white font-bold">{taskData.total}</span>
              </span>
              {taskData.overdue > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {taskData.overdue} overdue
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  On schedule
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <Link
              to="/tasks"
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center justify-between no-underline"
            >
              <span>View Task Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Authentication & Security Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Info</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              JWT Valid
            </span>
          </div>
          <div className="mt-4 space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Auth Token:</span>
              <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                Bearer JWT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Hashing:</span>
              <span className="font-mono text-slate-300">bcrypt (10 rounds)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Session:</span>
              <span className="font-mono text-slate-300">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : 'Active'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Protection:</span>
              <span className="font-mono text-slate-300">RBAC Filtered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 7: Notifications & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Alerts & Notifications Widget */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Recent Alerts</span>
              </div>
              {unreadNotifCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {unreadNotifCount} unread
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">All caught up</span>
              )}
            </div>

            <div className="mt-4 space-y-2.5">
              {recentNotifications.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No recent alerts for your account</p>
              ) : (
                recentNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      !notif.isRead
                        ? 'bg-indigo-950/20 border-indigo-500/30'
                        : 'bg-slate-950/40 border-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate m-0">{notif.title}</p>
                      <p className="text-[11px] text-slate-400 truncate m-0 mt-0.5">{notif.message}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <Link
              to="/notifications"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-between no-underline"
            >
              <span>View All Notifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent HRMS Audit Activity Widget */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <History className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Activity Stream</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Live Audit</span>
            </div>

            <div className="mt-4 space-y-2.5">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No recent organizational activities</p>
              ) : (
                recentActivities.map((act) => (
                  <div
                    key={act._id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-800 text-indigo-300 border border-slate-700/60 shrink-0">
                        {act.entityType}
                      </span>
                      <p className="text-slate-300 truncate m-0 font-medium" title={act.description}>
                        {act.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <Link
              to="/activity"
              className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center justify-between no-underline"
            >
              <span>Explore Full Activity Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Architecture Readiness Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            Phase 6 Task Management &amp; Tracking Live
          </h4>
          <p className="m-0">
            Interactive task assignments, milestone tracking, priority levels, overdue calculations, and workflow lifecycles are fully operational.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 transition-all shrink-0 no-underline cursor-pointer"
          >
            <span>Open Task Board</span>
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
