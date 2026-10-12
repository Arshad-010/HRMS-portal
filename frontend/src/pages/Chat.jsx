import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { MessageSquare, Users, Shield, Sparkles } from 'lucide-react';

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
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-[#F4F7FC] dark:bg-[#0B1220]">
      {/* Sidebar: hidden on mobile if currently viewing chat */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        } flex-col`}
      >
        <ChatSidebar onSelect={handleConversationSelect} />
      </div>

      {/* Main Chat Area: hidden on mobile if currently viewing list */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <ChatWindow onBack={handleBackToList} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#F4F7FC] dark:bg-[#0B1220]">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">
                Direct Messages
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Select a conversation from the left, or click <strong className="text-blue-600 dark:text-blue-400">+ New Chat</strong> to start messaging any colleague in your organization.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
