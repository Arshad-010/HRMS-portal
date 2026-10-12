import React, { useState, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import CreateGroupModal from './CreateGroupModal';
import {
  Search,
  MessageSquare,
  Users,
  Plus,
  Sparkles,
  Clock,
  Check,
  CheckCheck,
  Layers,
  Shield,
  Briefcase
} from 'lucide-react';

const ChatSidebar = ({ onSelect }) => {
  const {
    conversations,
    chatUsers,
    activeConversation,
    selectConversation,
    startDirectConversation,
    onlineUsers,
    totalUnreadChatCount
  } = useChat();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'DIRECT' | 'GROUPS' | 'DIRECTORY'
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const canCreateGroup = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';

  // Helper to resolve other participant in direct conversation
  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find((p) => p._id !== user?._id) || conv.participants[0];
  };

  // Helper to format timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Compute unread counts per category
  const unreadCounts = useMemo(() => {
    let direct = 0;
    let groups = 0;
    conversations.forEach((c) => {
      if (c.type === 'GROUP') {
        groups += c.unreadCount || 0;
      } else {
        direct += c.unreadCount || 0;
      }
    });
    return { direct, groups, total: direct + groups };
  }, [conversations]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Type filter
      if (activeFilter === 'DIRECT' && conv.type === 'GROUP') return false;
      if (activeFilter === 'GROUPS' && conv.type !== 'GROUP') return false;

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      if (conv.type === 'GROUP') {
        const groupName = (conv.name || '').toLowerCase();
        const desc = (conv.description || '').toLowerCase();
        const lastMsg = (conv.lastMessage?.text || '').toLowerCase();
        return groupName.includes(term) || desc.includes(term) || lastMsg.includes(term);
      } else {
        const other = getOtherParticipant(conv);
        const otherName = other?.employee?.firstName
          ? `${other.employee.firstName} ${other.employee.lastName || ''}`.toLowerCase()
          : other?.email?.toLowerCase() || '';
        const lastMsgText = (conv.lastMessage?.text || '').toLowerCase();
        return otherName.includes(term) || lastMsgText.includes(term);
      }
    });
  }, [conversations, activeFilter, searchTerm, user?._id]);

  // Filter directory users
  const filteredDirectoryUsers = useMemo(() => {
    return chatUsers.filter((u) => {
      if (directoryRoleFilter === 'EMPLOYEE' && u.role !== 'EMPLOYEE') return false;
      if (directoryRoleFilter === 'MANAGER' && u.role !== 'MANAGER') return false;
      if (directoryRoleFilter === 'HR' && u.role !== 'HR') return false;
      if (directoryRoleFilter === 'ADMIN' && u.role !== 'ADMIN') return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const name = `${u.employee?.firstName || ''} ${u.employee?.lastName || ''}`.toLowerCase();
        const code = (u.employee?.employeeCode || '').toLowerCase();
        const desig = (u.employee?.designation || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(term) || code.includes(term) || desig.includes(term) || email.includes(term);
      }
      return true;
    });
  }, [chatUsers, directoryRoleFilter, searchTerm]);

  const handleStartChatWithUser = async (targetUser) => {
    try {
      const conv = await startDirectConversation(targetUser._id);
      if (conv) {
        selectConversation(conv._id);
        setActiveFilter('ALL');
        if (onSelect) onSelect();
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const handleSelectConv = (convId) => {
    selectConversation(convId);
    if (onSelect) onSelect();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Top Header & Actions */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">Conversations</h2>
            {unreadCounts.total > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs">
                {unreadCounts.total}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {canCreateGroup && (
              <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Create Group Channel"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Group</span>
              </button>
            )}

            <button
              onClick={() => setActiveFilter(activeFilter === 'DIRECTORY' ? 'ALL' : 'DIRECTORY')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                activeFilter === 'DIRECTORY'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title={activeFilter === 'DIRECTORY' ? 'Back to Conversations' : 'Directory'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl">
          {[
            { id: 'ALL', label: 'All', badge: unreadCounts.total },
            { id: 'DIRECT', label: 'Direct', badge: unreadCounts.direct },
            { id: 'GROUPS', label: 'Groups', badge: unreadCounts.groups },
            { id: 'DIRECTORY', label: 'Directory' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      tab.id === 'GROUPS'
                        ? 'bg-violet-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeFilter === 'DIRECTORY'
                ? 'Search colleague directory...'
                : activeFilter === 'GROUPS'
                ? 'Search groups by channel name...'
                : 'Search messages, people, or groups...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>

        {/* Directory Role Filter Sub-bar */}
        {activeFilter === 'DIRECTORY' && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'EMPLOYEE', label: 'Staff' },
              { id: 'MANAGER', label: 'Managers' },
              { id: 'HR', label: 'HR' },
              { id: 'ADMIN', label: 'Admins' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDirectoryRoleFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  directoryRoleFilter === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        {activeFilter !== 'DIRECTORY' ? (
          filteredConversations.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                {activeFilter === 'GROUPS' ? (
                  <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                ) : (
                  <MessageSquare className="w-6 h-6" />
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                {activeFilter === 'GROUPS'
                  ? 'No group channels found'
                  : 'No conversations found'}
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                {activeFilter === 'GROUPS'
                  ? canCreateGroup
                    ? 'Create a team channel to coordinate across your department.'
                    : 'You have not been added to any group channels yet.'
                  : 'Start a direct chat with any colleague or create a team group.'}
              </p>
              {activeFilter === 'GROUPS' && canCreateGroup ? (
                <button
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-xs hover:bg-violet-500 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Channel</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveFilter('DIRECTORY')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-500 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Conversation</span>
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isGroup = conv.type === 'GROUP';
              const isSelected = activeConversation?._id === conv._id;
              const lastMsg = conv.lastMessage;
              const isMine = lastMsg?.sender?._id === user?._id;
              const isReadByOther =
                isMine && lastMsg?.readBy && lastMsg.readBy.some((r) => r.user !== user?._id);

              if (isGroup) {
                const groupName = conv.name || 'Team Channel';
                const memberCount = conv.participants?.length || 0;
                const lastSenderName = lastMsg?.sender?.employee?.firstName ||
                  lastMsg?.sender?.email?.split('@')[0] ||
                  '';

                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConv(conv._id)}
                    className={`w-full text-left p-3 mb-1.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-50 dark:bg-violet-950/30 border border-violet-500/20 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    {/* Group Icon Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected
                                ? 'text-violet-950 dark:text-white'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {groupName}
                          </h4>
                          <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                            {memberCount}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                          {formatTime(conv.lastMessageAt || conv.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 max-w-[85%] m-0">
                          {lastMsg ? (
                            <span className="truncate">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {isMine ? 'You' : lastSenderName}:{' '}
                              </span>
                              {lastMsg.isDeleted ? 'Message deleted' : lastMsg.text}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Channel active</span>
                          )}
                        </p>

                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 bg-violet-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }

              // Direct conversation card
              const other = getOtherParticipant(conv);
              const isOnline = other?._id && onlineUsers.has(other._id.toString());
              const name = other?.employee?.firstName
                ? `${other.employee.firstName} ${other.employee.lastName || ''}`
                : other?.email?.split('@')[0] || 'Teammate';
              const initials = name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <button
                  key={conv._id}
                  onClick={() => handleSelectConv(conv._id)}
                  className={`w-full text-left p-3 mb-1.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/25 border border-blue-500/20 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    {other?.employee?.profileImage ? (
                      <img
                        src={other.employee.profileImage}
                        alt={name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {initials}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected
                            ? 'text-blue-950 dark:text-white'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                        {formatTime(conv.lastMessageAt || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 max-w-[85%] m-0">
                        {isMine && (
                          <span className="shrink-0 text-slate-400">
                            {isReadByOther ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </span>
                        )}
                        <span className="truncate">
                          {lastMsg?.isDeleted
                            ? 'Message deleted'
                            : lastMsg?.text || `Chat started with ${name}`}
                        </span>
                      </p>

                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          /* Employee Directory */
          filteredDirectoryUsers.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-slate-400">
              No matching employees found in directory.
            </div>
          ) : (
            filteredDirectoryUsers.map((u) => {
              const isOnline = onlineUsers.has(u._id.toString());
              const name = u.employee?.firstName
                ? `${u.employee.firstName} ${u.employee.lastName || ''}`
                : u.email?.split('@')[0] || 'Employee';
              const designation = u.employee?.designation || u.role;
              const initials = name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <button
                  key={u._id}
                  onClick={() => handleStartChatWithUser(u)}
                  className="w-full text-left p-3 mb-1.5 rounded-2xl flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent"
                >
                  <div className="relative shrink-0">
                    {u.employee?.profileImage ? (
                      <img
                        src={u.employee.profileImage}
                        alt={name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                        {initials}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {name}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {u.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 m-0">
                      {designation}
                    </p>
                  </div>
                </button>
              );
            })
          )
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
    </div>
  );
};

export default ChatSidebar;
