import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Check, CheckCheck, FileText, Calendar, CheckSquare, Smile, Pencil, Trash2, MoreVertical, X, Check as CheckIcon } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const { editMessage, deleteMessage, reactToMessage } = useChat();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const isMine = message.sender._id === user._id;

  const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const isRead = isMine && message.readBy && message.readBy.some(r => r.user !== user._id);
  const isDelivered = isMine && !isRead; 

  const senderName = message.sender?.employee?.firstName 
    ? `${message.sender.employee.firstName}`
    : message.sender?.email?.split('@')[0];

  const handleEditSave = async () => {
    if (editText.trim() && editText.trim() !== message.text) {
      await editMessage(message.conversationId, message._id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(message.conversationId, message._id);
    }
    setShowMobileActions(false);
  };

  const handleReact = async (emoji) => {
    await reactToMessage(message.conversationId, message._id, emoji);
    setShowEmojiPicker(false);
    setShowMobileActions(false);
  };

  // Group reactions
  const reactionCounts = {};
  const myReactions = new Set();
  (message.reactions || []).forEach(r => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
    const reactUserId = r.user?._id ? r.user._id.toString() : r.user?.toString();
    if (reactUserId === user._id?.toString()) {
      myReactions.add(r.emoji);
    }
  });

  const actionButtons = (
    <div className={`absolute top-0 ${isMine ? 'right-full mr-0' : 'left-full ml-0'} hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg p-1 z-10`}>
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="React">
        <Smile className="w-4 h-4" />
      </button>
      {isMine && !message.isDeleted && message.type === 'TEXT' && (
        <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="Edit">
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {isMine && !message.isDeleted && (
        <button onClick={handleDelete} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const emojiPickerMenu = showEmojiPicker && (
    <div className={`absolute top-full mt-2 ${isMine ? 'right-0' : 'left-0'} bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 rounded-xl p-2 z-20 flex gap-2`}>
      {EMOJIS.map(emoji => (
        <button key={emoji} onClick={() => handleReact(emoji)} className="text-xl hover:scale-125 transition-transform">
          {emoji}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`flex flex-col mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'} relative group`}>
        
        {/* Avatar for others */}
        {!isMine && (
          <div className="w-8 h-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            {senderName?.charAt(0).toUpperCase()}
          </div>
        )}

        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} relative`}>
          {!isMine && <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1 mb-1">{senderName}</span>}
          
          <div className={`relative px-4 py-2.5 shadow-sm ${
            isMine 
              ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm'
          } ${message.isDeleted ? 'bg-transparent border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 dark:text-slate-400 shadow-none' : ''}`}>
            
            {message.isDeleted ? (
              <p className="text-sm italic flex items-center gap-2">
                <Trash2 className="w-4 h-4 opacity-70" />
                This message was deleted
              </p>
            ) : isEditing ? (
              <div className="flex flex-col gap-2 min-w-[200px]">
                <textarea 
                  value={editText} 
                  onChange={e => setEditText(e.target.value)}
                  className="w-full text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-none rounded p-2 focus:ring-2 focus:ring-indigo-400 resize-none outline-none"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleEditSave} className="p-1 rounded bg-indigo-500 text-white hover:bg-indigo-600">
                    <CheckIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Standard Text Message */}
                {message.type === 'TEXT' && (
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                )}

                {/* Task Card */}
                {message.type === 'TASK' && (
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide opacity-80 border-b border-white/20 pb-1">
                      <CheckSquare className="w-4 h-4" />
                      Task Assigned
                    </div>
                    <p className="text-sm font-semibold mb-1">{message.text || 'New Task'}</p>
                    <a href={`/tasks`} className={`inline-block mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                      Open Tasks
                    </a>
                  </div>
                )}

                {/* Meeting Card */}
                {message.type === 'MEETING' && (
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide opacity-80 border-b border-white/20 pb-1">
                      <Calendar className="w-4 h-4" />
                      Meeting Invite
                    </div>
                    <p className="text-sm font-semibold mb-1">{message.meetingDetails?.title || message.text}</p>
                    {message.meetingDetails?.date && (
                      <p className="text-xs opacity-90 mb-2">
                        {new Date(message.meetingDetails.date).toLocaleDateString()} at {message.meetingDetails.startTime}
                      </p>
                    )}
                    {message.meetingDetails?.url && (
                      <a href={message.meetingDetails.url} target="_blank" rel="noreferrer" className={`inline-block mt-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                        Join Meeting
                      </a>
                    )}
                  </div>
                )}

                {/* File Attachment */}
                {message.type === 'FILE' && (
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isMine ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[150px]">{message.fileName}</p>
                      <p className="text-[10px] opacity-70">Document</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {actionButtons}
            {emojiPickerMenu}
          </div>
          
          {/* Reactions Display */}
          {Object.keys(reactionCounts).length > 0 && !message.isDeleted && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'} max-w-full`}>
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button 
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border ${
                    myReactions.has(emoji) 
                      ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                      : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Mobile Actions Toggle */}
          <button onClick={() => setShowMobileActions(!showMobileActions)} className={`md:hidden absolute top-2 ${isMine ? '-left-6' : '-right-6'} text-slate-400`}>
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {/* Mobile Actions Menu */}
          {showMobileActions && (
            <div className={`md:hidden absolute top-8 ${isMine ? 'right-0' : 'left-0'} bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 rounded-lg p-2 z-20 flex gap-2`}>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded">
                <Smile className="w-4 h-4" />
              </button>
              {isMine && !message.isDeleted && message.type === 'TEXT' && (
                <button onClick={() => { setIsEditing(true); setShowMobileActions(false); }} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {isMine && !message.isDeleted && (
                <button onClick={handleDelete} className="p-2 text-red-600 bg-red-50 dark:bg-red-900/30 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-1 mt-1 px-1">
            <span className="text-[9px] text-slate-400">{timeStr}</span>
            {message.isEdited && !message.isDeleted && (
              <span className="text-[9px] text-slate-400 italic mx-1">Edited</span>
            )}
            {isMine && (
              <span className="text-slate-400 ml-1">
                {isRead ? <CheckCheck className="w-3 h-3 text-indigo-500" /> : <CheckCheck className="w-3 h-3 opacity-50" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
