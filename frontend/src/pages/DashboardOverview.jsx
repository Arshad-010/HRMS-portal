import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatCard } from '../components/dashboard/StatCard';
import {
  Clock,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Bell,
  ArrowRight,
  CalendarClock,
  ListTodo,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminCommandCenter } from '../components/dashboard/AdminCommandCenter';
import { HRDashboard } from '../components/dashboard/HRDashboard';
import { ManagerDashboard } from '../components/dashboard/ManagerDashboard';

/**
 * Employee Portal Dashboard
 * Reconciles the original structural layout from the `main` branch (commit 037cc43)
 * with the newer enterprise visual theme (Corporate Blue, surfaces, tokens, dark/light)
 * and all real-time functionality (backend overview API, live notifications).
 */
const EmployeePortalDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const { unreadCount: liveUnreadCount } = useNotifications() || {};

  const employee = user?.employee;
  const role = user?.role || 'EMPLOYEE';

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
        } else if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this dashboard.');
        } else {
          setError(err.message || 'Error loading dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Theme-tailored task distribution colors matching the newer design system
  const taskColors = {
    'To Do': '#64748B',
    'In Progress': '#2563EB',
    'Review': '#7C3AED',
    'Completed': '#059669',
  };

  const taskChartData = dashboardData?.tasks
    ? [
        { name: 'To Do', value: dashboardData.tasks.todo || 0, color: taskColors['To Do'] },
        { name: 'In Progress', value: dashboardData.tasks.inProgress || 0, color: taskColors['In Progress'] },
        { name: 'Review', value: dashboardData.tasks.review || 0, color: taskColors['Review'] },
        { name: 'Completed', value: dashboardData.tasks.completed || 0, color: taskColors['Completed'] },
      ].filter((d) => d.value > 0)
    : [];

  const unreadAlertCount =
    liveUnreadCount !== undefined ? liveUnreadCount : (dashboardData?.notifications?.unread || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* =========================================================================
          1. WELCOME BANNER (ORIGINAL MAIN BRANCH STRUCTURE + NEW THEME)
          ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-50/80 dark:from-blue-950/40 via-white dark:via-[#111C2E] to-slate-50 dark:to-[#0B1220] border border-slate-200 dark:border-[#263449] rounded-3xl p-6 sm:p-8 mb-8 backdrop-blur-md relative overflow-hidden shadow-xs transition-colors">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {employee?.firstName ? `${employee.firstName} ${employee.lastName || ''}`.trim() : user?.email}!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              This is your {role.toLowerCase()} portal overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all cursor-pointer no-underline"
            >
              <Clock className="w-4 h-4" />
              <span>Clock In / Attendance</span>
            </Link>
            <Link
              to="/leaves"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#111C2E] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-[#263449] shadow-xs transition-colors cursor-pointer no-underline"
            >
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Time Off</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. ERROR STATE BANNER
          ========================================================================= */}
      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 mb-8 flex flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* =========================================================================
              3. TOP KPI STATCARDS GRID (ORIGINAL MAIN BRANCH 4 METRICS)
              ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Today's Hours"
              value={dashboardData?.attendance?.personalTodayHours}
              icon={Clock}
              colorClass="emerald"
              loading={loading}
              trendLabel="hrs"
            />
            <StatCard
              title="Pending Leaves"
              value={dashboardData?.leaves?.pending}
              icon={CalendarClock}
              colorClass="amber"
              loading={loading}
            />
            <StatCard
              title="Active Tasks"
              value={dashboardData?.tasks?.active}
              icon={ListTodo}
              colorClass="sky"
              loading={loading}
            />
            <StatCard
              title="Overdue Tasks"
              value={dashboardData?.tasks?.overdue}
              icon={AlertTriangle}
              colorClass="rose"
              loading={loading}
            />
          </div>

          {/* =========================================================================
              4. MAIN 2-COLUMN SECTION: TASK DISTRIBUTION + ALERTS
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left 2 Columns: My Task Distribution (Recharts PieChart) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#263449]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  My Task Distribution
                </span>
                <Link
                  to="/tasks"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 group no-underline"
                >
                  <span>View Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="flex-1 min-h-[250px] mt-4 flex items-center justify-center">
                {loading ? (
                  <div className="animate-pulse w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-800" />
                ) : taskChartData.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 italic">No task data available.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={taskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111C2E',
                          borderColor: '#263449',
                          borderRadius: '12px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {taskChartData.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-[#263449]/60">
                  {taskChartData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 1 Column: Alerts / Notifications Widget */}
            <div className="bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#263449]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Alerts
                    </span>
                  </div>
                  {unreadAlertCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {unreadAlertCount} unread
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">All caught up</span>
                  )}
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {unreadAlertCount > 0
                        ? `You have ${unreadAlertCount} pending notification(s)`
                        : 'You are all caught up!'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                      See Notifications page for full history
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#263449]">
                <Link
                  to="/notifications"
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center justify-between no-underline"
                >
                  <span>View All Notifications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const DashboardOverview = () => {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';

  if (role === 'ADMIN') {
    return <AdminCommandCenter user={user} />;
  } else if (role === 'HR') {
    return <HRDashboard user={user} />;
  } else if (role === 'MANAGER') {
    return <ManagerDashboard user={user} />;
  }

  // Employee view
  return <EmployeePortalDashboard user={user} />;
};

export default DashboardOverview;
