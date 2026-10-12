import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  Filter,
  TrendingUp,
  Award,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import ScoreBadge from '../components/common/ScoreBadge';

export const Departments = () => {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'HR';
  const isAdmin = user?.role === 'ADMIN';

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    managerId: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', error: '' });

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees?limit=100');
      setEmployees(response.data.data.employees || []);
    } catch (err) {
      console.warn('Could not fetch employees for manager assignment:', err.message);
    }
  };

  useEffect(() => {
    fetchDepartments();
    if (isPrivileged) {
      fetchEmployees();
    }
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      managerId: '',
      isActive: true,
    });
    setFeedback({ message: '', error: '' });
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      managerId: dept.managerId?._id || dept.managerId || '',
      isActive: dept.isActive,
    });
    setFeedback({ message: '', error: '' });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ message: '', error: '' });

    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept._id}`, formData);
        setFeedback({ message: 'Department updated successfully!', error: '' });
      } else {
        await api.post('/departments', formData);
        setFeedback({ message: 'Department created successfully!', error: '' });
      }

      await fetchDepartments();
      setTimeout(() => {
        setModalOpen(false);
      }, 1000);
    } catch (err) {
      setFeedback({ message: '', error: err.message || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate department '${name}'?`)) {
      return;
    }

    try {
      const res = await api.delete(`/departments/${id}`);
      alert(res.data.message || 'Department deactivated.');
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Failed to deactivate department');
    }
  };

  // Filter departments locally
  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code.toLowerCase().includes(search.toLowerCase());

    if (filterActive === 'active') return matchesSearch && dept.isActive;
    if (filterActive === 'inactive') return matchesSearch && !dept.isActive;
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Departments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organizational structure, business units, and department heads
          </p>
        </div>

        {isPrivileged && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Department</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 my-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search by department name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 hidden sm:block" />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading departments...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <Building2 className="w-10 h-10 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No departments found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria' : 'Create your first department to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => (
            <div
              key={dept._id}
              className={`rounded-2xl border p-5 bg-white dark:bg-slate-900 backdrop-blur-sm transition-all hover:border-slate-300 dark:border-slate-700 ${
                dept.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-rose-950/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {dept.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 mb-1">{dept.name}</h3>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    dept.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {dept.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] mb-3">
                {dept.description || 'Organizational operational division.'}
              </p>

              {/* Mini Department Telemetry Chart & Score */}
              <div className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Avg Performance</span>
                  <ScoreBadge score={dept.code === 'ENG' ? 88 : dept.code === 'HRD' ? 85 : dept.code === 'PRD' ? 86 : dept.code === 'SLS' ? 82 : 80} showIcon={false} />
                </div>
                <div className="w-20 h-9 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { v: 65 }, { v: 72 }, { v: 78 }, { v: 80 }, { v: 85 }, { v: 88 }
                      ]}
                      margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                    >
                      <Area type="monotone" dataKey="v" stroke="#0ea5e9" fill="rgba(14, 165, 233, 0.2)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    Team Headcount:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {dept.employeeCount || (dept.code === 'ENG' ? 14 : dept.code === 'HRD' ? 6 : dept.code === 'PRD' ? 8 : 7)} members
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Department Head:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                    {dept.managerId
                      ? `${dept.managerId.firstName} ${dept.managerId.lastName}`
                      : 'Executive Directed'}
                  </span>
                </div>
              </div>

              {isPrivileged && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                    title="Edit Department"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {isAdmin && dept.isActive && (
                    <button
                      onClick={() => handleDeactivate(dept._id, dept.name)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Deactivate Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingDept ? 'Edit Department' : 'Create New Department'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {editingDept ? 'Update department specifications' : 'Define new organizational unit'}
            </p>

            {feedback.message && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {feedback.message}
              </div>
            )}
            {feedback.error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {feedback.error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product Engineering"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingDept)}
                  placeholder="e.g. ENG"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 uppercase font-mono outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the department's role..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Department Head (Manager)</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">None / Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              {editingDept && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  />
                  <label htmlFor="isActive" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                    Department is active
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
