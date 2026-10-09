import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
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
} from 'lucide-react';

export const TeamManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentId: '',
    teamLeadId: '',
    members: [],
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', error: '' });

  const fetchTeams = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/teams');
      setTeams(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees?limit=500'),
        api.get('/departments')
      ]);
      setEmployees(empRes.data.data.employees || []);
      setDepartments(deptRes.data.data || []);
    } catch (err) {
      console.warn('Could not fetch dependencies:', err.message);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchDependencies();
  }, []);

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
      departmentId: '',
      teamLeadId: '',
      members: [],
      isActive: true,
    });
    setFeedback({ message: '', error: '' });
    setModalOpen(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      departmentId: team.departmentId?._id || team.departmentId || '',
      teamLeadId: team.teamLeadId?._id || team.teamLeadId || '',
      members: team.members?.map(m => m._id || m) || [],
      isActive: team.isActive,
    });
    setFeedback({ message: '', error: '' });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ message: '', error: '' });

    try {
      if (editingTeam) {
        await api.put(`/teams/${editingTeam._id}`, formData);
        // Also update members
        await api.put(`/teams/${editingTeam._id}/members`, { members: formData.members });
        setFeedback({ message: 'Team updated successfully!', error: '' });
      } else {
        await api.post('/teams', formData);
        setFeedback({ message: 'Team created successfully!', error: '' });
      }

      await fetchTeams();
      setTimeout(() => {
        setModalOpen(false);
      }, 1000);
    } catch (err) {
      setFeedback({ message: '', error: err.response?.data?.message || err.message || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMemberToggle = (empId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(empId)
        ? prev.members.filter(id => id !== empId)
        : [...prev.members, empId]
    }));
  };

  // Filter locally
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
    if (filterActive === 'active') return matchesSearch && team.isActive;
    if (filterActive === 'inactive') return matchesSearch && !team.isActive;
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-sky-400" />
            Team Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Construct cross-functional project teams and appoint Team Leads
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Team</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 my-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search teams by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 hidden sm:block" />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading teams...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <Sparkles className="w-10 h-10 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No teams found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria' : 'Create your first team to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => (
            <div
              key={team._id}
              className={`rounded-2xl border p-5 bg-white dark:bg-slate-900 backdrop-blur-sm transition-all hover:border-slate-300 dark:border-slate-700 ${
                team.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-rose-950/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 mb-1">{team.name}</h3>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    team.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {team.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {team.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] mb-3">
                {team.description || 'No description provided.'}
              </p>
              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    Members:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {team.members?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Team Lead:</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400 truncate max-w-[150px]">
                    {team.teamLeadId
                      ? `${team.teamLeadId.firstName} ${team.teamLeadId.lastName}`
                      : 'Unassigned'}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(team)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                  title="Edit Team"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </h3>
            
            {feedback.message && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {feedback.message}
              </div>
            )}
            {feedback.error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {feedback.error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Marketing Push"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Department (Optional)</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="">Cross-Functional / None</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Team purpose and goals..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Team Lead *</label>
                <select
                  required
                  value={formData.teamLeadId}
                  onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">Select Team Lead...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">Team Members ({formData.members.length})</label>
                <div className="h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950 space-y-1">
                  {employees.map((emp) => (
                    <div key={emp._id} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      <input
                        type="checkbox"
                        id={`emp-${emp._id}`}
                        checked={formData.members.includes(emp._id)}
                        onChange={() => handleMemberToggle(emp._id)}
                        className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                      />
                      <label htmlFor={`emp-${emp._id}`} className="flex-1 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{emp.firstName} {emp.lastName}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-2">({emp.designation})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {editingTeam && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-sky-500"
                  />
                  <label htmlFor="isActive" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                    Team is active
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
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
