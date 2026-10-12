import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, CalendarClock, ListTodo,
  Briefcase, Calendar, Shield, Building2, Layers,
  ChevronRight, ArrowRight, UserPlus, Clock,
  CheckCircle2, AlertTriangle, FileText,
  Activity, Settings, Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import PersonDrawer from '../people/PersonDrawer';
import EmptyState from '../common/EmptyState';
import CsvImportModal from '../people/CsvImportModal';

export const AdminCommandCenter = ({ user }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [drawerRole, setDrawerRole] = useState('EMPLOYEE');
  const [actionMessage, setActionMessage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const resOverview = await api.get('/analytics/overview', { params: { range: '30D' } });
      if (resOverview.data?.success) {
        setOverview(resOverview.data.data);
        setPendingApprovals(resOverview.data.data?.pendingApprovals || []);
      }
    } catch (err) {
      console.error('Command Center Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const TABS = [
    'Overview',
    'People',
    'Attendance & Leave',
    'Teams & Tasks',
    'Administration'
  ];

  const kpis = overview?.kpis || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-screen transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#263449]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Shield className="w-3 h-3" />
            Admin Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Executive Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Manage your workforce, approvals, security and operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setDrawerRole('EMPLOYEE'); setIsAddDrawerOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === tab
                ? 'bg-white dark:bg-[#16253D] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-[#334661]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-2.5 animate-fadeIn ${
          actionMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* -------------------- TAB CONTENT -------------------- */}

      {activeTab === 'Overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-[#111C2E] p-4.5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Employees</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">{kpis.totalEmployees?.value || '—'}</span>
            </div>
            <div className="bg-white dark:bg-[#111C2E] p-4.5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Present Today</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{kpis.presentToday?.value || '—'}</span>
            </div>
            <div className="bg-white dark:bg-[#111C2E] p-4.5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pending Leaves</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">{kpis.pendingLeaves?.value || '0'}</span>
            </div>
            <div className="bg-white dark:bg-[#111C2E] p-4.5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Active Tasks</span>
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">{kpis.activeTasks?.value || '0'}</span>
            </div>
            <div className="bg-white dark:bg-[#111C2E] p-4.5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">Joined (7D)</span>
              <span className="text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-400 mt-2">{kpis.newJoiners7D?.value || '0'}</span>
            </div>
            <div className="bg-white dark:bg-[#111C2E] p-4.5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-500">Joined (30D)</span>
              <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 mt-2">{kpis.newJoiners30D?.value || '0'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Area: Requires attention */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Requires Attention</h3>
                <Link to="/leaves" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  View all approvals &rarr;
                </Link>
              </div>

              <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-[#263449]/70">
                  {/* Pending Leaves */}
                  {pendingApprovals.length > 0 ? pendingApprovals.slice(0, 5).map((leave) => (
                    <div key={leave._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#16253D] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <CalendarClock className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {leave.employee?.firstName} {leave.employee?.lastName} requested {leave.numberOfDays} days off
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Starting {new Date(leave.startDate).toLocaleDateString()} • {leave.type || 'Leave'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button
                          onClick={() => handleApproveLeave(leave._id)}
                          className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <Link to="/leaves" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 px-2 py-1.5">
                          Details
                        </Link>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All clear!</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">No pending leave requests requiring review.</p>
                    </div>
                  )}

                  {/* Overdue tasks */}
                  {(overview?.tasks?.overdue > 0) && (
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#16253D] transition-colors bg-rose-50/40 dark:bg-rose-950/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-rose-700 dark:text-rose-300 truncate">
                            {overview.tasks.overdue} overdue task{overview.tasks.overdue > 1 ? 's' : ''} require attention
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Across corporate departments</p>
                        </div>
                      </div>
                      <Link to="/tasks" className="text-xs font-bold text-rose-600 hover:underline px-2 py-1.5 shrink-0 ml-4">
                        Review Tasks &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Area: Bulk Import & Activity */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Admin Actions</h3>

              <div
                className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-emerald-500 transition-all flex items-center justify-between cursor-pointer group"
                onClick={() => setIsImportModalOpen(true)}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Import Employees (CSV)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bulk upload personnel directory</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>

              {/* Recent Alerts List */}
              <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs p-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">System Activity</span>
                <div className="divide-y divide-slate-100 dark:divide-[#263449]/70 mt-2">
                  {(overview?.alerts || []).slice(0, 3).map((alert, idx) => (
                    <div key={idx} className="py-2.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{alert.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{alert.description}</p>
                    </div>
                  ))}
                  {(!overview?.alerts || overview.alerts.length === 0) && (
                    <p className="py-4 text-xs text-slate-400 text-center">System operating nominally.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'People' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          <Link to="/employees" className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-blue-500 transition-all flex items-center justify-between group no-underline">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Employee Directory</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Search, filter and edit workforce profiles</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </Link>

          <Link to="/departments" className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-violet-500 transition-all flex items-center justify-between group no-underline">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Departments</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage functional business units</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
          </Link>

          <Link to="/team-management" className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-teal-500 transition-all flex items-center justify-between group no-underline">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Team Management</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Organize teams and assign reporting leads</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors" />
          </Link>

          <div
            className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-blue-500 transition-all flex items-center justify-between cursor-pointer group"
            onClick={() => { setDrawerRole('MANAGER'); setIsAddDrawerOpen(true); }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Add Manager</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Provision new leadership personnel</p>
              </div>
            </div>
            <UserPlus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      )}

      {activeTab === 'Attendance & Leave' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present Today</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{kpis.presentToday?.value || '—'}</p>
            </div>
            <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On Leave Today</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{kpis.onLeaveToday?.value || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/attendance" className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-blue-500 transition-all flex items-center justify-between group no-underline">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Workforce Attendance Log</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review clock-ins, presence, and overtime</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Link>

            <Link to="/leaves" className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-violet-500 transition-all flex items-center justify-between group no-underline">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Leave Requests & Allowances</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage approval workflows and balances</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'Teams & Tasks' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Tasks</span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{kpis.activeTasks?.value || '0'}</p>
            </div>
            <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Tasks</span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{overview?.tasks?.overdue || '0'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/tasks" className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-blue-500 transition-all flex items-center justify-between group no-underline">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Project Tasks</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Filter, assign and track tasks</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Link>

            <Link to="/team-management" className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs hover:border-teal-500 transition-all flex items-center justify-between group no-underline">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Team Workspaces</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage team assignments and leads</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'Administration' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-slate-200 dark:border-[#263449] shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-[#263449]/70">
            <Link to="/settings" className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#16253D] transition-colors group no-underline">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Access, Security & 2FA</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage RBAC roles, policies, and multi-factor auth</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link to="/activity" className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#16253D] transition-colors group no-underline">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">System Audit & Activity Log</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Inspect security trails and system telemetry</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
            </Link>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      <CsvImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={fetchDashboardData} 
      />

      {/* Quick Add Person Drawer */}
      <PersonDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        initialRole={drawerRole}
        onSuccess={() => {
          setIsAddDrawerOpen(false);
          fetchDashboardData();
          setActionMessage({ type: 'success', text: `New ${drawerRole.toLowerCase()} added successfully!` });
          setTimeout(() => setActionMessage(null), 3500);
        }}
      />
    </div>
  );
};

export default AdminCommandCenter;
