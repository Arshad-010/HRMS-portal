import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { StatCard } from './StatCard';
import { 
  Users, UserCheck, CalendarClock, ListTodo, AlertTriangle, 
  Bell, CheckCircle2, ArrowRight, Clock, CheckSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';

export const ManagerDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const employee = user?.employee;
  const role = user?.role || 'MANAGER';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/overview');
        if (res.data?.success) {
          setDashboardData(res.data.data);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        if (err.message === 'Network Error') {
          setError('Unable to connect to the HRMS server. Please make sure the server is running.');
        } else if (err.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(err.message || 'Error loading dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleApproveLeave = async (leaveId) => {
    try {
      const res = await api.patch(`/leaves/${leaveId}/approve`, { reviewerComment: 'Approved via Manager Dashboard' });
      if (res.data?.success) {
        setDashboardData(prev => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals.filter(p => p._id !== leaveId),
          leaves: {
            ...prev.leaves,
            pending: Math.max(0, prev.leaves.pending - 1)
          }
        }));
        setActionMessage({ type: 'success', text: 'Leave request approved successfully.' });
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Failed to approve leave: ' + (e.response?.data?.message || e.message) });
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const res = await api.patch(`/leaves/${leaveId}/reject`, { reviewerComment: 'Rejected via Manager Dashboard' });
      if (res.data?.success) {
        setDashboardData(prev => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals.filter(p => p._id !== leaveId),
          leaves: {
            ...prev.leaves,
            pending: Math.max(0, prev.leaves.pending - 1)
          }
        }));
        setActionMessage({ type: 'success', text: 'Leave request rejected.' });
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Failed to reject leave: ' + (e.response?.data?.message || e.message) });
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const taskChartData = dashboardData ? [
    { name: 'To Do', value: dashboardData.tasks?.todo || 0, color: 'var(--color-slate-400)' },
    { name: 'In Progress', value: dashboardData.tasks?.inProgress || 0, color: 'var(--color-cyan-400)' },
    { name: 'Review', value: dashboardData.tasks?.review || 0, color: 'var(--color-purple-400)' },
    { name: 'Completed', value: dashboardData.tasks?.completed || 0, color: 'var(--color-emerald-400)' }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-950/60 via-slate-50 dark:via-slate-900 to-slate-100 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Manager Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl">
              Welcome back, {employee?.firstName ? `${employee.firstName} ${employee.lastName}` : user?.email}! Here's your team's overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer no-underline"
            >
              <Clock className="w-4 h-4" />
              Team Attendance
            </Link>
            <Link
              to="/leaves"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer no-underline"
            >
              <CalendarClock className="w-4 h-4 text-indigo-400" />
              Manage Leaves
            </Link>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-slide-reveal mb-6 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 mb-8 flex flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Team Size" value={dashboardData?.employees?.total} icon={Users} colorClass="indigo" loading={loading} />
            <StatCard title="Team Present Today" value={dashboardData?.attendance?.presentToday} icon={UserCheck} colorClass="emerald" loading={loading} />
            <StatCard title="Team On Leave" value={dashboardData?.attendance?.onLeaveToday} icon={CalendarClock} colorClass="amber" loading={loading} />
            <StatCard title="Overdue Team Tasks" value={dashboardData?.tasks?.overdue} icon={AlertTriangle} colorClass="rose" loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Chart Section */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  Team Task Status
                </span>
              </div>
              <div className="flex-1 min-h-[250px] mt-4 flex items-center justify-center">
                {loading ? (
                  <div className="animate-pulse w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                ) : taskChartData.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No task data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={taskChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {taskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Pending Actions
                    </span>
                  </div>
                  {dashboardData?.pendingApprovals?.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {dashboardData.pendingApprovals.length} pending
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
                  {loading ? (
                    <div className="py-8"><SkeletonLoader type="table" /></div>
                  ) : dashboardData?.pendingApprovals?.length === 0 ? (
                    <EmptyState
                      title="All caught up!"
                      description="No pending leave requests in your queue."
                      compact={true}
                    />
                  ) : (
                    dashboardData?.pendingApprovals?.map((leave) => (
                      <div key={leave._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {leave.employee?.firstName} {leave.employee?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {leave.leaveType} &bull; {leave.numberOfDays} day{leave.numberOfDays > 1 ? 's' : ''} &bull; {new Date(leave.startDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleApproveLeave(leave._id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectLeave(leave._id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                <Link
                  to="/leaves"
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center justify-between no-underline"
                >
                  <span>Manage All Time-Off Requests</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Team Attendance List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
               <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Team Attendance Today
                  </span>
               </div>
               <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                 {loading ? (
                    <SkeletonLoader type="list" />
                 ) : dashboardData?.teamAttendance?.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No attendance records today.</p>
                 ) : (
                   dashboardData?.teamAttendance?.map((att) => (
                      <div key={att._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {att.employee?.firstName} {att.employee?.lastName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                           att.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500' :
                           att.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {att.status}
                        </span>
                      </div>
                   ))
                 )}
               </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
               <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Recent Team Activity
                  </span>
               </div>
               <div className="mt-4 space-y-3">
                 {loading ? (
                    <SkeletonLoader type="list" />
                 ) : dashboardData?.recentActivity?.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No recent activity.</p>
                 ) : (
                   dashboardData?.recentActivity?.map((act) => (
                      <div key={act._id} className="text-xs border-l-2 border-indigo-500 pl-3 py-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{act.action}</div>
                        <div className="text-[10px] text-slate-500">{new Date(act.createdAt).toLocaleString()}</div>
                      </div>
                   ))
                 )}
               </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
};

export default ManagerDashboard;
