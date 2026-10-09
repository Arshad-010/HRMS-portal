const fs = require('fs');
const path = 'frontend/src/components/dashboard/AdminCommandCenter.jsx';

const newContent = `import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, CalendarClock, ListTodo,
  Briefcase, Calendar, Shield, Building2, Layers,
  ChevronRight, ArrowRight, UserPlus, Clock,
  CheckCircle2, AlertTriangle, FileText,
  Activity, Settings
} from 'lucide-react';
import api from '../../api/axios';
import PersonDrawer from '../people/PersonDrawer';
import EmptyState from '../common/EmptyState';

export const AdminCommandCenter = ({ user }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
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
      const res = await api.put(\`/leaves/\${leaveId}/approve\`, { reviewerComment: 'Approved via Executive Dashboard' });
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500">Manage your workforce and daily operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setDrawerRole('EMPLOYEE'); setIsAddDrawerOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg border border-transparent shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add employee
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={\`px-4 py-2 text-sm font-medium border-b-2 transition-colors \${
              activeTab === tab
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }\`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className={\`p-4 rounded-lg border text-sm font-medium flex items-center gap-2 \${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }\`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* -------------------- TAB CONTENT -------------------- */}

      {activeTab === 'Overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm text-slate-500 font-medium">Total employees</span>
              <span className="text-3xl font-semibold text-slate-900 mt-2">{kpis.totalEmployees?.value || '-'}</span>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm text-slate-500 font-medium">Present today</span>
              <span className="text-3xl font-semibold text-slate-900 mt-2">{kpis.presentToday?.value || '-'}</span>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm text-slate-500 font-medium">Pending leaves</span>
              <span className="text-3xl font-semibold text-slate-900 mt-2">{kpis.pendingLeaves?.value || '0'}</span>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm text-slate-500 font-medium">Active tasks</span>
              <span className="text-3xl font-semibold text-slate-900 mt-2">{kpis.activeTasks?.value || '0'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Area: Requires attention */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Requires Attention</h3>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {/* Pending Leaves */}
                  {pendingApprovals.length > 0 ? pendingApprovals.slice(0, 5).map((leave) => (
                    <div key={leave._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <CalendarClock className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {leave.employee?.firstName} {leave.employee?.lastName} requested {leave.numberOfDays} days off
                          </p>
                          <p className="text-xs text-slate-500 truncate">Starting {new Date(leave.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button onClick={() => handleApproveLeave(leave._id)} className="text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 px-3 py-1.5 rounded-md transition-colors">
                          Approve
                        </button>
                        <Link to="/leaves" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline px-2 py-1.5">
                          View details
                        </Link>
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 text-center">
                      <p className="text-sm text-slate-500">No pending leave requests.</p>
                    </div>
                  )}

                  {/* Tasks Awaiting Review (simulated alert if overdue tasks exist) */}
                  {(overview?.tasks?.overdue > 0) && (
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {overview.tasks.overdue} overdue task{overview.tasks.overdue > 1 ? 's' : ''} require attention
                          </p>
                          <p className="text-xs text-slate-500 truncate">Across various departments</p>
                        </div>
                      </div>
                      <Link to="/tasks" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline px-2 py-1.5 shrink-0 ml-4">
                        Review tasks
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Area: Recent Changes */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Recent Changes</h3>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-1">
                <div className="divide-y divide-slate-50">
                  {/* We map some smart alerts or recent changes */}
                  {(overview?.alerts || []).slice(0, 4).map((alert, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 rounded-md transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-slate-900">{alert.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{alert.description}</p>
                      <Link to={alert.actionUrl} className="text-xs font-medium text-blue-600 hover:underline">
                        {alert.actionLabel} &rarr;
                      </Link>
                    </div>
                  ))}
                  {(!overview?.alerts || overview.alerts.length === 0) && (
                     <div className="p-5 text-center">
                       <p className="text-sm text-slate-500">No recent system alerts or events.</p>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'People' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/employees" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Employee Directory</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Search and filter the complete workforce</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </Link>

            <Link to="/departments" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Departments</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Manage functional business units</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </Link>

            <Link to="/team" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Team Management</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Organize teams and assign leads</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </Link>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between cursor-pointer group" onClick={() => { setDrawerRole('MANAGER'); setIsAddDrawerOpen(true); }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Managers & HR Directory</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Quickly provision new leadership roles</p>
                </div>
              </div>
              <UserPlus className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Attendance & Leave' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm text-slate-500 font-medium">Present Today</span>
              <span className="text-2xl font-semibold text-slate-900 mt-2">{kpis.presentToday?.value || '-'}</span>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm text-slate-500 font-medium">On Leave Today</span>
              <span className="text-2xl font-semibold text-slate-900 mt-2">{kpis.onLeaveToday?.value || '-'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/attendance" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Attendance Log</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Review daily clock-ins and presence</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </Link>
            <Link to="/leaves" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Leave Requests</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Manage all time-off requests</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'Teams & Tasks' && (
        <div className="space-y-6 animate-fade-in">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm text-slate-500 font-medium">Active Tasks</span>
              <span className="text-2xl font-semibold text-slate-900 mt-2">{kpis.activeTasks?.value || '-'}</span>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm text-slate-500 font-medium">Overdue Tasks</span>
              <span className="text-2xl font-semibold text-red-600 mt-2">{overview?.tasks?.overdue || '0'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/tasks" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Project Tasks</h4>
                  <p className="text-xs text-slate-500 mt-0.5">View and filter company-wide tasks</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </Link>
            <Link to="/team" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Team Workspaces</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Manage memberships and assignments</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'Administration' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              <Link to="/settings" className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Access & Security</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Manage RBAC roles, policies, and permissions</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>
              
              <Link to="/activity" className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">System Audit Log</h4>
                    <p className="text-xs text-slate-500 mt-0.5">View security trails and system telemetry</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>

              <div className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => { setDrawerRole('EMPLOYEE'); setIsAddDrawerOpen(true); }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Provisioning</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Manually create new user accounts</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Person Drawer */}
      <PersonDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        initialRole={drawerRole}
        onSuccess={() => {
          setIsAddDrawerOpen(false);
          fetchDashboardData();
          setActionMessage({ type: 'success', text: \`New \${drawerRole.toLowerCase()} added successfully!\` });
          setTimeout(() => setActionMessage(null), 3500);
        }}
      />
    </div>
  );
};

export default AdminCommandCenter;
`;

fs.writeFileSync(path, newContent, 'utf8');
console.log('Successfully redesigned AdminCommandCenter.jsx');
