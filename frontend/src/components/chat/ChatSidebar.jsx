import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Search } from 'lucide-react';

const ChatSidebar = ({ onSelect, activeRoleTab }) => {
  const { chatUsers, conversations, activeConversation, selectConversation, startDirectConversation, onlineUsers } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users based on tab and search
  const filteredUsers = chatUsers.filter((u) => {
    // Role filter
    if (activeRoleTab === 'EMPLOYEE' && u.role !== 'EMPLOYEE') return false;
    if (activeRoleTab === 'ADMIN' && u.role !== 'ADMIN') return false;
    if (activeRoleTab === 'HR_MANAGER' && u.role !== 'HR' && u.role !== 'MANAGER') return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const name = `${u.employeeId?.firstName || ''} ${u.employeeId?.lastName || ''}`.toLowerCase();
      const code = (u.employeeId?.employeeCode || '').toLowerCase();
      const desig = (u.employeeId?.designation || '').toLowerCase();
      
      return name.includes(term) || code.includes(term) || desig.includes(term);
    }
    
    return true;
  });

  const handleSelectUser = async (targetUser) => {
    try {
      // Create or get the conversation with this user
      const conv = await startDirectConversation(targetUser._id);
      if (conv) {
        selectConversation(conv._id);
        if (onSelect) onSelect();
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">People</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* People List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        {filteredUsers.length === 0 ? (
          <div className="text-center p-4 text-xs text-slate-500">
            No employees available
          </div>
        ) : (
          filteredUsers.map(u => {
            // Check if there is an active conversation with this user
            // so we can highlight them
            const convWithUser = conversations.find(c => 
              c.type === 'DIRECT' && c.participants.some(p => p._id === u._id)
            );
            
            const isActive = activeConversation?._id && convWithUser?._id === activeConversation._id;
            const isOnline = onlineUsers.has(u._id);
            const name = u.employeeId?.firstName 
              ? `${u.employeeId.firstName} ${u.employeeId.lastName || ''}` 
              : u.email?.split('@')[0];
              
            const designation = u.employeeId?.designation || u.role;
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            // Calculate unread from convWithUser if it exists
            let unreadCount = 0;
            if (convWithUser && convWithUser.lastMessage) {
              if (convWithUser.lastMessage.sender?._id !== user._id) {
                const readByMe = convWithUser.lastMessage.readBy?.find(r => r.user === user._id);
                if (!readByMe) unreadCount = 1;
              }
            }

            return (
              <button
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className={`w-full text-left p-3 mb-1 rounded-xl flex items-center gap-3 transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {u.employeeId?.profileImage ? (
                    <img src={u.employeeId.profileImage} alt={name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${isActive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      {initials}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} title={isOnline ? 'Online' : 'Offline'} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-200'}`}>
                      {name}
                    </h4>
                    {unreadCount > 0 && (
                      <span className="shrink-0 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs truncate text-slate-500 dark:text-slate-400">
                      {designation}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
