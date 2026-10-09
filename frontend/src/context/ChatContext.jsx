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
  const [chatUsers, setChatUsers] = useState([]);

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
            setMessages(prev => {
              // Prevent duplicate messages
              if (prev.some(m => m._id === message._id)) return prev;
              return [...prev, message];
            });
            // Also notify backend that we read it since we are active
            api.put(`/chat/conversations/${message.conversationId}/read`).catch(err => console.error('Error marking read:', err));
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

      newSocket.on('message:update', (message) => {
        setMessages(prev => prev.map(m => m._id === message._id ? message : m));
      });

      newSocket.on('message:delete', ({ messageId, conversationId }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted', fileUrl: null } : m));
      });

      newSocket.on('message:read', (data) => {
        setMessages(prev => {
          let updated = false;
          const next = prev.map(m => {
            if (data.messageIds.includes(m._id)) {
              updated = true;
              return {
                ...m,
                readBy: [...(m.readBy || []), { user: data.userId, readAt: data.readAt }]
              };
            }
            return m;
          });
          return updated ? next : prev;
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

  // Load chat users
  const fetchChatUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/chat/users');
      if (res.data.success) {
        setChatUsers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching chat users:', error);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchChatUsers();
    }
  }, [isAuthenticated, fetchConversations, fetchChatUsers]);

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

  const editMessage = async (conversationId, msgId, text) => {
    try {
      const res = await api.put(`/chat/conversations/${conversationId}/messages/${msgId}`, { text });
      return res.data.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  };

  const deleteMessage = async (conversationId, msgId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}/messages/${msgId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  const reactToMessage = async (conversationId, msgId, emoji) => {
    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages/${msgId}/react`, { emoji });
      // Optimistically update the message with the new reaction
      setMessages(prev => prev.map(m => m._id === msgId ? res.data.data : m));
      return res.data.data;
    } catch (error) {
      console.error('Error reacting to message:', error);
      throw error;
    }
  };

  const getGoogleAuthUrl = async () => {
    try {
      const res = await api.get('/meet/auth');
      return res.data.url;
    } catch (error) {
      console.error('Error getting Google Auth URL:', error);
      throw error;
    }
  };

  const createMeeting = async (conversationId, meetingTitle, meetingText) => {
    try {
      const res = await api.post('/meet/create', { conversationId, meetingTitle, meetingText });
      return res.data;
    } catch (error) {
      if (error.response && error.response.status === 401 && error.response.data.requiresGoogleAuth) {
        return error.response.data; // return requiresGoogleAuth to UI
      }
      console.error('Error creating meeting:', error);
      throw error;
    }
  };

  const value = {
    socket,
    onlineUsers,
    conversations,
    chatUsers,
    activeConversation,
    messages,
    loading,
    fetchConversations,
    fetchChatUsers,
    selectConversation,
    startDirectConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    getGoogleAuthUrl,
    createMeeting
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
