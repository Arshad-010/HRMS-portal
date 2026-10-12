import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';

const Chat = () => {
  const { activeConversation } = useChat();
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'
  const [activeRoleTab, setActiveRoleTab] = useState('EMPLOYEE'); // 'EMPLOYEE', 'ADMIN', 'HR_MANAGER'

  // When a conversation is selected on mobile, switch to 'chat' view
  const handleConversationSelect = () => {
    setMobileView('chat');
  };

  // When back button is pressed on mobile chat window
  const handleBackToList = () => {
    setMobileView('list');
  };

  const tabs = [
    { id: 'EMPLOYEE', label: 'Employees' },
    { id: 'ADMIN', label: 'Admin' },
    { id: 'HR_MANAGER', label: 'HR & Managers' }
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Role Tabs Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 px-4 sm:px-6">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRoleTab(tab.id)}
              className={`py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeRoleTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: hidden on mobile if viewing chat */}
        <div className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col`}>
          <ChatSidebar onSelect={handleConversationSelect} activeRoleTab={activeRoleTab} />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">People Directory</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Select an employee to start a conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
