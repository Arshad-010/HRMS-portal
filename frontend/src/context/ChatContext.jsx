import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
      
      const newSocket = io(socketUrl, {
        auth: { token },
        withCredentials: true
      });

      newSocket.on('connect', () => {
        console.log('Chat socket connected:', newSocket.id);
      });

      newSocket.on('presence:online', (data) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.add(data.userId);
          return next;
        });
      });

      newSocket.on('presence:offline', (data) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      });

      newSocket.on('conversation:new', (conversation) => {
        setConversations(prev => {
          const exists = prev.find(c => c._id === conversation._id);
          if (exists) return prev;
          return [conversation, ...prev];
        });
      });

      newSocket.on('message:new', (message) => {
        // If this message belongs to the active conversation, append it
        setActiveConversation(currentActive => {
          if (currentActive && currentActive._id === message.conversationId) {
            setMessages(prev => [...prev, message]);
            // Also notify backend that we read it since we are active
            newSocket.emit('message:read', {
              conversationId: message.conversationId,
              messageIds: [message._id]
            });
          }
          return currentActive;
        });

        // Always update the conversation list snippet
        setConversations(prev => {
          return prev.map(c => {
            if (c._id === message.conversationId) {
              return { ...c, lastMessage: message, lastMessageAt: message.createdAt };
            }
            return c;
          }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [isAuthenticated, token]);

  // Load conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Select a conversation and load its messages
  const selectConversation = useCallback(async (conversationId) => {
    if (!conversationId) {
      if (socket && activeConversation) {
        socket.emit('leave_conversation', activeConversation._id);
      }
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setActiveConversation(conversation);
      }

      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
        
        if (socket) {
          // Leave old room
          if (activeConversation) {
            socket.emit('leave_conversation', activeConversation._id);
          }
          // Join new room
          socket.emit('join_conversation', conversationId);
          // Mark as read
          await api.put(`/chat/conversations/${conversationId}/read`);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversations, activeConversation, socket]);

  // Create or get direct conversation with a user
  const startDirectConversation = async (userId) => {
    try {
      const res = await api.post('/chat/conversations', { userId });
      if (res.data.success) {
        const conversation = res.data.data;
        // Make sure it's in the list
        setConversations(prev => {
          if (!prev.find(c => c._id === conversation._id)) {
            return [conversation, ...prev];
          }
          return prev;
        });
        return conversation;
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  };

  // Send a message
  const sendMessage = async (conversationId, payload) => {
    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
      if (res.data.success) {
        // We will receive it back via socket 'message:new', but we can optionally optimism-update
        return res.data.data;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const value = {
    socket,
    onlineUsers,
    conversations,
    activeConversation,
    messages,
    loading,
    fetchConversations,
    selectConversation,
    startDirectConversation,
    sendMessage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
