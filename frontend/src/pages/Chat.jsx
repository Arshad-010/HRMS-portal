import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';

const Chat = () => {
  const { activeConversation } = useChat();
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'

  // When a conversation is selected on mobile, switch to 'chat' view
  const handleConversationSelect = () => {
    setMobileView('chat');
  };

  // When back button is pressed on mobile chat window
  const handleBackToList = () => {
    setMobileView('list');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar: hidden on mobile if viewing chat */}
      <div className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col`}>
        <ChatSidebar onSelect={handleConversationSelect} />
      </div>

      {/* Main Chat Area: hidden on mobile if viewing list */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <ChatWindow onBack={handleBackToList} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-indigo-500 dark:text-indigo-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">HRMS Secure Chat</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Select a conversation from the sidebar to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
