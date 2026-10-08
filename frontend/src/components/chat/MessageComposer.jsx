import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Paperclip, CheckSquare, Calendar } from 'lucide-react';

const MessageComposer = ({ conversationId }) => {
  const { sendMessage } = useChat();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // RBAC checks for specialized actions
  const canAssignTask = user.role === 'ADMIN' || user.role === 'HR' || user.role === 'MANAGER';
  const canCreateMeeting = user.role === 'ADMIN' || user.role === 'HR' || user.role === 'MANAGER';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(conversationId, {
        text: text.trim(),
        type: 'TEXT'
      });
      setText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSpecialAction = async (type) => {
    // In a full implementation, this would open a modal to gather details (Task Info / Meeting URL)
    // For this demonstration, we send a preset payload to prove the RBAC and Socket integration works
    try {
      setSending(true);
      if (type === 'TASK') {
        await sendMessage(conversationId, {
          type: 'TASK',
          text: 'Please review the new compliance documents.'
        });
      } else if (type === 'MEETING') {
        await sendMessage(conversationId, {
          type: 'MEETING',
          text: 'Weekly Sync',
          meetingDetails: {
            title: 'Weekly Sync',
            url: 'https://meet.google.com/abc-defg-hij',
            date: new Date(),
            startTime: '10:00 AM'
          }
        });
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action not authorized or failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      
      {/* Specialized Actions Bar (RBAC protected) */}
      <div className="flex items-center gap-2 mb-3">
        <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Attach File">
          <Paperclip className="w-4 h-4" />
        </button>
        
        {canAssignTask && (
          <button 
            onClick={() => handleSpecialAction('TASK')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 rounded-lg transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Assign Task
          </button>
        )}
        
        {canCreateMeeting && (
          <button 
            onClick={() => handleSpecialAction('MEETING')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 rounded-lg transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            Create Meeting
          </button>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-transparent focus-within:border-indigo-500/30 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-500"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="shrink-0 w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
};

export default MessageComposer;
