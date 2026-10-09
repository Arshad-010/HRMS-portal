import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  X,
  Eye,
  Briefcase,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const Tasks = () => {
  const { user } = useAuth();
  const isManagerOrAbove = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';
  const isAdminOrHr = user?.role === 'ADMIN' || user?.role === 'HR';

  // Active Tab: 'my' (My Assigned Tasks) or 'all' (Workforce / Team Tasks for Managers/HR/Admin)
  const [activeTab, setActiveTab] = useState(isManagerOrAbove ? 'all' : 'my');

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);

  // Summary Metrics State
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
  });

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);

  // Reference data
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [deptEmployees, setDeptEmployees] = useState([]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createFeedback, setCreateFeedback] = useState({ message: '', error: '' });
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    department: '',
    teamId: '',
    assignedTo: '',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHours: 0,
  });

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState({ message: '', error: '' });
  const [editForm, setEditForm] = useState({
    _id: '',
    title: '',
    description: '',
    department: '',
    teamId: '',
    assignedTo: '',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHours: 0,
  });

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState({ message: '', error: '' });
  const [assignForm, setAssignForm] = useState({
    taskId: '',
    department: '',
    assignedTo: '',
  });

  // Fetch departments & initial reference data
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [deptRes, teamRes] = await Promise.all([
          api.get('/departments').catch(() => null),
          api.get('/teams').catch(() => null) // Or /teams if they have access
        ]);
        if (deptRes?.data?.data) {
          setDepartments(deptRes.data.data.filter((d) => d.isActive));
        }
        if (teamRes?.data?.data) {
          setTeams(teamRes.data.data.filter((t) => t.isActive));
        }
      } catch (err) {
        console.error('Failed to load dependencies', err);
      }
    };

    fetchDependencies();
  }, []);

  // Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = activeTab === 'my' ? '/tasks/my' : '/tasks';
      const params = {
        page,
        limit,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterPriority ? { priority: filterPriority } : {}),
        ...(filterDept && activeTab === 'all' ? { department: filterDept } : {}),
        ...(filterOverdue ? { overdue: 'true' } : {}),
      };

      const res = await api.get(endpoint, { params });
      if (res.data?.data) {
        setTasks(res.data.data.tasks || []);
        setTotal(res.data.data.total || 0);
        setPages(res.data.data.pages || 1);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab, page, filterStatus, filterPriority, filterDept, filterOverdue]);

  // Handle department change in Create modal
  const handleCreateDeptChange = async (deptId) => {
    setCreateForm((prev) => ({ ...prev, department: deptId, assignedTo: '' }));
    if (!deptId && !createForm.teamId) {
      setDeptEmployees([]);
      return;
    }
    fetchEmployeesForSelect(deptId, createForm.teamId);
  };
  
  const handleCreateTeamChange = async (teamId) => {
    setCreateForm((prev) => ({ ...prev, teamId: teamId, assignedTo: '' }));
    if (!createForm.department && !teamId) {
      setDeptEmployees([]);
      return;
    }
    fetchEmployeesForSelect(createForm.department, teamId);
  };

  const fetchEmployeesForSelect = async (deptId, teamId) => {
    try {
      // If teamId, we can just get team members from the team obj
      if (teamId) {
        const team = teams.find(t => t._id === teamId);
        if (team && team.members) {
           const memberIds = team.members.map(m => m._id || m).join(',');
           const res = await api.get(`/employees?ids=${memberIds}&status=ACTIVE&limit=100`);
           if (res.data?.data?.employees) {
             setDeptEmployees(res.data.data.employees);
           }
           return;
        }
      }
      
      if (deptId) {
        const res = await api.get(`/employees?departmentId=${deptId}&status=ACTIVE&limit=100`);
        if (res.data?.data?.employees) {
          setDeptEmployees(res.data.data.employees);
        }
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  // Handle department change in Edit modal
  const handleEditDeptChange = async (deptId) => {
    setEditForm((prev) => ({ ...prev, department: deptId, assignedTo: '' }));
    if (!deptId) {
      setDeptEmployees([]);
      return;
    }

    try {
      const res = await api.get(`/employees?departmentId=${deptId}&status=ACTIVE&limit=100`);
      if (res.data?.data?.employees) {
        setDeptEmployees(res.data.data.employees);
      }
    } catch (err) {
      console.error('Failed to fetch department employees', err);
    }
  };

  // Handle department change in Reassign modal
  const handleAssignDeptChange = async (deptId) => {
    setAssignForm((prev) => ({ ...prev, department: deptId, assignedTo: '' }));
    if (!deptId) {
      setDeptEmployees([]);
      return;
    }

    try {
      const res = await api.get(`/employees?departmentId=${deptId}&status=ACTIVE&limit=100`);
      if (res.data?.data?.employees) {
        setDeptEmployees(res.data.data.employees);
      }
    } catch (err) {
      console.error('Failed to fetch department employees', err);
    }
  };

  // Create Task Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateFeedback({ message: '', error: '' });

    if (!createForm.title.trim()) {
      setCreateFeedback({ message: '', error: 'Task title is required' });
      setCreateSubmitting(false);
      return;
    }
    if (!createForm.department) {
      setCreateFeedback({ message: '', error: 'Please select a department' });
      setCreateSubmitting(false);
      return;
    }
    if (!createForm.assignedTo) {
      setCreateFeedback({ message: '', error: 'Please select an assigned employee' });
      setCreateSubmitting(false);
      return;
    }
    if (!createForm.dueDate) {
      setCreateFeedback({ message: '', error: 'Due date is required' });
      setCreateSubmitting(false);
      return;
    }

    try {
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        department: createForm.department,
        teamId: createForm.teamId || undefined,
        assignedTo: createForm.assignedTo,
        priority: createForm.priority,
        dueDate: createForm.dueDate,
        estimatedHours: Number(createForm.estimatedHours) || 0,
      };

      const res = await api.post('/tasks', payload);
      setCreateFeedback({ message: res.data.message || 'Task created successfully', error: '' });
      setTimeout(() => {
        setCreateModalOpen(false);
        setCreateForm({
          title: '',
          description: '',
          department: '',
          teamId: '',
          assignedTo: '',
          priority: 'MEDIUM',
          dueDate: '',
          estimatedHours: 0,
        });
        setCreateFeedback({ message: '', error: '' });
        fetchTasks();
      }, 1000);
    } catch (err) {
      setCreateFeedback({ message: '', error: err.response?.data?.message || 'Failed to create task' });
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Edit Task Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditFeedback({ message: '', error: '' });

    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        department: editForm.department,
        assignedTo: editForm.assignedTo,
        priority: editForm.priority,
        dueDate: editForm.dueDate,
        estimatedHours: Number(editForm.estimatedHours) || 0,
      };

      const res = await api.put(`/tasks/${editForm._id}`, payload);
      setEditFeedback({ message: res.data.message || 'Task updated successfully', error: '' });
      setTimeout(() => {
        setEditModalOpen(false);
        setEditFeedback({ message: '', error: '' });
        fetchTasks();
      }, 1000);
    } catch (err) {
      setEditFeedback({ message: '', error: err.response?.data?.message || 'Failed to update task' });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Reassign Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignSubmitting(true);
    setAssignFeedback({ message: '', error: '' });

    try {
      const res = await api.patch(`/tasks/${assignForm.taskId}/assign`, {
        department: assignForm.department,
        assignedTo: assignForm.assignedTo,
      });
      setAssignFeedback({ message: res.data.message || 'Task reassigned successfully', error: '' });
      setTimeout(() => {
        setAssignModalOpen(false);
        setAssignFeedback({ message: '', error: '' });
        fetchTasks();
      }, 1000);
    } catch (err) {
      setAssignFeedback({ message: '', error: err.response?.data?.message || 'Failed to reassign task' });
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Quick Status Transition
  const handleStatusChange = async (taskId, newStatus) => {
    let submissionNote = '';
    if (newStatus === 'REVIEW') {
      submissionNote = window.prompt('Please provide a submission note or PR link for review:');
      if (submissionNote === null) return; // User cancelled
    }
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus, submissionNote });
      fetchTasks();
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask((prev) => ({
          ...prev,
          status: newStatus,
          submissionNote: submissionNote || prev.submissionNote,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null,
          isOverdue: newStatus === 'COMPLETED' || newStatus === 'CANCELLED' ? false : prev.isOverdue,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete task: "${title}"?`)) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Open Edit Modal with prefilled data
  const openEditModal = async (task) => {
    const deptId = task.department?._id || task.department;
    setEditForm({
      _id: task._id,
      title: task.title,
      description: task.description || '',
      department: deptId,
      assignedTo: task.assignedTo?._id || task.assignedTo,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task.estimatedHours || 0,
    });
    setEditFeedback({ message: '', error: '' });

    if (deptId) {
      try {
        const res = await api.get(`/employees?departmentId=${deptId}&status=ACTIVE&limit=100`);
        if (res.data?.data?.employees) {
          setDeptEmployees(res.data.data.employees);
        }
      } catch (err) {
        console.error('Failed to load dept employees', err);
      }
    }
    setEditModalOpen(true);
  };

  // Open Reassign Modal
  const openAssignModal = async (task) => {
    const deptId = task.department?._id || task.department;
    setAssignForm({
      taskId: task._id,
      department: deptId,
      assignedTo: task.assignedTo?._id || task.assignedTo,
    });
    setAssignFeedback({ message: '', error: '' });

    if (deptId) {
      try {
        const res = await api.get(`/employees?departmentId=${deptId}&status=ACTIVE&limit=100`);
        if (res.data?.data?.employees) {
          setDeptEmployees(res.data.data.employees);
        }
      } catch (err) {
        console.error('Failed to load dept employees', err);
      }
    }
    setAssignModalOpen(true);
  };

  // Format Date helper
  const formatDateStr = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Priority Style helper
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'LOW':
      default:
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30';
    }
  };

  // Status Style helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'TODO':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'IN_PROGRESS':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'REVIEW':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            Task Management &amp; Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize assignments, prioritize milestones, and monitor workflow lifecycles across teams
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isManagerOrAbove && (
            <button
              onClick={() => {
                setCreateFeedback({ message: '', error: '' });
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Tasks</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{stats.total}</p>
          <span className="text-[10px] text-slate-500">In current scope</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">To Do</span>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1.5">{stats.todo}</p>
          <span className="text-[10px] text-slate-500">Awaiting start</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">In Progress</span>
          <p className="text-2xl font-bold text-sky-400 mt-1.5">{stats.inProgress}</p>
          <span className="text-[10px] text-slate-500">Active execution</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">In Review</span>
          <p className="text-2xl font-bold text-purple-400 mt-1.5">{stats.review}</p>
          <span className="text-[10px] text-slate-500">Pending review</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Completed</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5">{stats.completed}</p>
          <span className="text-[10px] text-slate-500">Successfully closed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue
          </span>
          <p className="text-2xl font-bold text-rose-400 mt-1.5">{stats.overdue}</p>
          <span className="text-[10px] text-rose-300/70">Past due date</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl backdrop-blur-sm overflow-hidden">
        {/* Navigation Tabs (if privileged user) */}
        {isManagerOrAbove && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => {
                setActiveTab('all');
                setPage(1);
              }}
              className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Team &amp; Workforce Tasks</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {activeTab === 'all' ? total : ''}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('my');
                setPage(1);
              }}
              className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'my'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Assigned Tasks</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {activeTab === 'my' ? total : ''}
              </span>
            </button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search title, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTasks()}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Department Filter (Only for Team tab) */}
            {activeTab === 'all' && (
              <select
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            )}

            {/* Overdue Only Filter Toggle */}
            <button
              onClick={() => {
                setFilterOverdue((prev) => !prev);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                filterOverdue
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-800 dark:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Overdue Only</span>
            </button>
          </div>
        </div>

        {/* Task List / Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
              <p className="text-xs">Loading tasks and metrics...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 text-xs">
              <p>{error}</p>
              <button
                onClick={fetchTasks}
                className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs">
              <CheckSquare className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="font-semibold text-slate-500 dark:text-slate-400">No tasks found</p>
              <p className="mt-1 text-slate-500">
                {search || filterStatus || filterPriority || filterDept || filterOverdue
                  ? 'No tasks match your selected filter criteria'
                  : 'All caught up! No tasks currently assigned.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Task Details</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {tasks.map((task) => {
                  const isAssignedToMe = task.assignedTo?._id?.toString() === user?.employee?._id?.toString();
                  const canEdit = isManagerOrAbove;

                  return (
                    <tr
                      key={task._id}
                      className="hover:bg-slate-100 dark:bg-slate-800 transition-colors group"
                    >
                      {/* Title & Department */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setDetailsModalOpen(true);
                            }}
                            className="font-semibold text-slate-900 dark:text-white hover:text-indigo-400 text-left line-clamp-1 cursor-pointer transition-colors"
                          >
                            {task.title}
                          </button>
                          {task.isOverdue && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{task.department?.name || 'Department'}</span>
                          {task.estimatedHours > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {task.estimatedHours}h est.
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                            {task.assignedTo?.firstName ? task.assignedTo.firstName[0] : 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200 m-0">
                              {task.assignedTo
                                ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                : 'Unassigned'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono m-0">
                              {task.assignedTo?.employeeCode || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs ${
                            task.isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatDateStr(task.dueDate)}
                        </span>
                      </td>

                      {/* Status & Quick Transition */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>

                          {/* Quick advance status dropdown for assignee or manager */}
                          {(isAssignedToMe || isManagerOrAbove) && (
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task._id, e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                              title="Update status"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="REVIEW">Review</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setDetailsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-sky-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openAssignModal(task)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-purple-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Reassign Task"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteTask(task._id, task.title)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {tasks.length} of {total} tasks (Page {page} of {pages})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-700 dark:text-slate-300 px-2">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, pages))}
                disabled={page >= pages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Create New Task
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Assign action items, set target due dates, and track completion progress
            </p>

            {createFeedback.error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                {createFeedback.error}
              </div>
            )}
            {createFeedback.message && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                {createFeedback.message}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth2 Refresh Token Flow"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide context, acceptance criteria, or links..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required={!createForm.teamId}
                    value={createForm.department}
                    onChange={(e) => handleCreateDeptChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Team (Optional)
                  </label>
                  <select
                    value={createForm.teamId}
                    onChange={(e) => handleCreateTeamChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No Explicit Team</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Assignee <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    disabled={!createForm.department && !createForm.teamId}
                    value={createForm.assignedTo}
                    onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="">
                      {!createForm.department && !createForm.teamId ? 'Select Dept/Team first' : 'Select Employee'}
                    </option>
                    {deptEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Due Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={createForm.estimatedHours}
                    onChange={(e) => setCreateForm({ ...createForm, estimatedHours: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-sky-400" />
              Edit Task Details
            </h2>

            {editFeedback.error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                {editFeedback.error}
              </div>
            )}
            {editFeedback.message && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                {editFeedback.message}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Department</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => handleEditDeptChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Assignee</label>
                  <select
                    value={editForm.assignedTo}
                    onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Employee</option>
                    {deptEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editForm.estimatedHours}
                    onChange={(e) => setEditForm({ ...editForm, estimatedHours: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN TASK MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute top-5 right-5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              Reassign Task
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Transfer ownership of this task to another team member</p>

            {assignFeedback.error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                {assignFeedback.error}
              </div>
            )}
            {assignFeedback.message && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                {assignFeedback.message}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Department</label>
                <select
                  value={assignForm.department}
                  onChange={(e) => handleAssignDeptChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  New Assignee <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={assignForm.assignedTo}
                  onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Employee</option>
                  {deptEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {assignSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reassigning...
                    </>
                  ) : (
                    'Confirm Reassignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS MODAL */}
      {detailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                  selectedTask.status
                )}`}
              >
                {selectedTask.status}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadge(
                  selectedTask.priority
                )}`}
              >
                {selectedTask.priority} PRIORITY
              </span>
              {selectedTask.isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  OVERDUE
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{selectedTask.title}</h2>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto mb-4">
              {selectedTask.description || 'No description provided.'}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Assignee</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedTask.assignedTo?.firstName
                    ? `${selectedTask.assignedTo.firstName} ${selectedTask.assignedTo.lastName}`
                    : 'N/A'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {selectedTask.assignedTo?.employeeCode || ''}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Department</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedTask.department?.name || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {selectedTask.department?.code || ''}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Due Date</span>
                <p
                  className={`font-semibold mt-0.5 ${
                    selectedTask.isOverdue ? 'text-rose-400' : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {formatDateStr(selectedTask.dueDate)}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Estimated Effort</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedTask.estimatedHours || 0} hours
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mb-5">
              <div className="flex justify-between">
                <span>Created Date:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatDateStr(selectedTask.createdAt)}</span>
              </div>
              {selectedTask.completedAt && (
                <div className="flex justify-between text-emerald-400">
                  <span>Completed Date:</span>
                  <span className="font-mono">{formatDateStr(selectedTask.completedAt)}</span>
                </div>
              )}
              {selectedTask.assignedBy && (
                <div className="flex justify-between">
                  <span>Created By:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedTask.assignedBy.email} ({selectedTask.assignedBy.role})
                  </span>
                </div>
              )}
            </div>

            {/* Quick Status Action Controls */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Move status:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(selectedTask._id, e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
