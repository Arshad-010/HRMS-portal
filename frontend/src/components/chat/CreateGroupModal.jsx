import React, { useState, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Users,
  Search,
  Check,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';

const CreateGroupModal = ({ isOpen, onClose, onCreated }) => {
  const { chatUsers, createGroup, selectConversation } = useChat();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState('GENERAL');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extract unique departments from chatUsers
  const departments = useMemo(() => {
    const set = new Set();
    chatUsers.forEach((u) => {
      const deptName = u.employee?.departmentId?.name || u.employee?.departmentName;
      if (deptName) set.add(deptName);
    });
    return Array.from(set);
  }, [chatUsers]);

  // Filter eligible users for member selection
  const filteredUsers = useMemo(() => {
    return chatUsers.filter((u) => {
      // Exclude self (creator is added automatically)
      if (u._id === user?._id) return false;

      // Department filter
      if (departmentFilter !== 'ALL') {
        const deptName = u.employee?.departmentId?.name || u.employee?.departmentName;
        if (deptName !== departmentFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${u.employee?.firstName || ''} ${u.employee?.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const desig = (u.employee?.designation || '').toLowerCase();
        const code = (u.employee?.employeeCode || '').toLowerCase();
        return fullName.includes(q) || email.includes(q) || desig.includes(q) || code.includes(q);
      }

      return true;
    });
  }, [chatUsers, user?._id, departmentFilter, searchQuery]);

  if (!isOpen) return null;

  const handleToggleUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      filteredUsers.forEach((u) => next.add(u._id));
      return next;
    });
  };

  const handleClearSelected = () => {
    setSelectedUserIds(new Set());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Group name must be at least 2 characters.');
      return;
    }

    if (selectedUserIds.size === 0) {
      setErrorMessage('Please select at least one teammate to join the group.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newGroup = await createGroup({
        name: name.trim(),
        description: description.trim(),
        groupType,
        memberIds: Array.from(selectedUserIds),
      });

      if (newGroup) {
        selectConversation(newGroup._id);
        if (onCreated) onCreated(newGroup);
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">Create Group Channel</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Collaborate with department colleagues or project teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Group Name & Channel Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Group Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Engineering Core, HR Sync, Q4 Roadmap"
                maxLength={100}
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              >
                <option value="GENERAL">General</option>
                <option value="DEPARTMENT">Department</option>
                <option value="PROJECT">Project</option>
              </select>
            </div>
          </div>

          {/* Group Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              maxLength={250}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          {/* Member Selection Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Members <span className="text-rose-500">*</span>
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                  {selectedUserIds.size} selected
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {selectedUserIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelected}
                    className="text-slate-400 hover:text-rose-500 text-[11px] font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                {filteredUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-violet-600 dark:text-violet-400 text-[11px] font-semibold hover:underline cursor-pointer"
                  >
                    Select All ({filteredUsers.length})
                  </button>
                )}
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search teammates by name or designation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>

              {departments.length > 0 && (
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none shrink-0"
                >
                  <option value="ALL">All Depts</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Teammates List */}
            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 no-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No eligible colleagues found matching query.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.has(u._id);
                  const nameStr = `${u.employee?.firstName || ''} ${u.employee?.lastName || ''}`.trim() || u.email?.split('@')[0];
                  const designation = u.employee?.designation || u.role;
                  const dept = u.employee?.departmentId?.name || u.employee?.departmentName || '';

                  return (
                    <div
                      key={u._id}
                      onClick={() => handleToggleUser(u._id)}
                      className={`px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-violet-50/70 dark:bg-violet-950/30 text-slate-900 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                          {nameStr.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate m-0">{nameStr}</p>
                          <p className="text-[10px] text-slate-400 truncate m-0">
                            {designation} {dept ? `• ${dept}` : ''}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-violet-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || selectedUserIds.size === 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white shadow-md shadow-violet-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Channel...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Channel</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
