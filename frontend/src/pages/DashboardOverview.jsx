import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/dashboard/StatCard';
import { 
  Users, UserCheck, CalendarClock, ListTodo, AlertTriangle, 
  Bell, History, Clock, ArrowRight,
  UserX, Briefcase, Calendar, CheckSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import AdminCommandCenter from '../components/dashboard/AdminCommandCenter';

// Employee & Manager Self-Service Portal Dashboard
const EmployeePortalDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

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
        } else if (err.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (err.status === 403) {
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
              Welcome back, {employee?.firstName ? `${employee.firstName} ${employee.lastName}` : user?.email}!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl">
              This is your {role.toLowerCase()} portal overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer no-underline"
            >
              <Clock className="w-4 h-4" />
              Clock In / Attendance
            </Link>
            <Link
              to="/leaves"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer no-underline"
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              Time Off
            </Link>
          </div>
        </div>
      </div>

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
          {/* Top KPI Cards Grid based on role */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {role === 'MANAGER' ? (
              <>
                <StatCard title="Team Size" value={dashboardData?.employees?.total} icon={Users} colorClass="indigo" loading={loading} />
                <StatCard title="Team Present Today" value={dashboardData?.attendance?.presentToday} icon={UserCheck} colorClass="emerald" loading={loading} />
                <StatCard title="Team Pending Leaves" value={dashboardData?.leaves?.pending} icon={CalendarClock} colorClass="amber" loading={loading} />
                <StatCard title="Overdue Team Tasks" value={dashboardData?.tasks?.overdue} icon={AlertTriangle} colorClass="rose" loading={loading} />
              </>
            ) : (
              <>
                <StatCard title="Today's Hours" value={dashboardData?.attendance?.personalTodayHours} icon={Clock} colorClass="emerald" loading={loading} trendLabel="hrs" />
                <StatCard title="Pending Leaves" value={dashboardData?.leaves?.pending} icon={CalendarClock} colorClass="amber" loading={loading} />
                <StatCard title="Active Tasks" value={dashboardData?.tasks?.active} icon={ListTodo} colorClass="sky" loading={loading} />
                <StatCard title="Overdue Tasks" value={dashboardData?.tasks?.overdue} icon={AlertTriangle} colorClass="rose" loading={loading} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {role === 'EMPLOYEE' ? 'My Task Distribution' : 'Team Task Status'}
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

            {/* Notifications Widget */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Alerts</span>
                  </div>
                  {dashboardData?.notifications?.unread > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/30">
                      {dashboardData.notifications.unread} unread
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">All caught up</span>
                  )}
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex flex-col items-center justify-center py-6">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 text-center">See Notifications page for full history</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Link
                  to="/notifications"
                  className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium flex items-center justify-between no-underline"
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

  // If Admin or HR, render the full executive command center
  if (role === 'ADMIN' || role === 'HR') {
    return <AdminCommandCenter user={user} />;
  }

  // Employee or Manager view
  return <EmployeePortalDashboard user={user} />;
};

export default DashboardOverview;
