import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import GroupDetailsDrawer from './GroupDetailsDrawer';
import {
  ChevronLeft,
  Info,
  Phone,
  Video,
  X,
  Loader2,
  WifiOff,
  Sparkles,
  Users,
  Settings
} from 'lucide-react';

const ChatWindow = ({ onBack }) => {
  const {
    activeConversation,
    messages,
    loading,
    loadingMore,
    pagination,
    loadMoreMessages,
    onlineUsers,
    isSocketConnected,
    typingUsers,
    createMeeting,
    getGoogleAuthUrl
  } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('Quick Sync');
  const [meetText, setMeetText] = useState('Can we join for a quick meeting?');
  const [isMeetCreating, setIsMeetCreating] = useState(false);
  const [requiresGoogleAuth, setRequiresGoogleAuth] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  if (!activeConversation) return null;

  const isGroup = activeConversation?.type === 'GROUP';
  const currentUserId = user?.id || user?._id;
  const otherUser = isGroup ? null : getOtherParticipant(activeConversation, currentUserId);
  const name = isGroup
    ? activeConversation.name || 'Group Channel'
    : getConversationName(activeConversation, currentUserId);
  const isOnline = otherUser?._id && onlineUsers.has(otherUser._id.toString());
  const designation =
    otherUser?.employee?.designation ||
    otherUser?.employeeId?.designation ||
    otherUser?.role ||
    'Staff';

  const typingList = typingUsers[activeConversation._id] || [];

  const handleCreateMeet = async () => {
    setIsMeetCreating(true);
    try {
      const res = await createMeeting(activeConversation._id, meetTitle, meetText);
      if (res.requiresGoogleAuth) {
        setRequiresGoogleAuth(true);
      } else {
        setShowMeetModal(false);
      }
    } catch (error) {
      alert('Failed to create meeting');
    } finally {
      setIsMeetCreating(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const url = await getGoogleAuthUrl();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      alert('Failed to get Google Auth URL');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 relative">
      {/* Offline Status Warning */}
      {!isSocketConnected && (
        <div className="bg-amber-500/15 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Real-time chat disconnected. Attempting to reconnect...</span>
        </div>
      )}

      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Back to conversations"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            {isGroup ? (
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center text-sm shadow-xs">
                <Users className="w-5 h-5" />
              </div>
            ) : otherUser?.employee?.profileImage || otherUser?.employeeId?.profileImage ? (
              <img
                src={otherUser.employee?.profileImage || otherUser.employeeId?.profileImage}
                alt={name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm shadow-xs">
                {name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
            )}
            {!isGroup && (
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              />
            )}
          </div>

          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-none m-0">
              {name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {!isGroup && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                {isGroup
                  ? `${activeConversation.participants?.length || 0} members • ${
                      activeConversation.groupType || 'General'
                    }`
                  : isOnline
                  ? 'Active now'
                  : designation}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {isGroup ? (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Channel Details & Members"
            >
              <Users className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="hidden sm:inline">Channel Info</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setRequiresGoogleAuth(false);
                setShowMeetModal(true);
              }}
              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl hidden sm:block transition-colors cursor-pointer"
              title="Start Video Meeting"
            >
              <Video className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#0B1220]">
        {/* Cursor/Pagination "Load Older Messages" Button */}
        {pagination?.hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading older history...</span>
                </>
              ) : (
                <span>Load earlier messages</span>
              )}
            </button>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
            <span>Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👋</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
              Say hello to {name}!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              This is the beginning of your direct conversation. Messages are delivered in real time.
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full space-y-1">
            {messages.map((msg) => (
              <MessageBubble key={msg._id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Real-time Typing Indicator Banner */}
      {typingList.length > 0 && (
        <div className="px-4 py-1.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1.5 italic">
          <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
          <span>{typingList.join(', ')} is typing...</span>
        </div>
      )}

      {/* Composer Area */}
      <MessageComposer conversationId={activeConversation._id} />

      {/* Video Meeting Modal */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm m-0">Start Video Meeting</h3>
              <button
                onClick={() => setShowMeetModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {requiresGoogleAuth ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Google Calendar Not Connected</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Connect your Google Calendar to create Google Meet links.
                  </p>
                  <button
                    onClick={handleConnectGoogle}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer"
                  >
                    Connect Google Calendar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Meeting Title</label>
                    <input
                      type="text"
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Invitation Text</label>
                    <textarea
                      value={meetText}
                      onChange={(e) => setMeetText(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleCreateMeet}
                    disabled={isMeetCreating || !meetTitle.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors mt-1 cursor-pointer"
                  >
                    {isMeetCreating ? 'Creating Meeting...' : 'Create & Send Invitation'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Details Drawer */}
      <GroupDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

// Helper Functions
function getOtherParticipant(conv, currentUserId) {
  if (conv?.participants) {
    return conv.participants.find((p) => p._id !== currentUserId) || conv.participants[0];
  }
  return null;
}

function getConversationName(conv, currentUserId) {
  if (conv?.name) return conv.name;
  const other = getOtherParticipant(conv, currentUserId);
  if (!other) return 'Direct Conversation';
  const emp = other.employee || other.employeeId;
  if (emp?.firstName) {
    return `${emp.firstName} ${emp.lastName || ''}`;
  }
  return other.email?.split('@')[0] || 'Teammate';
}

export default ChatWindow;
