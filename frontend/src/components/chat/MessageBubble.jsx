import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, CheckCheck, FileText, Calendar, CheckSquare } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const isMine = message.sender._id === user._id;

  // Format time
  const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Read status for my messages
  const isRead = isMine && message.readBy && message.readBy.some(r => r.user !== user._id);

  // Sender Name (only shown if not mine)
  const senderName = message.sender?.employee?.firstName 
    ? `${message.sender.employee.firstName}`
    : message.sender?.email?.split('@')[0];

  return (
    <div className={`flex flex-col mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar for others */}
        {!isMine && (
          <div className="w-8 h-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 mb-1">
            {senderName?.charAt(0).toUpperCase()}
          </div>
        )}

        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          {!isMine && <span className="text-[10px] text-slate-500 ml-1 mb-1">{senderName}</span>}
          
          <div className={`relative px-4 py-2.5 shadow-sm ${
            isMine 
              ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm'
          }`}>
            
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

          </div>

          {/* Metadata */}
          <div className="flex items-center gap-1 mt-1 px-1">
            <span className="text-[9px] text-slate-400">{timeStr}</span>
            {isMine && (
              <span className="text-slate-400 ml-1">
                {isRead ? <CheckCheck className="w-3 h-3 text-indigo-500" /> : <Check className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
