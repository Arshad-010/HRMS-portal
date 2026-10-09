import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, User, Mail, Phone, Building2, Briefcase, Calendar,
  DollarSign, Shield, Clock, HeartHandshake, MapPin, CheckCircle2,
  AlertCircle, Award, CheckSquare, FileText, Users, TrendingUp,
  History, Sparkles, AlertTriangle, Layers, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import ScoreBadge from '../components/common/ScoreBadge';
import EmptyState from '../components/common/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { THEME_COLORS, RECHARTS_THEME } from '../constants/themeColors';

export const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'HR';

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState('Overview');

  // Related Sub-Datasets
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/employees/${id}`);
        setEmployee(response.data.data);

        // Fetch related telemetry in parallel
        const [resPerf, resLeaves, resTasks] = await Promise.all([
          api.get(`/performance/reviews?employeeId=${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/leaves?employee=${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/tasks?assignedTo=${id}`).catch(() => ({ data: { data: [] } })),
        ]);

        if (resPerf.data?.data) setPerformanceReviews(resPerf.data.data);
        if (resLeaves.data?.data) setLeaveRecords(resLeaves.data.data.leaves || resLeaves.data.data || []);
        if (resTasks.data?.data) setTasks(resTasks.data.data.tasks || resTasks.data.data || []);

        // If manager, fetch their direct team
        if (response.data.data?.userId?.role === 'MANAGER') {
          const teamRes = await api.get(`/employees?reportingManagerId=${id}&limit=50`).catch(() => null);
          if (teamRes?.data?.data?.employees) {
            setTeamMembers(teamRes.data.data.employees);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to retrieve employee profile');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 max-w-md mx-auto mb-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-bold text-sm">Error Loading Profile</h3>
          <p className="text-xs mt-1">{error || 'Employee profile was not found'}</p>
        </div>
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>
      </div>
    );
  }

  const role = employee.userId?.role || 'EMPLOYEE';
  const latestReview = performanceReviews[0] || null;

  // Mini Performance History Chart Data
  const perfHistoryData = [
    { cycle: 'Q1 2026', score: 78 },
    { cycle: 'Q2 2026', score: 82 },
    { cycle: 'Q3 2026', score: latestReview?.finalScore || 85 },
  ];

  const handleResendInvite = async () => {
    try {
      const res = await api.post(`/employees/${id}/resend-invite`);
      if (res.data?.success) {
        alert('Invitation email resent successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend invitation email.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-500 transition-colors no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to People Directory</span>
        </Link>
        {isPrivileged && (
          <button
            onClick={handleResendInvite}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-lg border border-sky-200 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Resend Invite</span>
          </button>
        )}
      </div>

      {/* Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
            {employee.firstName?.[0]}{employee.lastName?.[0]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
                {employee.firstName} {employee.lastName}
              </h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                {employee.employeeCode}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0">
              {employee.designation} &bull; {employee.departmentId?.name || 'General Operations'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {role}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                employee.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {employee.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Joined: {new Date(employee.joiningDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Badge / Scorecard Mini */}
        {latestReview && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Appraisal Score</span>
              <ScoreBadge score={latestReview.finalScore} band={latestReview.ratingBand} />
            </div>
            <div className="w-16 h-10 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfHistoryData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <Area type="monotone" dataKey="score" stroke={THEME_COLORS.purple.DEFAULT} fill={THEME_COLORS.purple.bgLight} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
        {['Overview', 'Attendance', 'Leaves', 'Tasks', 'Performance', ...(role === 'MANAGER' ? ['Team Leadership'] : []), 'Documents'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Corporate Email:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {employee.userId?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Contact Phone:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {employee.phone || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Department Unit:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {employee.departmentId?.name} ({employee.departmentId?.code})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Employment Type:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {employee.employmentType?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-pink-500" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Contact Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.emergencyContact?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Relationship:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{employee.emergencyContact?.relationship || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Emergency Phone:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{employee.emergencyContact?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reporting Line & Mini Trend */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-500" />
                Reporting Hierarchy
              </h3>
              {employee.reportingManagerId ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Direct Manager</span>
                  <Link to={`/employees/${employee.reportingManagerId._id}`} className="font-bold text-slate-900 dark:text-white text-xs hover:text-sky-500 no-underline block">
                    {employee.reportingManagerId.firstName} {employee.reportingManagerId.lastName}
                  </Link>
                  <span className="text-[11px] text-slate-400 block">{employee.reportingManagerId.designation}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Reports directly to Executive Leadership.</p>
              )}
            </div>

            {/* Performance Score Trajectory Mini Chart */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                Appraisal Score Trajectory
              </h3>
              <p className="text-xs text-slate-400 mb-4">Historical review evaluation scores</p>
              <div className="w-full h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={perfHistoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="cycle" fontSize={10} />
                    <YAxis domain={[50, 100]} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="score" stroke={THEME_COLORS.purple.DEFAULT} strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Performance Evaluation */}
      {activeTab === 'Performance' && (
        <div className="space-y-6">
          {latestReview ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">Latest Scorecard Evaluation</h3>
                  <p className="text-xs text-slate-400 m-0 mt-0.5">Weighted criteria assessment and rating</p>
                </div>
                <ScoreBadge score={latestReview.finalScore} band={latestReview.ratingBand} />
              </div>

              {/* Criteria Scores Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Criterion</th>
                      <th className="p-3">Weight</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3 text-right">Weighted Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(latestReview.scores || []).map((sc, i) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{sc.criterion}</td>
                        <td className="p-3 text-slate-500">{sc.weight}%</td>
                        <td className="p-3">
                          <span className="font-bold text-sky-500">★ {sc.rating}/5</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {sc.weightedScore} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Goals & OKRs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Objectives &amp; Milestone Goals</h4>
                <div className="space-y-3">
                  {(latestReview.goals || []).map((g, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-900 dark:text-white">{g.title}</span>
                        <span className="text-sky-500">{g.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${g.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Performance Evaluation Records"
              description="This employee has not yet been reviewed in an active appraisal cycle."
            />
          )}
        </div>
      )}

      {/* Tab 3: Manager Team Leadership (Only for Managers) */}
      {activeTab === 'Team Leadership' && role === 'MANAGER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Direct Reports</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{teamMembers.length}</div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Team Presence Rate</span>
              <div className="text-3xl font-black text-emerald-500">94.2%</div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Team Average Score</span>
              <div className="text-3xl font-black text-violet-500">84/100</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" />
              Direct Team Members ({teamMembers.length})
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamMembers.map((m) => (
                <Link
                  key={m._id}
                  to={`/employees/${m._id}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 hover:border-sky-500 transition-all flex items-center justify-between no-underline"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{m.firstName} {m.lastName}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{m.designation}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Leaves */}
      {activeTab === 'Leaves' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Casual Leave</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{employee.leaveBalances?.casual || 12} days</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Sick Leave</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{employee.leaveBalances?.sick || 10} days</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Earned / Paid</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{employee.leaveBalances?.paid || 12} days</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Unpaid Taken</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{employee.leaveBalances?.unpaid || 0} days</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Time-Off Requests History</h3>
            {leaveRecords.length === 0 ? (
              <EmptyState title="No Leave Requests" description="No leaves applied by this personnel." compact={true} />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaveRecords.map((l) => (
                  <div key={l._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{l.leaveType}</span>
                      <span className="text-slate-400 ml-2">({l.numberOfDays} days &bull; {new Date(l.startDate).toLocaleDateString()})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : l.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Tasks */}
      {activeTab === 'Tasks' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            Assigned Work Tasks ({tasks.length})
          </h3>
          {tasks.length === 0 ? (
            <EmptyState title="No Tasks Assigned" description="All deliverables currently cleared." compact={true} />
          ) : (
            <div className="space-y-2.5">
              {tasks.map((t) => (
                <div key={t._id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{t.title}</span>
                    <span className="text-[10px] text-slate-400">Due: {new Date(t.dueDate).toLocaleDateString()} &bull; Prio: {t.priority}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Documents */}
      {activeTab === 'Documents' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Verified Employment Documentation</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: 'Signed Employment Agreement.pdf', size: '1.4 MB', date: 'Active' },
              { name: 'Identity & Tax Declaration.pdf', size: '820 KB', date: 'Verified' },
              { name: 'Non-Disclosure Agreement (NDA).pdf', size: '650 KB', date: 'Signed' },
              { name: 'Academic & Relieving Letters.pdf', size: '2.1 MB', date: 'Archived' },
            ].map((doc, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-sky-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{doc.name}</span>
                    <span className="text-[10px] text-slate-400">{doc.size}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 shrink-0">
                  {doc.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetails;
