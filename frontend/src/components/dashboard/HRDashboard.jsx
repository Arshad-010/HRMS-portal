import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, CalendarClock, UserX,
  Calendar, Award, TrendingUp, Sparkles, 
  CheckCircle2, AlertTriangle, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';
import api from '../../api/axios';
import KpiCard from '../common/KpiCard';
import ChartCard from '../common/ChartCard';
import EmptyState from '../common/EmptyState';
import { RECHARTS_THEME } from '../../constants/themeColors';

export const HRDashboard = ({ user }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [headcount, setHeadcount] = useState([]);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    const fetchHRAnalytics = async () => {
      try {
        setLoading(true);
        const [resOverview, resHeadcount] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/headcount-by-department')
        ]);
        
        if (resOverview.data?.success) setOverview(resOverview.data.data);
        if (resHeadcount.data?.success) setHeadcount(resHeadcount.data.data || []);
      } catch (err) {
        console.error('HR Dashboard Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHRAnalytics();
  }, []);

  const kpis = overview?.kpis || {};
  const pendingLeaves = overview?.pendingApprovals || [];
  const alerts = overview?.alerts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            HR Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {user?.employee?.firstName || 'HR Professional'}. Here's the organization-wide overview.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Link
            to="/employees"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 cursor-pointer no-underline"
          >
            <Users className="w-4 h-4" />
            <span>Employee Directory</span>
          </Link>
          <Link
            to="/departments"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer no-underline"
          >
            <span>Departments</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-slide-reveal ${
          actionMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        <KpiCard title="Total Employees" value={kpis.totalEmployees?.value} icon={Users} colorClass="emerald" loading={loading} />
        <KpiCard title="Present Today" value={kpis.presentToday?.value} icon={UserCheck} colorClass="success" loading={loading} />
        <KpiCard title="On Leave Today" value={kpis.onLeaveToday?.value} icon={Calendar} colorClass="warning" loading={loading} />
        <KpiCard title="Pending Leaves" value={kpis.pendingLeaves?.value} icon={CalendarClock} colorClass="warning" loading={loading} />
        <KpiCard title="New Joiners" badge="This Month" value={kpis.newJoiners?.value} icon={Sparkles} colorClass="primary" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Overview */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Department Overview"
            subtitle="Personnel allocation per operational unit"
            loading={loading}
            isEmpty={headcount.length === 0}
            minHeight={290}
          >
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={headcount} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={4} dataKey="count">
                  {headcount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RECHARTS_THEME.palette[index % RECHARTS_THEME.palette.length]} />
                  ))}
                </Pie>
                <Tooltip {...RECHARTS_THEME.tooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-2 max-h-16 overflow-y-auto">
              {headcount.slice(0, 4).map((d, idx) => (
                <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RECHARTS_THEME.palette[idx % RECHARTS_THEME.palette.length] }}></span>
                  <span className="truncate max-w-[80px]">{d.name}</span>
                  <span className="font-bold">({d.count})</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Pending Leave Requests */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight m-0">
                  Pending Leave Requests
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {pendingLeaves.length} pending
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
              {pendingLeaves.length === 0 ? (
                <EmptyState title="All caught up!" description="No pending employee requests." compact={true} />
              ) : (
                pendingLeaves.slice(0, 4).map((leave) => (
                  <div key={leave._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {leave.leaveType} &bull; {leave.numberOfDays} days
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Link to="/leaves" className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center justify-between no-underline">
              <span>Manage All Leaves</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* HR Activity & Onboarding */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight m-0">
                  HR Alerts & Onboarding
                </h3>
              </div>
            </div>
            <div className="space-y-3 mt-3">
              {alerts.length === 0 ? (
                <EmptyState title="No active alerts" description="All HR processes are on track." compact={true} />
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="p-3 rounded-xl border flex gap-3 items-start bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.severity === 'danger' ? 'text-rose-500' : 'text-amber-500'}`} />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white m-0">{alert.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-1.5 leading-snug">{alert.description}</p>
                      <Link to={alert.actionUrl} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 uppercase tracking-wider no-underline">
                        {alert.actionLabel} &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
