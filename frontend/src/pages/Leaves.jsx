import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  CalendarDays,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Users,
  Eye,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react';

export const Leaves = () => {
  const { user } = useAuth();
  const isManagerOrAbove = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';

  // Active Tab: 'my' (Personal Leaves) or 'queue' (Approval Queue / Workforce)
  const [activeTab, setActiveTab] = useState('my');

  // Balances state
  const [balances, setBalances] = useState({
    casual: 12,
    sick: 10,
    earned: 12,
    paid: 12,
    other: 5,
    unpaid: 0,
  });
  const [usedBalances, setUsedBalances] = useState({
    casual: 0,
    sick: 0,
    earned: 0,
    other: 0,
    unpaid: 0,
  });

  // Personal leaves state
  const [myLeaves, setMyLeaves] = useState([]);
  const [myStats, setMyStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
    approvedDays: 0,
  });
  const [myLoading, setMyLoading] = useState(true);
  const [myFilterStatus, setMyFilterStatus] = useState('');
  const [myFilterType, setMyFilterType] = useState('');

  // Queue & Team leaves state (Admin, HR, Manager)
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [teamTotal, setTeamTotal] = useState(0);
  const [teamPage, setTeamPage] = useState(1);
  const [teamPages, setTeamPages] = useState(1);
  const [teamLimit] = useState(10);
  const [teamLoading, setTeamLoading] = useState(false);

  // Filters for Team queue
  const [queueSearch, setQueueSearch] = useState('');
  const [queueStatus, setQueueStatus] = useState('PENDING'); // Defaults to PENDING for fast review
  const [queueType, setQueueType] = useState('');
  const [queueDept, setQueueDept] = useState('');
  const [queueStartDate, setQueueStartDate] = useState('');
  const [queueEndDate, setQueueEndDate] = useState('');
  const [departments, setDepartments] = useState([]);

  // Apply Leave Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState({ message: '', error: '' });
  const [applyForm, setApplyForm] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Details & Review Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState({ message: '', error: '' });

  // Format Helper functions
  const formatDateStr = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'CANCELLED':
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'CASUAL':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'SICK':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'EARNED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'UNPAID':
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
      case 'OTHER':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
    }
  };

  // Fetch Balances
  const fetchBalances = async () => {
    try {
      const res = await api.get('/leaves/balance');
      if (res.data.data?.balances) {
        setBalances(res.data.data.balances);
      }
      if (res.data.data?.used) {
        setUsedBalances(res.data.data.used);
      }
    } catch (err) {
      console.warn('Failed to load leave balances:', err.message);
    }
  };

  // Fetch My Leaves
  const fetchMyLeaves = async () => {
    setMyLoading(true);
    try {
      const params = new URLSearchParams();
      if (myFilterStatus) params.append('status', myFilterStatus);
      if (myFilterType) params.append('leaveType', myFilterType);

      const res = await api.get(`/leaves/my?${params.toString()}`);
      const data = res.data.data;
      setMyLeaves(data.leaves || []);
      if (data.stats) setMyStats(data.stats);
      if (data.balances) setBalances(data.balances);
    } catch (err) {
      console.warn('Failed to load my leaves:', err.message);
    } finally {
      setMyLoading(false);
    }
  };

  // Fetch Departments for filtering
  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load departments:', err.message);
    }
  };

  // Fetch Team / Approval Queue leaves
  const fetchTeamLeaves = async () => {
    if (!isManagerOrAbove) return;
    setTeamLoading(true);
    try {
      const params = new URLSearchParams({
        page: teamPage.toString(),
        limit: teamLimit.toString(),
      });

      if (queueStatus) params.append('status', queueStatus);
      if (queueType) params.append('leaveType', queueType);
      if (queueDept) params.append('department', queueDept);
      if (queueStartDate) params.append('startDate', queueStartDate);
      if (queueEndDate) params.append('endDate', queueEndDate);

      const res = await api.get(`/leaves?${params.toString()}`);
      const data = res.data.data;
      let list = data.leaves || [];

      if (queueSearch.trim()) {
        const q = queueSearch.toLowerCase().trim();
        list = list.filter((l) => {
          const emp = l.employee || {};
          const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
          const code = (emp.employeeCode || '').toLowerCase();
          return name.includes(q) || code.includes(q);
        });
      }

      setTeamLeaves(list);
      setTeamTotal(data.total || 0);
      setTeamPages(data.pages || 1);
    } catch (err) {
      console.warn('Failed to load approval queue:', err.message);
    } finally {
      setTeamLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchBalances();
    fetchMyLeaves();
    fetchDepartments();
  }, []);

  // Re-fetch my leaves on filter change
  useEffect(() => {
    fetchMyLeaves();
  }, [myFilterStatus, myFilterType]);

  // Re-fetch team queue on tab or filter change
  useEffect(() => {
    if (activeTab === 'queue' && isManagerOrAbove) {
      fetchTeamLeaves();
    }
  }, [activeTab, teamPage, queueStatus, queueType, queueDept, queueStartDate, queueEndDate]);

  // Calculate live days preview in Apply Form
  const calculateFormDays = () => {
    if (!applyForm.startDate || !applyForm.endDate) return 0;
    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Available balance for currently selected leave type
  const getSelectedTypeBalance = () => {
    switch (applyForm.leaveType) {
      case 'CASUAL':
        return balances.casual ?? 0;
      case 'SICK':
        return balances.sick ?? 0;
      case 'EARNED':
        return balances.earned ?? balances.paid ?? 0;
      case 'OTHER':
        return balances.other ?? 0;
      case 'UNPAID':
        return 'Unlimited';
      default:
        return 0;
    }
  };

  // Handle Apply Form Submit
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplySubmitting(true);
    setApplyFeedback({ message: '', error: '' });

    const calculatedDays = calculateFormDays();
    if (calculatedDays <= 0) {
      setApplyFeedback({ message: '', error: 'End date cannot be earlier than start date.' });
      setApplySubmitting(false);
      return;
    }

    const available = getSelectedTypeBalance();
    if (available !== 'Unlimited' && calculatedDays > available) {
      setApplyFeedback({
        message: '',
        error: `Insufficient ${applyForm.leaveType} balance. You requested ${calculatedDays} days but have ${available} available.`,
      });
      setApplySubmitting(false);
      return;
    }

    try {
      await api.post('/leaves', {
        leaveType: applyForm.leaveType,
        startDate: applyForm.startDate,
        endDate: applyForm.endDate,
        reason: applyForm.reason.trim(),
      });

      setApplyFeedback({
        message: 'Leave application submitted successfully! Your reviewer will be notified.',
        error: '',
      });

      await fetchBalances();
      await fetchMyLeaves();
      if (activeTab === 'queue') await fetchTeamLeaves();

      setTimeout(() => {
        setApplyModalOpen(false);
        setApplyForm({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
      }, 1200);
    } catch (err) {
      setApplyFeedback({ message: '', error: err.message || 'Failed to submit leave application' });
    } finally {
      setApplySubmitting(false);
    }
  };

  // Handle Review (Approve / Reject)
  const handleReviewAction = async (action) => {
    if (!selectedLeave) return;
    setReviewLoading(true);
    setReviewFeedback({ message: '', error: '' });

    try {
      if (action === 'APPROVE') {
        await api.patch(`/leaves/${selectedLeave._id}/approve`, {
          reviewerComment: reviewComment.trim(),
        });
        setReviewFeedback({ message: 'Leave request approved successfully!', error: '' });
      } else if (action === 'REJECT') {
        if (!reviewComment.trim()) {
          setReviewFeedback({ message: '', error: 'Please provide a comment explaining the rejection reason.' });
          setReviewLoading(false);
          return;
        }
        await api.patch(`/leaves/${selectedLeave._id}/reject`, {
          reviewerComment: reviewComment.trim(),
        });
        setReviewFeedback({ message: 'Leave request rejected.', error: '' });
      }

      await fetchBalances();
      await fetchMyLeaves();
      if (isManagerOrAbove) await fetchTeamLeaves();

      setTimeout(() => {
        setDetailsModalOpen(false);
        setSelectedLeave(null);
        setReviewComment('');
      }, 1000);
    } catch (err) {
      setReviewFeedback({ message: '', error: err.message || `Failed to ${action.toLowerCase()} leave request` });
    } finally {
      setReviewLoading(false);
    }
  };

  // Handle Cancel Leave
  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;

    try {
      await api.post(`/leaves/${leaveId}/cancel`);
      alert('Leave request cancelled successfully.');
      await fetchBalances();
      await fetchMyLeaves();
      if (isManagerOrAbove) await fetchTeamLeaves();
      if (detailsModalOpen) setDetailsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to cancel leave request');
    }
  };

  const openDetailsModal = (leave) => {
    setSelectedLeave(leave);
    setReviewComment('');
    setReviewFeedback({ message: '', error: '' });
    setDetailsModalOpen(true);
  };

  // Check if current user is authorized to review the selected leave
  const canReviewSelected = () => {
    if (!selectedLeave || selectedLeave.status !== 'PENDING') return false;
    if (user?.role === 'ADMIN' || user?.role === 'HR') return true;
    if (user?.role === 'MANAGER') {
      const emp = selectedLeave.employee || {};
      return emp.reportingManagerId?._id?.toString() === user?.employeeId?.toString() ||
             emp.reportingManagerId?.toString() === user?.employeeId?.toString();
    }
    return false;
  };

  const formDays = calculateFormDays();
  const availableForForm = getSelectedTypeBalance();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Leave Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Apply for annual time-off, track balance quotas, and process team approval requests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchBalances();
              fetchMyLeaves();
              if (activeTab === 'queue') fetchTeamLeaves();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setApplyFeedback({ message: '', error: '' });
              setApplyModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* SECTION 10: LEAVE BALANCES PROGRESS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 my-6">
        {/* Casual Leave */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Casual Leave</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Paid
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{balances.casual ?? 0}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400"> days left</span>
            </div>
            <span className="text-[11px] text-slate-500">Used: {usedBalances.casual ?? 0}</span>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-indigo-500 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((usedBalances.casual ?? 0) / Math.max(1, (balances.casual ?? 0) + (usedBalances.casual ?? 0))) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Sick Leave */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Sick Leave</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Paid
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{balances.sick ?? 0}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400"> days left</span>
            </div>
            <span className="text-[11px] text-slate-500">Used: {usedBalances.sick ?? 0}</span>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-rose-500 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((usedBalances.sick ?? 0) / Math.max(1, (balances.sick ?? 0) + (usedBalances.sick ?? 0))) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Earned / Annual Leave */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Earned Leave</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Paid
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{balances.earned ?? balances.paid ?? 0}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400"> days left</span>
            </div>
            <span className="text-[11px] text-slate-500">Used: {usedBalances.earned ?? 0}</span>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((usedBalances.earned ?? 0) /
                    Math.max(1, (balances.earned ?? balances.paid ?? 0) + (usedBalances.earned ?? 0))) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Other Leave */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Other Quota</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Paid
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{balances.other ?? 0}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400"> days left</span>
            </div>
            <span className="text-[11px] text-slate-500">Used: {usedBalances.other ?? 0}</span>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-purple-500 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((usedBalances.other ?? 0) / Math.max(1, (balances.other ?? 0) + (usedBalances.other ?? 0))) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Unpaid Leave */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Unpaid Leave</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              Unpaid
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{usedBalances.unpaid ?? 0}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400"> days taken</span>
            </div>
            <span className="text-[10px] text-slate-500">No balance deduction</span>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-600 h-1.5 rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'my'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>My Leave Requests</span>
          {myStats.pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
              {myStats.pendingCount}
            </span>
          )}
        </button>

        {isManagerOrAbove && (
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Approval Queue &amp; Team Requests</span>
          </button>
        )}
      </div>

      {/* TAB 1: MY LEAVE REQUESTS */}
      {activeTab === 'my' && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <select
                  value={myFilterStatus}
                  onChange={(e) => setMyFilterStatus(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <select
                  value={myFilterType}
                  onChange={(e) => setMyFilterType(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">All Leave Types</option>
                  <option value="CASUAL">CASUAL</option>
                  <option value="SICK">SICK</option>
                  <option value="EARNED">EARNED</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {(myFilterStatus || myFilterType) && (
                <button
                  onClick={() => {
                    setMyFilterStatus('');
                    setMyFilterType('');
                  }}
                  className="text-xs text-indigo-400 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Total Approved Days: <strong className="text-slate-900 dark:text-white">{myStats.approvedDays || 0} days</strong>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {myLoading ? (
              <div className="py-20 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading leave requests...</span>
              </div>
            ) : myLeaves.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No leave requests found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Apply for Leave" above to submit a new time-off application.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3.5 px-4">Leave Type</th>
                      <th className="py-3.5 px-4">Start Date</th>
                      <th className="py-3.5 px-4">End Date</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Reviewer</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {myLeaves.map((leave) => (
                      <tr key={leave._id} className="hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadge(
                              leave.leaveType
                            )}`}
                          >
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{formatDateStr(leave.startDate)}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{formatDateStr(leave.endDate)}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{leave.numberOfDays} days</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400">{leave.reason}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              leave.status
                            )}`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {leave.reviewedBy
                            ? `${leave.reviewedBy.firstName || ''} ${leave.reviewedBy.lastName || ''}`
                            : '--'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetailsModal(leave)}
                              title="View Details"
                              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {(leave.status === 'PENDING' || leave.status === 'APPROVED') && (
                              <button
                                onClick={() => handleCancelLeave(leave._id)}
                                title="Cancel Leave"
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPROVAL QUEUE & TEAM REQUESTS */}
      {activeTab === 'queue' && isManagerOrAbove && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Employee Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, code..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none"
                />
              </div>

              {/* Status Selector */}
              <div>
                <select
                  value={queueStatus}
                  onChange={(e) => {
                    setQueueStatus(e.target.value);
                    setTeamPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING (Action Required)</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Leave Type Selector */}
              <div>
                <select
                  value={queueType}
                  onChange={(e) => {
                    setQueueType(e.target.value);
                    setTeamPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">All Leave Types</option>
                  <option value="CASUAL">CASUAL</option>
                  <option value="SICK">SICK</option>
                  <option value="EARNED">EARNED</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {/* Department Selector */}
              <div>
                <select
                  value={queueDept}
                  onChange={(e) => {
                    setQueueDept(e.target.value);
                    setTeamPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div>
                <button
                  onClick={() => {
                    setQueueSearch('');
                    setQueueStatus('');
                    setQueueType('');
                    setQueueDept('');
                    setQueueStartDate('');
                    setQueueEndDate('');
                    setTeamPage(1);
                  }}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer text-center"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Date Range Row */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-400" /> Date Range:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={queueStartDate}
                  onChange={(e) => {
                    setQueueStartDate(e.target.value);
                    setTeamPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
                <span className="text-slate-500">to</span>
                <input
                  type="date"
                  value={queueEndDate}
                  onChange={(e) => {
                    setQueueEndDate(e.target.value);
                    setTeamPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {teamLoading ? (
              <div className="py-20 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading queue records...</span>
              </div>
            ) : teamLeaves.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No leave requests matching filter</p>
                <p className="text-xs text-slate-500 mt-1">Pending approval requests will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Leave Type</th>
                      <th className="py-3.5 px-4">Dates</th>
                      <th className="py-3.5 px-4">Days</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {teamLeaves.map((leave) => {
                      const emp = leave.employee || {};
                      const fullName = emp.firstName ? `${emp.firstName} ${emp.lastName}` : 'Unknown';

                      return (
                        <tr key={leave._id} className="hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">
                                {emp.firstName ? emp.firstName[0] : 'E'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white block">{fullName}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{emp.employeeCode || 'N/A'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{emp.departmentId?.name || 'Unassigned'}</td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadge(
                                leave.leaveType
                              )}`}
                            >
                              {leave.leaveType}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {formatDateStr(leave.startDate)} - {formatDateStr(leave.endDate)}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{leave.numberOfDays}d</td>

                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{leave.reason}</td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                                leave.status
                              )}`}
                            >
                              {leave.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openDetailsModal(leave)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                leave.status === 'PENDING'
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95'
                                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {leave.status === 'PENDING' ? 'Review Request' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {teamPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing page <strong className="text-slate-900 dark:text-white">{teamPage}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{teamPages}</strong> ({teamTotal} total requests)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={teamPage <= 1}
                    onClick={() => setTeamPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={teamPage >= teamPages}
                    onClick={() => setTeamPage((p) => Math.min(teamPages, p + 1))}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 8: APPLY LEAVE MODAL */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Apply for Leave
              </h3>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white p-1 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4 text-xs">
              {/* Leave Type */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Type *</label>
                <select
                  required
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="CASUAL">Casual Leave (Paid)</option>
                  <option value="SICK">Sick Leave (Paid)</option>
                  <option value="EARNED">Earned / Annual Leave (Paid)</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="OTHER">Other Leave</option>
                </select>

                <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Available Balance:</span>
                  <strong className="text-indigo-400 font-mono">
                    {availableForForm === 'Unlimited' ? 'Unlimited' : `${availableForForm} days`}
                  </strong>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Calculated Duration Preview */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
                <span>Calculated Duration:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{formDays} working day(s)</span>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide context for your manager / reviewer..."
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none resize-none"
                />
              </div>

              {/* Feedback messages */}
              {applyFeedback.message && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{applyFeedback.message}</span>
                </div>
              )}
              {applyFeedback.error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{applyFeedback.error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applySubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                >
                  {applySubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 9: LEAVE DETAILS & REVIEW MODAL */}
      {detailsModalOpen && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Leave Request Details
              </h3>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white p-1 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Employee Info Header */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-sm">
                    {selectedLeave.employee?.firstName} {selectedLeave.employee?.lastName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {selectedLeave.employee?.employeeCode} • {selectedLeave.employee?.designation}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                    selectedLeave.status
                  )}`}
                >
                  {selectedLeave.status}
                </span>
              </div>

              {/* Leave Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[11px]">Leave Type</span>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadge(
                      selectedLeave.leaveType
                    )}`}
                  >
                    {selectedLeave.leaveType}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Duration</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{selectedLeave.numberOfDays} Day(s)</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Start Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">{formatDateStr(selectedLeave.startDate)}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">End Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">{formatDateStr(selectedLeave.endDate)}</span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <span className="text-slate-500 block text-[11px] mb-1">Reason for Leave</span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {selectedLeave.reason}
                </div>
              </div>

              {/* Reviewer / Review details (if reviewed) */}
              {selectedLeave.reviewedBy && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Reviewed By:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedLeave.reviewedBy.firstName} {selectedLeave.reviewedBy.lastName}
                    </span>
                  </div>
                  {selectedLeave.reviewedAt && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Reviewed Date:</span>
                      <span>{formatDateStr(selectedLeave.reviewedAt)}</span>
                    </div>
                  )}
                  {selectedLeave.reviewerComment && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 text-[11px] block">Comment:</span>
                      <p className="mt-0.5 italic text-slate-700 dark:text-slate-300">{selectedLeave.reviewerComment}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviewer Action Area for Authorized Managers/Admin/HR */}
              {canReviewSelected() && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    Reviewer Comment (Required if rejecting):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide approval notes or reason for rejection..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none resize-none"
                  />

                  {/* Feedback inside review */}
                  {reviewFeedback.message && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{reviewFeedback.message}</span>
                    </div>
                  )}
                  {reviewFeedback.error && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{reviewFeedback.error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={reviewLoading}
                      onClick={() => handleReviewAction('REJECT')}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {reviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-4 h-4" />}
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={reviewLoading}
                      onClick={() => handleReviewAction('APPROVE')}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {reviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Close Button / Cancel Request button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                {(selectedLeave.status === 'PENDING' || selectedLeave.status === 'APPROVED') && (
                  <button
                    type="button"
                    onClick={() => handleCancelLeave(selectedLeave._id)}
                    className="text-xs text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Leave Request
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="ml-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
