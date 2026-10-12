import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Users,
  Shield,
  UserPlus,
  UserMinus,
  Edit2,
  Check,
  LogOut,
  AlertCircle,
  Loader2,
  Crown,
  Search,
  Sparkles
} from 'lucide-react';

const GroupDetailsDrawer = ({ isOpen, onClose }) => {
  const {
    activeConversation,
    updateGroup,
    addGroupMembers,
    removeGroupMember,
    leaveGroup,
    chatUsers,
    onlineUsers,
  } = useChat();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState(new Set());
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !activeConversation || activeConversation.type !== 'GROUP') {
    return null;
  }

  const currentUserId = user?._id || user?.id;
  const isOrgAdmin = user?.role === 'ADMIN' || user?.role === 'HR';
  const isGroupAdmin =
    isOrgAdmin ||
    (activeConversation.admins || []).some((a) => (a._id || a).toString() === currentUserId?.toString()) ||
    (activeConversation.creator &&
      (activeConversation.creator._id || activeConversation.creator).toString() === currentUserId?.toString());

  const handleStartEdit = () => {
    setEditName(activeConversation.name || '');
    setEditDescription(activeConversation.description || '');
    setIsEditing(true);
    setErrorMsg('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      setErrorMsg('Group name must be at least 2 characters');
      return;
    }
    try {
      setLoadingAction(true);
      await updateGroup(activeConversation._id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update group');
    } finally {
      setLoadingAction(false);
    }
  };

  // Find users who are not currently members
  const existingMemberIds = new Set(
    (activeConversation.participants || []).map((p) => (p._id || p).toString())
  );
  const eligibleToAdd = chatUsers.filter((u) => {
    if (existingMemberIds.has(u._id.toString())) return false;
    if (addSearchTerm.trim()) {
      const q = addSearchTerm.toLowerCase();
      const name = `${u.employee?.firstName || ''} ${u.employee?.lastName || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }
    return true;
  });

  const handleToggleAddUser = (userId) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleConfirmAddMembers = async () => {
    if (selectedToAdd.size === 0) return;
    try {
      setLoadingAction(true);
      await addGroupMembers(activeConversation._id, Array.from(selectedToAdd));
      setIsAddingMembers(false);
      setSelectedToAdd(new Set());
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add members');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${memberName || 'this user'} from the group?`
      )
    ) {
      return;
    }
    try {
      setLoadingAction(true);
      await removeGroupMember(activeConversation._id, memberId);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group channel?')) {
      return;
    }
    try {
      setLoadingAction(true);
      await leaveGroup(activeConversation._id);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to leave group');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">Channel Details</h3>
            <p className="text-[11px] text-slate-400 m-0">
              {activeConversation.participants?.length || 0} members
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Group Info Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 relative">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={loadingAction}
                  className="px-3.5 py-1 text-xs font-semibold bg-violet-600 text-white rounded-lg shadow-sm hover:bg-violet-500 cursor-pointer flex items-center gap-1"
                >
                  {loadingAction ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  <span>Save</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white m-0">
                      {activeConversation.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                      {activeConversation.groupType || 'GENERAL'}
                    </span>
                  </div>
                  {activeConversation.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
                      {activeConversation.description}
                    </p>
                  )}
                </div>
                {isGroupAdmin && (
                  <button
                    onClick={handleStartEdit}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Edit Channel Settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Member Management Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">
              Participants ({activeConversation.participants?.length || 0})
            </h5>
            {isGroupAdmin && !isAddingMembers && (
              <button
                onClick={() => setIsAddingMembers(true)}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Members</span>
              </button>
            )}
          </div>

          {/* Add Members Sub-Panel */}
          {isAddingMembers && (
            <div className="p-3.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-900 dark:text-violet-300">Add Teammates</span>
                <button
                  onClick={() => {
                    setIsAddingMembers(false);
                    setSelectedToAdd(new Set());
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search colleagues to add..."
                  value={addSearchTerm}
                  onChange={(e) => setAddSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 no-scrollbar">
                {eligibleToAdd.length === 0 ? (
                  <div className="p-3 text-center text-[11px] text-slate-400">
                    No new teammates available to add.
                  </div>
                ) : (
                  eligibleToAdd.map((u) => {
                    const isSelected = selectedToAdd.has(u._id);
                    const name =
                      `${u.employee?.firstName || ''} ${u.employee?.lastName || ''}`.trim() ||
                      u.email?.split('@')[0];

                    return (
                      <div
                        key={u._id}
                        onClick={() => handleToggleAddUser(u._id)}
                        className={`px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate">
                          <p className="m-0 truncate">{name}</p>
                          <p className="text-[10px] text-slate-400 truncate m-0">
                            {u.employee?.designation || u.role}
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-violet-600 text-white'
                              : 'border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingMembers(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddMembers}
                  disabled={loadingAction || selectedToAdd.size === 0}
                  className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-violet-500 cursor-pointer"
                >
                  Add Selected ({selectedToAdd.size})
                </button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {(activeConversation.participants || []).map((participant) => {
              const pId = participant._id || participant;
              const isCreator =
                activeConversation.creator &&
                (activeConversation.creator._id || activeConversation.creator).toString() === pId.toString();
              const isAdmin = (activeConversation.admins || []).some(
                (a) => (a._id || a).toString() === pId.toString()
              );
              const isOnline = onlineUsers.has(pId.toString());

              const nameStr =
                participant.employee?.firstName
                  ? `${participant.employee.firstName} ${participant.employee.lastName || ''}`.trim()
                  : participant.email?.split('@')[0] || 'Member';

              const designation = participant.employee?.designation || participant.role || 'Member';
              const isSelf = pId.toString() === currentUserId?.toString();

              return (
                <div
                  key={pId.toString()}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                        {nameStr.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate m-0">
                          {nameStr} {isSelf ? '(You)' : ''}
                        </p>
                        {isCreator && (
                          <span
                            className="text-amber-500 shrink-0"
                            title="Channel Creator"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {isAdmin && !isCreator && (
                          <span
                            className="text-blue-500 shrink-0"
                            title="Channel Admin"
                          >
                            <Shield className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate m-0">
                        {designation}
                      </p>
                    </div>
                  </div>

                  {/* Member Actions */}
                  {isGroupAdmin && !isSelf && !isCreator && (
                    <button
                      onClick={() => handleRemoveMember(pId, nameStr)}
                      disabled={loadingAction}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Remove from channel"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Area: Leave Channel */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        <button
          onClick={handleLeaveGroup}
          disabled={loadingAction}
          className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Channel</span>
        </button>
      </div>
    </div>
  );
};

export default GroupDetailsDrawer;
