import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, CalendarClock, ListTodo, AlertTriangle,
  Clock, ArrowRight, UserX, Briefcase, Calendar, CheckSquare,
  Shield, Award, TrendingUp, Sparkles, Download, Filter, Plus,
  CheckCircle2, XCircle, Cake, PartyPopper, Bell, RefreshCw,
  ChevronRight, Layers, FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid
} from 'recharts';
import api from '../../api/axios';
import KpiCard from '../common/KpiCard';
import ChartCard from '../common/ChartCard';
import ScoreBadge from '../common/ScoreBadge';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';
import PersonDrawer from '../people/PersonDrawer';
import { THEME_COLORS, RECHARTS_THEME } from '../../constants/themeColors';

export const AdminCommandCenter = ({ user }) => {
  const navigate = useNavigate();

  // Filters & State
  const [range, setRange] = useState('30D');
  const [departmentId, setDepartmentId] = useState('ALL');
  const [departments, setDepartments] = useState([]);

  // Telemetry Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [attTrend, setAttTrend] = useState([]);
  const [headcount, setHeadcount] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [leavesData, setLeavesData] = useState(null);
  const [taskStatus, setTaskStatus] = useState([]);
  const [hiringTrend, setHiringTrend] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Quick Action Drawer state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [drawerRole, setDrawerRole] = useState('EMPLOYEE');

  // Action status messages
  const [actionMessage, setActionMessage] = useState(null);

  // Fetch departments list for filter
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data?.success) {
          setDepartments(res.data.data || []);
        }
      } catch (e) {
        console.error('Failed to fetch departments:', e);
      }
    };
    fetchDepts();
  }, []);

  // Fetch all analytics datasets
  const fetchAllAnalytics = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = { range };
      if (departmentId !== 'ALL') params.departmentId = departmentId;

      const [
        resOverview,
        resAttTrend,
        resHeadcount,
        resPerf,
        resLeaves,
        resTasks,
        resHiring
      ] = await Promise.all([
        api.get('/analytics/overview', { params }),
        api.get('/analytics/attendance-trend', { params }),
        api.get('/analytics/headcount-by-department', { params }),
        api.get('/analytics/performance-distribution', { params }),
        api.get('/analytics/leave-breakdown', { params }),
        api.get('/analytics/task-status', { params }),
        api.get('/analytics/hiring-trend', { params }),
      ]);

      if (resOverview.data?.success) {
        setOverview(resOverview.data.data);
        setPendingApprovals(resOverview.data.data?.pendingApprovals || []);
      }
      if (resAttTrend.data?.success) setAttTrend(resAttTrend.data.data || []);
      if (resHeadcount.data?.success) setHeadcount(resHeadcount.data.data || []);
      if (resPerf.data?.success) setPerformance(resPerf.data.data || null);
      if (resLeaves.data?.success) setLeavesData(resLeaves.data.data || null);
      if (resTasks.data?.success) setTaskStatus(resTasks.data.data || []);
      if (resHiring.data?.success) setHiringTrend(resHiring.data.data || []);

    } catch (err) {
      console.error('Command Center Fetch Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, [range, departmentId]);

  // Inline Approval Handlers
  const handleApproveLeave = async (leaveId) => {
    try {
      const res = await api.put(`/leaves/${leaveId}/approve`, { reviewerComment: 'Approved via Executive Dashboard' });
      if (res.data?.success) {
        setPendingApprovals(prev => prev.filter(p => p._id !== leaveId));
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
      const res = await api.put(`/leaves/${leaveId}/reject`, { reviewerComment: 'Rejected via Executive Dashboard' });
      if (res.data?.success) {
        setPendingApprovals(prev => prev.filter(p => p._id !== leaveId));
        setActionMessage({ type: 'success', text: 'Leave request rejected.' });
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Failed to reject leave: ' + (e.response?.data?.message || e.message) });
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (!overview) return;
    const rows = [
      ['Metric', 'Value', 'Status'],
      ['Total Employees', overview.kpis?.totalEmployees?.value || 0, 'Active'],
      ['Present Today', overview.kpis?.presentToday?.value || 0, 'Verified'],
      ['On Leave Today', overview.kpis?.onLeaveToday?.value || 0, 'Approved'],
      ['Pending Leaves', overview.kpis?.pendingLeaves?.value || 0, 'Pending Review'],
      ['Active Tasks', overview.kpis?.activeTasks?.value || 0, 'In Progress'],
      ['Average Performance Score', overview.kpis?.avgPerformanceScore?.value || 0, 'Evaluated'],
      ['Attrition Rate', overview.kpis?.attritionRate?.value || '0%', 'Company-wide'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HRMS_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Role distribution data for pie chart
  const roleChartData = overview?.roleDistribution ? [
    { name: 'Employees', value: overview.roleDistribution.employees, color: '#0ea5e9' },
    { name: 'Managers', value: overview.roleDistribution.managers, color: '#8b5cf6' },
    { name: 'HR Team', value: overview.roleDistribution.hr, color: '#10b981' },
  ].filter(d => d.value > 0) : [];

  const kpis = overview?.kpis || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Strip */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hello, {user?.employee?.firstName || user?.email?.split('@')[0] || 'Administrator'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time organizational telemetry, presence analytics, talent scorecards, and audit logs.
          </p>
        </div>

        {/* Filters, Export & Quick Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {/* Date range filter */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
            {['Today', '7D', '30D', 'Quarter', 'Year'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  range === r
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            onClick={() => fetchAllAnalytics(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition-colors cursor-pointer"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
          </button>

          {/* Export Buttons (PDF / CSV) */}
          <div className="inline-flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer hover:-translate-y-0.5"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-sky-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer hover:-translate-y-0.5"
              title="Print or Save Executive Report as PDF"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />
              <span>PDF</span>
            </button>
          </div>

          {/* Quick Actions (+ Add Employee, + Add Manager, + Add HR) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setDrawerRole('EMPLOYEE'); setIsAddDrawerOpen(true); }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
            <button
              onClick={() => { setDrawerRole('MANAGER'); setIsAddDrawerOpen(true); }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Manager</span>
            </button>
            <button
              onClick={() => { setDrawerRole('HR'); setIsAddDrawerOpen(true); }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add HR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
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



      {/* 3. KPI Row (8 Main Cards + 2 Auxiliary Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        <KpiCard
          title="Total Employees"
          value={kpis.totalEmployees?.value}
          trend={kpis.totalEmployees?.trend}
          sparklineData={kpis.totalEmployees?.sparkline}
          icon={Users}
          colorClass="primary"
          loading={loading}
        />
        <KpiCard
          title="Managers"
          value={kpis.managers?.value}
          trend={kpis.managers?.trend}
          sparklineData={kpis.managers?.sparkline}
          icon={Shield}
          colorClass="purple"
          loading={loading}
        />
        <KpiCard
          title="HR Team"
          value={kpis.hrTeam?.value}
          trend={kpis.hrTeam?.trend}
          sparklineData={kpis.hrTeam?.sparkline}
          icon={Award}
          colorClass="success"
          loading={loading}
        />
        <KpiCard
          title="Present Today"
          value={kpis.presentToday?.value}
          trend={kpis.presentToday?.trend}
          sparklineData={kpis.presentToday?.sparkline}
          icon={UserCheck}
          colorClass="success"
          loading={loading}
        />
        <KpiCard
          title="On Leave Today"
          value={kpis.onLeaveToday?.value}
          trend={kpis.onLeaveToday?.trend}
          isPositiveGood={false}
          sparklineData={kpis.onLeaveToday?.sparkline}
          icon={Calendar}
          colorClass="warning"
          loading={loading}
        />
        <KpiCard
          title="Pending Leaves"
          value={kpis.pendingLeaves?.value}
          trend={kpis.pendingLeaves?.trend}
          isPositiveGood={false}
          sparklineData={kpis.pendingLeaves?.sparkline}
          icon={CalendarClock}
          colorClass="warning"
          loading={loading}
        />
        <KpiCard
          title="Active Tasks"
          value={kpis.activeTasks?.value}
          trend={kpis.activeTasks?.trend}
          sparklineData={kpis.activeTasks?.sparkline}
          icon={ListTodo}
          colorClass="primary"
          loading={loading}
        />
        <KpiCard
          title="Avg Performance"
          value={kpis.avgPerformanceScore?.value}
          trend={kpis.avgPerformanceScore?.trend}
          sparklineData={kpis.avgPerformanceScore?.sparkline}
          icon={TrendingUp}
          colorClass="purple"
          loading={loading}
        />
        <KpiCard
          title="New Joiners"
          badge="This Month"
          value={kpis.newJoiners?.value}
          trend={kpis.newJoiners?.trend}
          sparklineData={kpis.newJoiners?.sparkline}
          icon={Sparkles}
          colorClass="success"
          loading={loading}
        />
        <KpiCard
          title="Attrition Rate"
          value={kpis.attritionRate?.value}
          trend={kpis.attritionRate?.trend}
          isPositiveGood={false}
          sparklineData={kpis.attritionRate?.sparkline}
          icon={UserX}
          colorClass="danger"
          loading={loading}
        />
      </div>

      {/* 4. Charts Row 1: Attendance Trend + Headcount by Dept + Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance trend (6 cols) */}
        <div className="lg:col-span-6">
          <ChartCard
            title="Attendance & Presence Trend"
            subtitle="Daily breakdown of workforce presence, absences, and late check-ins"
            loading={loading}
            isEmpty={attTrend.length === 0}
            minHeight={290}
          >
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={attTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.success.DEFAULT} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={THEME_COLORS.success.DEFAULT} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.danger.DEFAULT} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={THEME_COLORS.danger.DEFAULT} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.warning.DEFAULT} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={THEME_COLORS.warning.DEFAULT} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="date" {...RECHARTS_THEME.axis} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="present" name="Present" stroke={THEME_COLORS.success.DEFAULT} fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} />
                <Area type="monotone" dataKey="absent" name="Absent" stroke={THEME_COLORS.danger.DEFAULT} fillOpacity={1} fill="url(#colorAbsent)" strokeWidth={2} />
                <Area type="monotone" dataKey="late" name="Late Arrivals" stroke={THEME_COLORS.warning.DEFAULT} fillOpacity={1} fill="url(#colorLate)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Headcount by department (3 cols) */}
        <div className="lg:col-span-3">
          <ChartCard
            title="Department Distribution"
            subtitle="Personnel allocation per operational unit"
            loading={loading}
            isEmpty={headcount.length === 0}
            minHeight={290}
          >
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={headcount}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="count"
                >
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

        {/* Role distribution (3 cols) */}
        <div className="lg:col-span-3">
          <ChartCard
            title="Role Hierarchy"
            subtitle="Employees vs Managers vs HR"
            loading={loading}
            isEmpty={roleChartData.length === 0}
            minHeight={290}
          >
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`cell-role-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...RECHARTS_THEME.tooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-2">
              {roleChartData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span>{d.name}</span>
                  <span className="font-bold">({d.value})</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 5. Charts Row 2: Performance Distribution + Top/Bottom Leaderboard + Dept Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Distribution Bar Chart (4 cols) */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Performance Distribution"
            subtitle="Employee ratings categorised into achievement bands"
            loading={loading}
            isEmpty={!performance?.distribution || performance.distribution.length === 0}
            minHeight={280}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={performance?.distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="band" {...RECHARTS_THEME.axis} tick={{ fontSize: 10 }} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Bar dataKey="count" name="Employees" radius={[6, 6, 0, 0]}>
                  {(performance?.distribution || []).map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top 5 & Bottom 5 Leaderboard (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight m-0">
                Talent Scorecard Leaderboard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                Top performers and personnel requiring support
              </p>
            </div>
            <Link
              to="/performance"
              className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1 no-underline"
            >
              <span>Full Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 pt-4">
            {/* Top Performers Section */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 block">
                Top Performers (Outstanding)
              </span>
              <div className="space-y-2">
                {(performance?.topPerformers || []).slice(0, 3).map((p, idx) => (
                  <div key={p.id || idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-xs font-bold shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.designation} &bull; {p.department}</div>
                      </div>
                    </div>
                    <ScoreBadge score={p.score} band={p.band} showIcon={false} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Performers Section */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 block">
                Development &amp; Coaching Focus
              </span>
              <div className="space-y-2">
                {(performance?.bottomPerformers || []).slice(0, 2).map((p, idx) => (
                  <div key={p.id || idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xs font-bold shrink-0">
                        !
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.designation} &bull; {p.department}</div>
                      </div>
                    </div>
                    <ScoreBadge score={p.score} band={p.band} showIcon={false} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Department Performance Comparison (3 cols) */}
        <div className="lg:col-span-3">
          <ChartCard
            title="Department Benchmark"
            subtitle="Average evaluation score by unit"
            loading={loading}
            isEmpty={!performance?.departmentComparison || performance.departmentComparison.length === 0}
            minHeight={280}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={performance?.departmentComparison || []}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis type="number" domain={[0, 100]} {...RECHARTS_THEME.axis} />
                <YAxis dataKey="department" type="category" width={80} {...RECHARTS_THEME.axis} tick={{ fontSize: 10 }} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Bar dataKey="avgScore" name="Avg Score" fill={THEME_COLORS.purple.DEFAULT} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* 6. Charts Row 3: Task Status + Leave Analytics + Hiring Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task status per department (4 cols) */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Task Status by Department"
            subtitle="Completed, in-progress, and overdue sprint tasks"
            loading={loading}
            isEmpty={taskStatus.length === 0}
            minHeight={280}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={taskStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="department" {...RECHARTS_THEME.axis} tick={{ fontSize: 10 }} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="completed" name="Completed" fill={THEME_COLORS.success.DEFAULT} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inProgress" name="In Progress" fill={THEME_COLORS.primary.DEFAULT} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill={THEME_COLORS.danger.DEFAULT} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Leave analytics: breakdown & monthly trend (4 cols) */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Leave Utilization Analytics"
            subtitle="Time-off request volume and seasonal trajectory"
            loading={loading}
            isEmpty={!leavesData?.monthlyTrend || leavesData.monthlyTrend.length === 0}
            minHeight={280}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={leavesData?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="month" {...RECHARTS_THEME.axis} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="approved" name="Approved" stroke={THEME_COLORS.success.DEFAULT} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pending" name="Pending" stroke={THEME_COLORS.warning.DEFAULT} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="rejected" name="Rejected" stroke={THEME_COLORS.danger.DEFAULT} strokeWidth={1.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Hiring & Attrition Trend (4 cols) */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Talent Inflow vs Attrition"
            subtitle="Monthly new hires vs departures"
            loading={loading}
            isEmpty={hiringTrend.length === 0}
            minHeight={280}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hiringTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="month" {...RECHARTS_THEME.axis} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="joiners" name="New Hires" fill={THEME_COLORS.primary.DEFAULT} radius={[4, 4, 0, 0]} />
                <Bar dataKey="leavers" name="Departures" fill={THEME_COLORS.danger.DEFAULT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* 7. Bottom Row: Pending Approvals + Smart Alerts + Upcoming Celebrations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Approvals (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight m-0">
                  Pending Approvals Queue
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                  Review and action leave requests inline
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {pendingApprovals.length} pending
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
              {pendingApprovals.length === 0 ? (
                <EmptyState
                  title="All caught up!"
                  description="No pending employee requests in your queue."
                  compact={true}
                />
              ) : (
                pendingApprovals.map((leave) => (
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

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              to="/leaves"
              className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center justify-between no-underline"
            >
              <span>Manage All Time-Off Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Smart Alerts (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight m-0">
                    Smart Operational Alerts
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">System health &amp; anomalies</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {(overview?.alerts || []).length === 0 ? (
                <EmptyState
                  title="No active alerts"
                  description="All departments are operating within standard parameters."
                  compact={true}
                />
              ) : (
                (overview?.alerts || []).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                      alert.severity === 'danger'
                        ? 'bg-rose-500/5 border-rose-500/20 text-slate-800 dark:text-slate-200'
                        : alert.severity === 'warning'
                        ? 'bg-amber-500/5 border-amber-500/20 text-slate-800 dark:text-slate-200'
                        : 'bg-sky-500/5 border-sky-500/20 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{alert.title}</span>
                      <Link
                        to={alert.actionUrl}
                        className="text-[10px] font-bold text-sky-500 hover:underline shrink-0"
                      >
                        {alert.actionLabel} &rarr;
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">{alert.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              to="/activity"
              className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center justify-between no-underline"
            >
              <span>View Audit Activity Stream</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming Birthdays & Anniversaries (3 cols) */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <PartyPopper className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight m-0">
                  Celebrations
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">Next 30 days milestones</p>
              </div>
            </div>

            <div className="space-y-2.5 mt-3">
              {(overview?.upcomingEvents || []).length === 0 ? (
                <EmptyState
                  title="No upcoming events"
                  description="No birthdays or anniversaries in the next 30 days."
                  compact={true}
                />
              ) : (
                (overview?.upcomingEvents || []).map((ev, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {ev.type === 'BIRTHDAY' ? (
                        <Cake className="w-4 h-4 text-pink-500 shrink-0" />
                      ) : (
                        <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{ev.name}</span>
                        <span className="text-[10px] text-slate-400">{ev.department}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                      {ev.years ? `${ev.years} (${ev.date})` : ev.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              to="/employees"
              className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center justify-between no-underline"
            >
              <span>Employee Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Add Person Drawer */}
      <PersonDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        initialRole={drawerRole}
        onSuccess={() => {
          setIsAddDrawerOpen(false);
          fetchAllAnalytics(true);
          setActionMessage({ type: 'success', text: `New ${drawerRole.toLowerCase()} added successfully!` });
        }}
      />
    </div>
  );
};

export default AdminCommandCenter;
