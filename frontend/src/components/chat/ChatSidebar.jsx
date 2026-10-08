import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Edit, User as UserIcon } from 'lucide-react';
import NewConversationModal from './NewConversationModal';

const ChatSidebar = ({ onSelect }) => {
  const { conversations, activeConversation, selectConversation, onlineUsers, startDirectConversation } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv, user._id);
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (id) => {
    selectConversation(id);
    if (onSelect) onSelect();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="New Conversation"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center p-4 text-xs text-slate-500">
            No conversations found.
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isActive = activeConversation?._id === conv._id;
            const name = getConversationName(conv, user._id);
            const otherUser = getOtherParticipant(conv, user._id);
            const isOnline = otherUser && onlineUsers.has(otherUser._id);
            const unreadCount = getUnreadCount(conv, user._id); // Assume lastMessage has readBy logic

            return (
              <button
                key={conv._id}
                onClick={() => handleSelect(conv._id)}
                className={`w-full text-left p-3 mb-1 rounded-xl flex items-center gap-3 transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${isActive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-200'}`}>
                      {name}
                    </h4>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {formatShortDate(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-xs truncate ${unreadCount > 0 ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      {conv.lastMessage?.text || (conv.lastMessage?.type === 'FILE' ? '📎 Attachment' : 'No messages yet')}
                    </p>
                    {unreadCount > 0 && (
                      <span className="shrink-0 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <NewConversationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onStart={(id) => handleSelect(id)}
      />
    </div>
  );
};

// Helper Functions
function getOtherParticipant(conv, currentUserId) {
  if (conv.type === 'DIRECT') {
    return conv.participants.find(p => p._id !== currentUserId);
  }
  return null;
}

function getConversationName(conv, currentUserId) {
  if (conv.name) return conv.name;
  if (conv.type === 'DIRECT') {
    const other = getOtherParticipant(conv, currentUserId);
    if (!other) return 'Unknown User';
    if (other.employee?.firstName) {
      return `${other.employee.firstName} ${other.employee.lastName || ''}`;
    }
    return other.email?.split('@')[0];
  }
  return 'Group Chat';
}

function getUnreadCount(conv, currentUserId) {
  // If last message was not sent by current user, and current user is not in readBy array
  if (!conv.lastMessage) return 0;
  if (conv.lastMessage.sender?._id === currentUserId) return 0;
  
  const readByMe = conv.lastMessage.readBy?.find(r => r.user === currentUserId);
  return readByMe ? 0 : 1; // Simplified: in a real app, you'd calculate total unread
}

function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default ChatSidebar;
