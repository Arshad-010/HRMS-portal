import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserPlus, Search, Filter, Eye, Edit2, Trash2,
  ChevronLeft, ChevronRight, Building2, Briefcase, Shield,
  AlertCircle, X, CheckCircle2, LayoutGrid, Table, Download,
  FileSpreadsheet, UserCheck, UserX, MoreVertical, ArrowUpDown,
  Mail, Phone, Calendar
} from 'lucide-react';
import PersonDrawer from '../components/people/PersonDrawer';
import CsvImportModal from '../components/people/CsvImportModal';
import EmptyState from '../components/common/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';

export const Employees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'HR';
  const isAdmin = user?.role === 'ADMIN';

  // Navigation redirect if pure employee
  useEffect(() => {
    if (user?.role === 'EMPLOYEE' && user?.employeeId) {
      navigate(`/employees/${user.employeeId}`, { replace: true });
    }
  }, [user, navigate]);

  // Tab State: ALL | EMPLOYEE | MANAGER | HR
  const [activeTab, setActiveTab] = useState('ALL');

  // View state: 'table' | 'grid'
  const [viewMode, setViewMode] = useState('table');

  // Telemetry & List State
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ message: '', error: '' });

  // Filters
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & Drawers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRole, setDrawerRole] = useState('EMPLOYEE');
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Bulk actions selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Check URL query for trigger (e.g. ?action=add&role=HR)
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      const targetRole = searchParams.get('role') || 'EMPLOYEE';
      setDrawerRole(targetRole);
      setDrawerOpen(true);
      searchParams.delete('action');
      searchParams.delete('role');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  // Load Departments
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data?.success) setDepartments(res.data.data || []);
      } catch (err) {
        console.warn('Depts fetch error:', err.message);
      }
    };
    fetchDepts();
  }, []);

  // Fetch Employees with filters
  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedDept) params.append('department', selectedDept);
      if (selectedStatus) params.append('status', selectedStatus);
      if (activeTab !== 'ALL') params.append('role', activeTab);

      const res = await api.get(`/employees?${params.toString()}`);
      if (res.data?.success) {
        setEmployees(res.data.data.employees || []);
        setTotal(res.data.data.total || 0);
        setPages(res.data.data.pages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, activeTab, selectedDept, selectedStatus]);

  // Search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map(e => e._id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Delete / Deactivate action
  const handleConfirmDeactivate = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/employees/${deleteTarget._id}`);
      if (res.data?.success) {
        setFeedback({ message: 'Personnel deactivated successfully.', error: '' });
        setDeleteTarget(null);
        fetchEmployees();
        setTimeout(() => setFeedback({ message: '', error: '' }), 3000);
      }
    } catch (err) {
      setFeedback({ message: '', error: err.response?.data?.message || err.message });
      setTimeout(() => setFeedback({ message: '', error: '' }), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Header & Actions Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Workforce Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            People &amp; Talent Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {total} personnel provisioned across organizational departments.
          </p>
        </div>

        {isPrivileged && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setCsvModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => {
                setDrawerRole(activeTab !== 'ALL' ? activeTab : 'EMPLOYEE');
                setDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Person</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications / Alerts */}
      {feedback.message && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback.message}</span>
        </div>
      )}
      {feedback.error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{feedback.error}</span>
        </div>
      )}

      {/* 2. Tabs Row: All | Employees | Managers | HR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          {[
            { key: 'ALL', label: 'All Personnel' },
            { key: 'EMPLOYEE', label: 'Employees' },
            { key: 'MANAGER', label: 'Managers' },
            { key: 'HR', label: 'HR Team' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle: Table vs Cards */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-xs' : 'text-slate-400'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-xs' : 'text-slate-400'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee code, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="PROBATION">Probation</option>
            <option value="RESIGNED">Resigned</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          {(search || selectedDept || selectedStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedDept('');
                setSelectedStatus('');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 4. Bulk Actions Bar (if rows selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 px-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-300">
          <span>{selectedIds.length} personnel selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900 text-xs font-semibold cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Directory View (Table or Grid) */}
      {loading ? (
        <SkeletonLoader type="table" count={8} />
      ) : employees.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <EmptyState
            title="No personnel found"
            description="No employee records match your selected role tab or search filters."
            actionText="+ Add New Person"
            onAction={() => setDrawerOpen(true)}
          />
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === employees.length && employees.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {employees.map((emp) => {
                  const empRole = emp.userId?.role || 'EMPLOYEE';
                  const isSelected = selectedIds.includes(emp._id);
                  return (
                    <tr key={emp._id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                      <td className="p-3.5 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(emp._id)}
                          className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5">
                        <Link to={`/employees/${emp._id}`} className="flex items-center gap-3 group no-underline">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors truncate">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{emp.designation}</div>
                          </div>
                        </Link>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {emp.employeeCode}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          empRole === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : empRole === 'HR'
                            ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
                            : empRole === 'MANAGER'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {empRole}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {emp.departmentId?.name || 'General'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : emp.status === 'ON_LEAVE'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : emp.status === 'PROBATION'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {emp.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/employees/${emp._id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {isAdmin && (
                            <button
                              onClick={() => setDeleteTarget(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Deactivate"
                            >
                              <UserX className="w-4 h-4" />
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
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => {
            const empRole = emp.userId?.role || 'EMPLOYEE';
            return (
              <div
                key={emp._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      empRole === 'ADMIN'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        : empRole === 'HR'
                        ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
                        : empRole === 'MANAGER'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                      {empRole}
                    </span>
                  </div>

                  <Link to={`/employees/${emp._id}`} className="no-underline group">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors m-0 truncate">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 m-0 truncate mt-0.5">{emp.designation}</p>
                  </Link>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.departmentId?.name || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{emp.employeeCode}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    emp.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {emp.status}
                  </span>

                  <Link
                    to={`/employees/${emp._id}`}
                    className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1 no-underline"
                  >
                    <span>Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Footer */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Page {page} of {pages} ({total} total personnel)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(prev => Math.min(pages, prev + 1))}
              disabled={page === pages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Deactivate Personnel?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to deactivate {deleteTarget.firstName} {deleteTarget.lastName} ({deleteTarget.employeeCode})? Their access login will be suspended.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeactivate}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Person Drawer */}
      <PersonDrawer
        isOpen={drawerOpen}
        initialRole={drawerRole}
        onClose={() => setDrawerOpen(false)}
        onSuccess={(data, emailSent, emailError) => {
          let msg = 'Personnel successfully provisioned!';
          if (emailSent) msg += ' Activation email sent.';
          if (emailError) msg += ' However, activation email failed to send.';
          setFeedback({ message: msg, error: emailError ? emailError : '' });
          fetchEmployees();
          setTimeout(() => setFeedback({ message: '', error: '' }), 5000);
        }}
      />

      {/* CSV Bulk Import Modal */}
      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={() => {
          fetchEmployees();
        }}
      />
    </div>
  );
};

export default Employees;
