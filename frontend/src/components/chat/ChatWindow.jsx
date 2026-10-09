import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import { ChevronLeft, Info, Phone, Video, X } from 'lucide-react';

const ChatWindow = ({ onBack }) => {
  const { activeConversation, messages, loading, onlineUsers, createMeeting, getGoogleAuthUrl } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('Quick Sync');
  const [meetText, setMeetText] = useState('Can we join for a quick meeting?');
  const [isMeetCreating, setIsMeetCreating] = useState(false);
  const [requiresGoogleAuth, setRequiresGoogleAuth] = useState(false);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) return null;

  const otherUser = getOtherParticipant(activeConversation, user._id);
  const name = getConversationName(activeConversation, user._id);
  const isOnline = otherUser && onlineUsers.has(otherUser._id);
  const designation = otherUser?.employee?.designation || 'Staff';

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
      
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="relative shrink-0">
            {otherUser?.employee?.profileImage ? (
              <img src={otherUser.employee.profileImage} alt={name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm shadow-sm">
                {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} title={isOnline ? 'Online' : 'Offline'} />
          </div>
          
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white leading-none">{name}</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {activeConversation.type === 'DIRECT' ? (isOnline ? 'Active now' : designation) : 'Group Conversation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg hidden sm:block transition-colors cursor-pointer">
            <Phone className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              setRequiresGoogleAuth(false);
              setShowMeetModal(true);
            }}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg hidden sm:block transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#090d16]">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Say hello to {name}!</p>
            <p className="text-xs text-slate-500 mt-1">Start the conversation by sending a message below.</p>
          </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full">
            {messages.map(msg => (
              <MessageBubble key={msg._id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer Area */}
      <MessageComposer conversationId={activeConversation._id} />

      {/* Meet Modal */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">Start Video Meeting</h3>
              <button onClick={() => setShowMeetModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {requiresGoogleAuth ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Google Calendar Not Connected</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Connect your Google Calendar to seamlessly create and share Google Meet links in chats.
                  </p>
                  <button 
                    onClick={handleConnectGoogle}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors"
                  >
                    Connect Google Calendar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Title</label>
                    <input 
                      type="text" 
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invitation Text</label>
                    <textarea 
                      value={meetText}
                      onChange={(e) => setMeetText(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                  <button 
                    onClick={handleCreateMeet}
                    disabled={isMeetCreating || !meetTitle.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors mt-2"
                  >
                    {isMeetCreating ? 'Creating Meeting...' : 'Create & Send Invitation'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

export default ChatWindow;
