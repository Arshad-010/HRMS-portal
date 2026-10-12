import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Users,
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Timer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const Attendance = () => {
  const { user } = useAuth();
  const isManagerOrAbove = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  // Active Tab: 'my' (Personal History) or 'team' (Workforce / Team Records)
  const [activeTab, setActiveTab] = useState('my');

  // Live Clock state
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Punch Card Self-Service state
  const [todayRecord, setTodayRecord] = useState(null);
  const [punchRemarks, setPunchRemarks] = useState('');
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState({ message: '', error: '' });

  // My Attendance History state
  const [myRecords, setMyRecords] = useState([]);
  const [myStats, setMyStats] = useState({
    presentDays: 0,
    halfDays: 0,
    onLeaveDays: 0,
    absentDays: 0,
    totalWorkHours: 0,
    avgWorkHours: 0,
  });
  const [myLoading, setMyLoading] = useState(true);

  // Workforce Attendance (Team/Org) state
  const [teamRecords, setTeamRecords] = useState([]);
  const [teamTotal, setTeamTotal] = useState(0);
  const [teamPage, setTeamPage] = useState(1);
  const [teamPages, setTeamPages] = useState(1);
  const [teamLimit] = useState(10);
  const [teamLoading, setTeamLoading] = useState(false);

  // Filters for Workforce Attendance
  const [filterDate, setFilterDate] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Org Summary Metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalEmployees: 0,
    present: 0,
    halfDay: 0,
    onLeave: 0,
    absent: 0,
    pendingCheckIn: 0,
    avgWorkHours: 0,
  });

  // Reference data
  const [departments, setDepartments] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  // Modal State for Manual Entry / Editing
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ message: '', error: '' });
  const [modalForm, setModalForm] = useState(() => ({
    employeeId: '',
    date: new Date().toISOString().slice(0, 10),
    checkInTime: '09:00',
    checkOutTime: '17:30',
    status: 'PRESENT',
    remarks: '',
  }));

  // Live Clock Interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Helper functions
  const formatTimeStr = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'HALF_DAY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ON_LEAVE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ABSENT':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'WEEKEND':
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
      case 'HOLIDAY':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
    }
  };

  // Fetch My Attendance & Status
  const fetchMyAttendance = async () => {
    setMyLoading(true);
    try {
      const response = await api.get('/attendance/my');
      const data = response.data.data;
      setMyRecords(data.records || []);
      setTodayRecord(data.todayRecord || null);
      if (data.stats) {
        setMyStats(data.stats);
      }
    } catch (err) {
      console.warn('Failed to load personal attendance:', err.message);
    } finally {
      setMyLoading(false);
    }
  };

  // Fetch Summary Metrics
  const fetchSummary = async () => {
    try {
      const response = await api.get('/attendance/summary');
      setSummaryMetrics(response.data.data || {});
    } catch (err) {
      console.warn('Failed to load attendance summary:', err.message);
    }
  };

  // Fetch Departments for filter
  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load departments:', err.message);
    }
  };

  // Fetch Active Employees for Manual Log Select
  const fetchEmployeesForSelect = async () => {
    if (!isManagerOrAbove) return;
    try {
      const res = await api.get('/employees?limit=100&status=ACTIVE');
      setEmployeeOptions(res.data.data.employees || []);
    } catch (err) {
      console.warn('Failed to load employees for select:', err.message);
    }
  };

  // Fetch Workforce Attendance List (Team/Org)
  const fetchTeamAttendance = async () => {
    if (!isManagerOrAbove) return;
    setTeamLoading(true);
    try {
      const params = new URLSearchParams({
        page: teamPage.toString(),
        limit: teamLimit.toString(),
      });

      if (filterDate) params.append('date', filterDate);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (filterDept) params.append('department', filterDept);
      if (filterStatus) params.append('status', filterStatus);

      const response = await api.get(`/attendance?${params.toString()}`);
      const data = response.data.data;
      let recordsList = data.records || data.attendance || [];

      // If client-side search filter is typed
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        recordsList = recordsList.filter((r) => {
          const emp = r.employee || {};
          const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
          const code = (emp.employeeCode || '').toLowerCase();
          const desig = (emp.designation || '').toLowerCase();
          return name.includes(q) || code.includes(q) || desig.includes(q);
        });
      }

      setTeamRecords(recordsList);
      setTeamTotal(data.total || 0);
      setTeamPages(data.pages || 1);
    } catch (err) {
      console.warn('Failed to load workforce attendance:', err.message);
    } finally {
      setTeamLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchMyAttendance();
    fetchSummary();
    fetchDepartments();
    if (isManagerOrAbove) {
      fetchEmployeesForSelect();
    }
  }, []);

  // Refetch Workforce on tab or filter change
  useEffect(() => {
    if (activeTab === 'team' && isManagerOrAbove) {
      fetchTeamAttendance();
    }
  }, [activeTab, teamPage, filterDate, filterStartDate, filterEndDate, filterDept, filterStatus]);

  // Self-Service Punch In
  const handleCheckIn = async () => {
    setPunchLoading(true);
    setPunchFeedback({ message: '', error: '' });
    try {
      await api.post('/attendance/check-in', {
        remarks: punchRemarks.trim(),
      });
      setPunchFeedback({ message: 'Check-in recorded successfully! Have a productive day.', error: '' });
      setPunchRemarks('');
      await fetchMyAttendance();
      await fetchSummary();
    } catch (err) {
      setPunchFeedback({ message: '', error: err.response?.data?.message || err.message || 'Check-in failed. Please try again.' });
    } finally {
      setPunchLoading(false);
    }
  };

  // Self-Service Punch Out
  const handleCheckOut = async () => {
    setPunchLoading(true);
    setPunchFeedback({ message: '', error: '' });
    try {
      const res = await api.post('/attendance/check-out', {
        remarks: punchRemarks.trim(),
      });
      setPunchFeedback({
        message: `Check-out recorded successfully! Shift logged (${res.data.data?.workHours || 0} hrs).`,
        error: '',
      });
      setPunchRemarks('');
      await fetchMyAttendance();
      await fetchSummary();
    } catch (err) {
      setPunchFeedback({ message: '', error: err.response?.data?.message || err.message || 'Check-out failed. Please try again.' });
    } finally {
      setPunchLoading(false);
    }
  };

  // Self-Service Start Break
  const handleStartBreak = async () => {
    setPunchLoading(true);
    setPunchFeedback({ message: '', error: '' });
    try {
      await api.post('/attendance/break/start');
      setPunchFeedback({ message: 'Break started successfully.', error: '' });
      await fetchMyAttendance();
    } catch (err) {
      setPunchFeedback({ message: '', error: err.response?.data?.message || err.message || 'Failed to start break.' });
    } finally {
      setPunchLoading(false);
    }
  };

  // Self-Service End Break
  const handleEndBreak = async () => {
    setPunchLoading(true);
    setPunchFeedback({ message: '', error: '' });
    try {
      await api.post('/attendance/break/end');
      setPunchFeedback({ message: 'Break ended successfully.', error: '' });
      await fetchMyAttendance();
    } catch (err) {
      setPunchFeedback({ message: '', error: err.response?.data?.message || err.message || 'Failed to end break.' });
    } finally {
      setPunchLoading(false);
    }
  };

  // Modal Handlers
  const openCreateModal = () => {
    setEditingRecord(null);
    setModalForm({
      employeeId: employeeOptions[0]?._id || '',
      date: new Date().toISOString().slice(0, 10),
      checkInTime: '09:00',
      checkOutTime: '17:30',
      status: 'PRESENT',
      remarks: '',
    });
    setModalFeedback({ message: '', error: '' });
    setModalOpen(true);
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    const dateFormatted = rec.date ? new Date(rec.date).toISOString().slice(0, 10) : '';

    let inTime = '';
    if (rec.checkIn) {
      const inDate = new Date(rec.checkIn);
      inTime = inDate.toTimeString().slice(0, 5);
    }

    let outTime = '';
    if (rec.checkOut) {
      const outDate = new Date(rec.checkOut);
      outTime = outDate.toTimeString().slice(0, 5);
    }

    setModalForm({
      employeeId: rec.employee?._id || '',
      date: dateFormatted,
      checkInTime: inTime,
      checkOutTime: outTime,
      status: rec.status || 'PRESENT',
      remarks: rec.remarks || '',
    });
    setModalFeedback({ message: '', error: '' });
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalFeedback({ message: '', error: '' });

    try {
      // Build ISO timestamps for checkIn and checkOut
      let checkInIso = null;
      let checkOutIso = null;

      if (modalForm.checkInTime) {
        checkInIso = new Date(`${modalForm.date}T${modalForm.checkInTime}:00`).toISOString();
      }
      if (modalForm.checkOutTime) {
        checkOutIso = new Date(`${modalForm.date}T${modalForm.checkOutTime}:00`).toISOString();
      }

      if (editingRecord) {
        await api.put(`/attendance/${editingRecord._id}`, {
          checkIn: checkInIso,
          checkOut: checkOutIso,
          status: modalForm.status,
          remarks: modalForm.remarks,
        });
        setModalFeedback({ message: 'Attendance record updated successfully!', error: '' });
      } else {
        await api.post('/attendance', {
          employeeId: modalForm.employeeId,
          date: modalForm.date,
          checkIn: checkInIso,
          checkOut: checkOutIso,
          status: modalForm.status,
          remarks: modalForm.remarks,
        });
        setModalFeedback({ message: 'Attendance record created successfully!', error: '' });
      }

      await fetchTeamAttendance();
      await fetchSummary();
      setTimeout(() => {
        setModalOpen(false);
      }, 900);
    } catch (err) {
      setModalFeedback({ message: '', error: err.message || 'Failed to save attendance record.' });
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id, empName, recDate) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to delete attendance record for ${empName} on ${formatDateStr(recDate)}?`)) {
      return;
    }
    try {
      await api.delete(`/attendance/${id}`);
      await fetchTeamAttendance();
      await fetchSummary();
    } catch (err) {
      alert(err.message || 'Failed to delete attendance record');
    }
  };

  // Calculate live elapsed time if checked in
  const calculateElapsed = () => {
    if (!todayRecord?.checkIn || todayRecord?.checkOut) return null;
    const diff = Math.max(0, currentTime.getTime() - new Date(todayRecord.checkIn).getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const isCheckedIn = Boolean(todayRecord?.checkIn);
  const isCheckedOut = Boolean(todayRecord?.checkOut);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-400" />
            Attendance Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time digital punch-clock, daily work-hour tracking, and enterprise workforce logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchMyAttendance();
              fetchSummary();
              if (activeTab === 'team') fetchTeamAttendance();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {isManagerOrAbove && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Grid: Real-time Punch Card + Organization Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Real-time Punch Clock (5 cols on lg) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-white dark:from-slate-900 via-slate-50 dark:via-slate-900 to-indigo-100 dark:to-indigo-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-400" />
                Live Punch Clock
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Big Live Digital Clock */}
            <div className="my-5 text-center">
              <div className="text-4xl sm:text-5xl font-mono font-extrabold text-slate-900 dark:text-white tracking-wider mb-3">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="mt-2 flex flex-col items-center justify-center gap-2">
                {todayRecord?.status === 'ON_BREAK' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    On Break
                  </span>
                ) : isCheckedIn && !isCheckedOut ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Checked In / Working
                  </span>
                ) : isCheckedIn && isCheckedOut ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Workday Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    Not Checked In
                  </span>
                )}
                
                {/* Contextual subtext for punch clock */}
                {isCheckedIn && !isCheckedOut && todayRecord?.status !== 'ON_BREAK' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Checked in at: {formatTimeStr(todayRecord?.checkIn)}</span>
                )}
                {todayRecord?.status === 'ON_BREAK' && todayRecord.breaks?.length > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Break started at: {formatTimeStr(todayRecord.breaks[todayRecord.breaks.length - 1].start)}</span>
                )}
              </div>
            </div>

            {/* Optional Remarks input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Optional remarks (e.g. Work from home, Client sync...)"
                value={punchRemarks}
                onChange={(e) => setPunchRemarks(e.target.value)}
                disabled={isCheckedIn && isCheckedOut}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            {!isCheckedIn || isCheckedOut ? (
              /* State A: Not Checked In OR State D: Workday Completed */
              <button
                onClick={handleCheckIn}
                disabled={isCheckedIn || punchLoading || !user?.employee}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md ${
                  isCheckedIn
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95 cursor-pointer'
                }`}
              >
                {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>Check In</span>
              </button>
            ) : (
              /* State B & C: Checked In or On Break */
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  {todayRecord?.status === 'ON_BREAK' ? (
                    <button
                      onClick={handleEndBreak}
                      disabled={punchLoading}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                    >
                      {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
                      <span>End Break</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStartBreak}
                      disabled={punchLoading || (todayRecord?.breaks && todayRecord.breaks.length > 0)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all shadow-md ${
                        (todayRecord?.breaks && todayRecord.breaks.length > 0)
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20 active:scale-95 cursor-pointer'
                      }`}
                      title={(todayRecord?.breaks && todayRecord.breaks.length > 0) ? "You have already taken a break today." : ""}
                    >
                      {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
                      <span>Start Break</span>
                    </button>
                  )}

                  <button
                    onClick={handleCheckOut}
                    disabled={punchLoading || todayRecord?.status === 'ON_BREAK'}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all shadow-md ${
                      todayRecord?.status === 'ON_BREAK'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    <span>Check Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Punch Notifications */}
            {punchFeedback.message && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{punchFeedback.message}</span>
              </div>
            )}
            {punchFeedback.error && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{punchFeedback.error}</span>
              </div>
            )}
            {!user?.employee && (
              <p className="text-[11px] text-amber-400 mt-2 text-center">
                ⚠️ Account has no employee profile linked. Check-in is available for active employees only.
              </p>
            )}
          </div>
        </div>

        {/* Today's Work Summary (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Today's Work Summary
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Status: <strong className="text-slate-900 dark:text-white">{todayRecord?.status || 'Not Checked In'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Check-in</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {todayRecord?.checkIn ? formatTimeStr(todayRecord.checkIn) : 'Not yet'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Check-out</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {todayRecord?.checkOut ? formatTimeStr(todayRecord.checkOut) : 'Not yet'}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Break</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {todayRecord?.breaks && todayRecord.breaks.length > 0 ? (
                  <>
                    {formatTimeStr(todayRecord.breaks[0].start)} – {todayRecord.breaks[0].end ? formatTimeStr(todayRecord.breaks[0].end) : 'Now'}
                  </>
                ) : 'None'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Break Duration</span>
              <span className="text-lg font-bold text-amber-500">
                {todayRecord?.totalBreakDuration || 0} min / 60 min
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Work Duration</span>
              <span className="text-lg font-bold text-indigo-500">
                {todayRecord?.workHours ? `${todayRecord.workHours}h` : calculateElapsed() || '0h 0m 0s'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {todayRecord?.status === 'ON_BREAK' ? 'On Break' : (isCheckedIn && !isCheckedOut) ? 'Working' : isCheckedOut ? 'Completed' : 'Not Started'}
              </span>
            </div>
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
          <span>My Attendance History</span>
        </button>

        {isManagerOrAbove && (
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Workforce & Team Records</span>
          </button>
        )}
      </div>

      {/* TAB 1: MY ATTENDANCE HISTORY */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          {/* Personal Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Present Days</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{myStats.presentDays || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Half Days</span>
              <p className="text-xl font-bold text-amber-400 mt-1">{myStats.halfDays || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">On Leave</span>
              <p className="text-xl font-bold text-blue-400 mt-1">{myStats.onLeaveDays || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Absences</span>
              <p className="text-xl font-bold text-rose-400 mt-1">{myStats.absentDays || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Hours</span>
              <p className="text-xl font-bold text-indigo-400 mt-1">{myStats.totalWorkHours || 0}h</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Avg Daily Hours</span>
              <p className="text-xl font-bold text-violet-400 mt-1">{myStats.avgWorkHours || 0}h</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Personal Attendance Log (Last 60 Days)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{myRecords.length} records logged</span>
            </div>

            {myLoading ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading personal logs...</span>
              </div>
            ) : myRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <Clock className="w-8 h-8 mx-auto text-slate-600 dark:text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No attendance records found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use the Check-In button above to log today's attendance.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Check-In</th>
                      <th className="py-3.5 px-4">Check-Out</th>
                      <th className="py-3.5 px-4">Work Hours</th>
                      <th className="py-3.5 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {myRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{formatDateStr(rec.date)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              rec.status
                            )}`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{formatTimeStr(rec.checkIn)}</td>
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{formatTimeStr(rec.checkOut)}</td>
                        <td className="py-3 px-4">
                          {rec.workHours !== undefined && rec.workHours !== null ? (
                            <span className="font-mono font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {rec.workHours} hrs
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">--</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{rec.remarks || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WORKFORCE & TEAM ATTENDANCE (For Admin, HR, Manager) */}
      {activeTab === 'team' && isManagerOrAbove && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Employee */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, code..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none"
                />
              </div>

              {/* Single Date Picker */}
              <div>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setTeamPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={filterDept}
                  onChange={(e) => {
                    setFilterDept(e.target.value);
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

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setTeamPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="PRESENT">PRESENT</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="WEEKEND">WEEKEND</option>
                  <option value="HOLIDAY">HOLIDAY</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFilterDate('');
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterDept('');
                    setFilterStatus('');
                    setFilterSearch('');
                    setTeamPage(1);
                  }}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer text-center"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Optional Date Range secondary row */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5" /> Date Range Filter:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={filterStartDate}
                  onChange={(e) => {
                    setFilterStartDate(e.target.value);
                    setFilterDate('');
                    setTeamPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
                <span className="text-slate-500 dark:text-slate-400">to</span>
                <input
                  type="date"
                  placeholder="End Date"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value);
                    setFilterDate('');
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
                <span className="text-xs">Loading workforce attendance records...</span>
              </div>
            ) : teamRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-600 dark:text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No attendance entries found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or log a record manually.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Check-In</th>
                      <th className="py-3.5 px-4">Check-Out</th>
                      <th className="py-3.5 px-4">Hours</th>
                      <th className="py-3.5 px-4">Remarks</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {teamRecords.map((rec) => {
                      const emp = rec.employee || {};
                      const fullName = emp.firstName ? `${emp.firstName} ${emp.lastName}` : 'Unknown';

                      return (
                        <tr key={rec._id} className="hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                          {/* Employee Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">
                                {emp.firstName ? emp.firstName[0] : 'E'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white block">{fullName}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {emp.employeeCode || 'N/A'} • {emp.designation || 'Staff'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-4">
                            <span className="text-slate-700 dark:text-slate-300">
                              {emp.departmentId?.name ? emp.departmentId.name : 'Unassigned'}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{formatDateStr(rec.date)}</td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                                rec.status
                              )}`}
                            >
                              {rec.status}
                            </span>
                          </td>

                          {/* Check-In */}
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{formatTimeStr(rec.checkIn)}</td>

                          {/* Check-Out */}
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{formatTimeStr(rec.checkOut)}</td>

                          {/* Work Hours */}
                          <td className="py-3 px-4 font-mono font-semibold text-indigo-300">
                            {rec.workHours !== undefined && rec.workHours !== null ? `${rec.workHours}h` : '--'}
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{rec.remarks || '--'}</td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(rec)}
                                title="Edit Record"
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteRecord(rec._id, fullName, rec.date)}
                                  title="Delete Record"
                                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {teamPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing page <strong className="text-slate-900 dark:text-white">{teamPage}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{teamPages}</strong> ({teamTotal} total records)
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

      {/* MANUAL RECORD MODAL (Create & Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                {editingRecord ? 'Modify Attendance Record' : 'Log Manual Attendance Record'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white p-1 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4 text-xs">
              {/* Employee Selection */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Target Employee *</label>
                <select
                  required
                  disabled={Boolean(editingRecord)}
                  value={modalForm.employeeId}
                  onChange={(e) => setModalForm({ ...modalForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none disabled:opacity-60"
                >
                  <option value="">Select Employee</option>
                  {employeeOptions.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.firstName} {e.lastName} ({e.employeeCode}) — {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    required
                    disabled={Boolean(editingRecord)}
                    value={modalForm.date}
                    onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Status *</label>
                  <select
                    required
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="WEEKEND">WEEKEND</option>
                    <option value="HOLIDAY">HOLIDAY</option>
                  </select>
                </div>
              </div>

              {/* Check-In & Check-Out Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Check-In Time</label>
                  <input
                    type="time"
                    value={modalForm.checkInTime}
                    onChange={(e) => setModalForm({ ...modalForm, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    value={modalForm.checkOutTime}
                    onChange={(e) => setModalForm({ ...modalForm, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks / Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Regular punch adjusted by Manager, Field duty, Approved overtime..."
                  value={modalForm.remarks}
                  onChange={(e) => setModalForm({ ...modalForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none resize-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px]">
                ℹ️ <strong>Server-side Calculation:</strong> Total work hours and status will be computed automatically
                from check-in and check-out timestamps.
              </div>

              {/* Feedback messages */}
              {modalFeedback.message && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalFeedback.message}</span>
                </div>
              )}
              {modalFeedback.error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalFeedback.error}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                >
                  {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingRecord ? 'Save Changes' : 'Create Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
