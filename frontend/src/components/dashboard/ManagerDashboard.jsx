import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { StatCard } from './StatCard';
import { 
  Users, UserCheck, CalendarClock, ListTodo, AlertTriangle, 
  Bell, CheckCircle2, ArrowRight, Clock, CheckSquare, ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../common/EmptyState';

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
          setError('Unable to connect to the HRMS server. Please verify connection.');
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
          pendingApprovals: (prev.pendingApprovals || []).filter(p => p._id !== leaveId),
          leaves: {
            ...prev.leaves,
            pending: Math.max(0, (prev.leaves?.pending || 1) - 1)
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
          pendingApprovals: (prev.pendingApprovals || []).filter(p => p._id !== leaveId),
          leaves: {
            ...prev.leaves,
            pending: Math.max(0, (prev.leaves?.pending || 1) - 1)
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

  const taskChartData = dashboardData?.tasks ? [
    { name: 'To Do', value: dashboardData.tasks?.todo || 0, color: '#64748B' },
    { name: 'In Progress', value: dashboardData.tasks?.inProgress || 0, color: '#2563EB' },
    { name: 'Review', value: dashboardData.tasks?.review || 0, color: '#7C3AED' },
    { name: 'Completed', value: dashboardData.tasks?.completed || 0, color: '#059669' }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 min-h-screen">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Users className="w-3 h-3" />
            Leadership Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {employee?.firstName ? `${employee.firstName} ${employee.lastName || ''}` : user?.email}. Team oversight & approvals.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Link
            to="/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer no-underline"
          >
            <Clock className="w-4 h-4" />
            <span>Team Attendance</span>
          </Link>
          <Link
            to="/leaves"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B1220] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-[#263449] transition-colors cursor-pointer no-underline"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Review Leaves</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-fadeIn ${
          actionMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Direct Reports" value={dashboardData?.employees?.total} icon={Users} colorClass="blue" loading={loading} />
        <StatCard title="Team Present Today" value={dashboardData?.attendance?.presentToday} icon={UserCheck} colorClass="emerald" loading={loading} />
        <StatCard title="Team On Leave" value={dashboardData?.attendance?.onLeaveToday} icon={CalendarClock} colorClass="amber" loading={loading} />
        <StatCard title="Overdue Tasks" value={dashboardData?.tasks?.overdue} icon={AlertTriangle} colorClass="rose" loading={loading} />
      </div>

      {/* Grid: Tasks Breakdown & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task Distribution */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#263449]/70">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Team Task Breakdown
            </span>
          </div>

          <div className="flex-1 min-h-[230px] flex items-center justify-center my-3">
            {taskChartData.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No team task data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={taskChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {taskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111C2E',
                      borderColor: '#263449',
                      borderRadius: '12px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-[#263449]/70 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">To Do</span>
              <p className="font-bold text-slate-700 dark:text-slate-300">{dashboardData?.tasks?.todo || 0}</p>
            </div>
            <div>
              <span className="text-[10px] text-blue-500 uppercase font-semibold">Progress</span>
              <p className="font-bold text-blue-600 dark:text-blue-400">{dashboardData?.tasks?.inProgress || 0}</p>
            </div>
            <div>
              <span className="text-[10px] text-violet-500 uppercase font-semibold">Review</span>
              <p className="font-bold text-violet-600 dark:text-violet-400">{dashboardData?.tasks?.review || 0}</p>
            </div>
            <div>
              <span className="text-[10px] text-emerald-500 uppercase font-semibold">Done</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{dashboardData?.tasks?.completed || 0}</p>
            </div>
          </div>
        </div>

        {/* Pending Approvals Queue */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#263449]/70">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Team Leave Requests</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {(dashboardData?.pendingApprovals || []).length} pending
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#263449]/70 mt-2">
              {(!dashboardData?.pendingApprovals || dashboardData.pendingApprovals.length === 0) ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No pending approvals</p>
                  <p className="text-[11px] text-slate-400">All direct report requests have been reviewed.</p>
                </div>
              ) : (
                dashboardData.pendingApprovals.map((leave) => (
                  <div key={leave._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {leave.leaveType || 'Leave'} &bull; {leave.numberOfDays} days off
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApproveLeave(leave._id)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectLeave(leave._id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#263449] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#263449]/70">
            <Link to="/leaves" className="text-xs font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 flex items-center justify-between no-underline">
              <span>View Full Approval Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
