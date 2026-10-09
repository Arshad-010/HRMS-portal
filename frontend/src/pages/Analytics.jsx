import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, Clock, Calendar, CheckSquare, Award,
  TrendingUp, Download, Filter, RefreshCw, ChevronRight,
  Shield, Sparkles, Layers, FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid
} from 'recharts';
import api from '../api/axios';
import ChartCard from '../components/common/ChartCard';
import EmptyState from '../components/common/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { THEME_COLORS, RECHARTS_THEME } from '../constants/themeColors';

export const Analytics = () => {
  const [activeTab, setActiveTab] = useState('Workforce'); // 'Workforce' | 'Attendance' | 'Leave' | 'Tasks' | 'Performance' | 'Hiring'
  const [range, setRange] = useState('30D');
  const [departmentId, setDepartmentId] = useState('ALL');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Datasets
  const [overview, setOverview] = useState(null);
  const [attTrend, setAttTrend] = useState([]);
  const [headcount, setHeadcount] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [leavesData, setLeavesData] = useState(null);
  const [taskStatus, setTaskStatus] = useState([]);
  const [hiringTrend, setHiringTrend] = useState([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data?.success) setDepartments(res.data.data || []);
      } catch (e) {
        console.error('Dept fetch error:', e);
      }
    };
    fetchDepts();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
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

      if (resOverview.data?.success) setOverview(resOverview.data.data);
      if (resAttTrend.data?.success) setAttTrend(resAttTrend.data.data || []);
      if (resHeadcount.data?.success) setHeadcount(resHeadcount.data.data || []);
      if (resPerf.data?.success) setPerformance(resPerf.data.data || null);
      if (resLeaves.data?.success) setLeavesData(resLeaves.data.data || null);
      if (resTasks.data?.success) setTaskStatus(resTasks.data.data || []);
      if (resHiring.data?.success) setHiringTrend(resHiring.data.data || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range, departmentId]);

  // Client-side CSV export
  const handleExportTabCSV = () => {
    let rows = [];
    if (activeTab === 'Attendance') {
      rows = [['Date', 'Present', 'Absent', 'Late', 'Attendance Rate (%)']];
      attTrend.forEach(d => rows.push([d.fullDate || d.date, d.present, d.absent, d.late, d.rate]));
    } else if (activeTab === 'Workforce') {
      rows = [['Department', 'Headcount', 'Active', 'On Leave']];
      headcount.forEach(d => rows.push([d.name, d.count, d.active, d.onLeave]));
    } else if (activeTab === 'Tasks') {
      rows = [['Department', 'Completed', 'In Progress', 'Overdue']];
      taskStatus.forEach(d => rows.push([d.department, d.completed, d.inProgress, d.overdue]));
    } else if (activeTab === 'Hiring') {
      rows = [['Month', 'New Hires', 'Departures']];
      hiringTrend.forEach(d => rows.push([d.month, d.joiners, d.leavers]));
    } else {
      rows = [['Metric', 'Value']];
      if (overview?.kpis) {
        Object.entries(overview.kpis).forEach(([k, v]) => rows.push([k, v.value]));
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.setAttribute('download', `HRMS_${activeTab}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { key: 'Workforce', label: 'Workforce', icon: Users },
    { key: 'Attendance', label: 'Attendance', icon: Clock },
    { key: 'Leave', label: 'Leave', icon: Calendar },
    { key: 'Tasks', label: 'Tasks', icon: CheckSquare },
    { key: 'Performance', label: 'Performance', icon: Award },
    { key: 'Hiring', label: 'Hiring', icon: TrendingUp },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dedicated Reporting Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Workforce Intelligence &amp; Analytics Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Exportable business intelligence, trends, and department breakdowns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Range pills */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {['7D', '30D', 'Quarter', 'Year'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  range === r ? 'bg-sky-500 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Department filter */}
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          {/* Export CSV button */}
          <button
            onClick={handleExportTabCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export {activeTab} CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: WORKFORCE */}
      {activeTab === 'Workforce' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Department Headcount Distribution"
              subtitle="How is human capital divided across departments?"
              minHeight={290}
            >
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={headcount} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...RECHARTS_THEME.grid} />
                  <XAxis dataKey="name" {...RECHARTS_THEME.axis} tick={{ fontSize: 10 }} />
                  <YAxis {...RECHARTS_THEME.axis} />
                  <Tooltip {...RECHARTS_THEME.tooltip} />
                  <Bar dataKey="count" name="Total Personnel" fill={THEME_COLORS.primary.DEFAULT} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Workforce Allocation by Department"
              subtitle="Relative percentage share of organizational talent"
              minHeight={290}
            >
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={headcount} dataKey="count" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {headcount.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RECHARTS_THEME.palette[index % RECHARTS_THEME.palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...RECHARTS_THEME.tooltip} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Data Table Underneath */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
              Department Telemetry Breakdown Table
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-5">Department</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Total Members</th>
                  <th className="p-3.5">Active</th>
                  <th className="p-3.5">On Leave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {headcount.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 pl-5 font-bold">{row.name}</td>
                    <td className="p-3.5 font-mono">{row.code}</td>
                    <td className="p-3.5 font-bold text-sky-500">{row.count}</td>
                    <td className="p-3.5 text-emerald-500">{row.active}</td>
                    <td className="p-3.5 text-amber-500">{row.onLeave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: ATTENDANCE */}
      {activeTab === 'Attendance' && (
        <div className="space-y-6">
          <ChartCard
            title="Daily Presence & Attendance Trajectory"
            subtitle="Who is present, absent, or late across the calendar period?"
            minHeight={320}
          >
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={attTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="date" {...RECHARTS_THEME.axis} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="present" name="Present" stroke={THEME_COLORS.success.DEFAULT} fill={THEME_COLORS.success.bgLight} strokeWidth={2} />
                <Area type="monotone" dataKey="late" name="Late Arrivals" stroke={THEME_COLORS.warning.DEFAULT} fill={THEME_COLORS.warning.bgLight} strokeWidth={2} />
                <Area type="monotone" dataKey="absent" name="Absent" stroke={THEME_COLORS.danger.DEFAULT} fill={THEME_COLORS.danger.bgLight} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Attendance Data Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
              Daily Attendance Ledger Records
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-5">Date</th>
                  <th className="p-3.5">Present Count</th>
                  <th className="p-3.5">Late Check-ins</th>
                  <th className="p-3.5">Absent</th>
                  <th className="p-3.5">Presence Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {attTrend.slice(0, 15).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 pl-5 font-bold">{row.fullDate || row.date}</td>
                    <td className="p-3.5 text-emerald-500 font-bold">{row.present}</td>
                    <td className="p-3.5 text-amber-500">{row.late}</td>
                    <td className="p-3.5 text-rose-500">{row.absent}</td>
                    <td className="p-3.5 font-bold">{row.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: LEAVE */}
      {activeTab === 'Leave' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Time-Off Approvals & Status Pipeline"
              subtitle="Monthly trend of approved, pending, and rejected leave requests"
              minHeight={290}
            >
              <ResponsiveContainer width="100%" height={290}>
                <LineChart data={leavesData?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...RECHARTS_THEME.grid} />
                  <XAxis dataKey="month" {...RECHARTS_THEME.axis} />
                  <YAxis {...RECHARTS_THEME.axis} />
                  <Tooltip {...RECHARTS_THEME.tooltip} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="approved" name="Approved" stroke={THEME_COLORS.success.DEFAULT} strokeWidth={2.5} />
                  <Line type="monotone" dataKey="pending" name="Pending" stroke={THEME_COLORS.warning.DEFAULT} strokeWidth={2} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="rejected" name="Rejected" stroke={THEME_COLORS.danger.DEFAULT} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Quota Utilization by Leave Category"
              subtitle="Breakdown of taken leave by casual, sick, earned, or unpaid"
              minHeight={290}
            >
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={leavesData?.types || []} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {(leavesData?.types || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RECHARTS_THEME.palette[index % RECHARTS_THEME.palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...RECHARTS_THEME.tooltip} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Tab: TASKS */}
      {activeTab === 'Tasks' && (
        <div className="space-y-6">
          <ChartCard
            title="Workforce Sprint Output & Deliverables"
            subtitle="Completed, in-flight, and overdue work tasks per organizational division"
            minHeight={320}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={taskStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="department" {...RECHARTS_THEME.axis} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="completed" name="Completed" fill={THEME_COLORS.success.DEFAULT} stackId="a" />
                <Bar dataKey="inProgress" name="In Progress" fill={THEME_COLORS.primary.DEFAULT} stackId="a" />
                <Bar dataKey="overdue" name="Overdue" fill={THEME_COLORS.danger.DEFAULT} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Tab: PERFORMANCE */}
      {activeTab === 'Performance' && (
        <div className="space-y-6">
          <ChartCard
            title="Department Performance Benchmark"
            subtitle="Comparing score averages across business units"
            minHeight={300}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance?.departmentComparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="department" {...RECHARTS_THEME.axis} />
                <YAxis domain={[0, 100]} {...RECHARTS_THEME.axis} />
                <Tooltip {...RECHARTS_THEME.tooltip} />
                <Bar dataKey="avgScore" name="Average Score" fill={THEME_COLORS.purple.DEFAULT} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Tab: HIRING */}
      {activeTab === 'Hiring' && (
        <div className="space-y-6">
          <ChartCard
            title="Talent Net Growth & Turnover Trajectory"
            subtitle="Monthly comparison of employee onboarding vs attrition"
            minHeight={320}
          >
            <ResponsiveContainer width="100%" height={320}>
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
      )}
    </div>
  );
};

export default Analytics;
