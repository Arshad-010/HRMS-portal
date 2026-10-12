import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
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
  const { isAuthenticated, user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, page: 1 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> Array of user names

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Total unread chat count across all conversations
  const totalUnreadChatCount = conversations.reduce(
    (acc, curr) => acc + (curr.unreadCount || 0),
    0
  );

  // Load conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/chat/conversations');
      if (res.data?.success) {
        setConversations(res.data.data || []);
      }
    } catch (error) {
      console.debug('Error fetching conversations:', error.message);
    }
  }, [isAuthenticated]);

  // Load eligible chat directory users
  const fetchChatUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/chat/users');
      if (res.data?.success) {
        setChatUsers(res.data.data || []);
      }
    } catch (error) {
      console.debug('Error fetching chat users:', error.message);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchChatUsers();
    } else {
      setConversations([]);
      setMessages([]);
      setActiveConversation(null);
      setChatUsers([]);
    }
  }, [isAuthenticated, fetchConversations, fetchChatUsers]);

  // Bind real-time socket listeners
  useEffect(() => {
    if (!isAuthenticated || !socket) return;

    const handleOnline = (data) => {
      if (data?.userId) {
        setOnlineUsers((prev) => new Set([...prev, data.userId.toString()]));
      }
    };

    const handleOffline = (data) => {
      if (data?.userId) {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId.toString());
          return next;
        });
      }
    };

    const handleNewConversation = (conversation) => {
      if (!conversation || !conversation._id) return;
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversation._id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
    };

    const handleNewMessage = (message) => {
      if (!message || !message.conversationId) return;

      const currentActive = activeConversationRef.current;
      const isCurrentActive = currentActive && currentActive._id === message.conversationId;

      if (isCurrentActive) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        // Auto mark read if active
        api.put(`/chat/conversations/${message.conversationId}/read`).catch(() => {});
      }

      // Update conversations list (latest message, sorting, and unread count)
      setConversations((prev) => {
        return prev
          .map((c) => {
            if (c._id === message.conversationId) {
              const shouldIncrementUnread =
                !isCurrentActive && message.sender?._id !== user?._id;
              return {
                ...c,
                lastMessage: message,
                lastMessageAt: message.createdAt || new Date(),
                unreadCount: shouldIncrementUnread
                  ? (c.unreadCount || 0) + 1
                  : isCurrentActive
                  ? 0
                  : c.unreadCount || 0,
              };
            }
            return c;
          })
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    const handleUpdateMessage = (message) => {
      if (!message || !message._id) return;
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    const handleDeleteMessage = ({ messageId }) => {
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, text: 'This message was deleted' }
            : m
        )
      );
    };

    const handleReadMessage = (data) => {
      if (!data || !data.messageIds) return;
      setMessages((prev) => {
        let updated = false;
        const next = prev.map((m) => {
          if (data.messageIds.includes(m._id)) {
            updated = true;
            return {
              ...m,
              readBy: [...(m.readBy || []), { user: data.userId, readAt: data.readAt }],
            };
          }
          return m;
        });
        return updated ? next : prev;
      });
    };

    const handleUnreadUpdate = () => {
      fetchConversations();
    };

    const handleTypingStart = ({ conversationId, user: typingUser }) => {
      setTypingUsers((prev) => {
        const currentList = prev[conversationId] || [];
        const displayName = typingUser?.employee?.firstName || typingUser?.email?.split('@')[0] || 'Someone';
        if (currentList.includes(displayName)) return prev;
        return {
          ...prev,
          [conversationId]: [...currentList, displayName],
        };
      });
    };

    const handleTypingStop = ({ conversationId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: [],
      }));
    };

    const handleReconnect = () => {
      fetchConversations();
      const currentActive = activeConversationRef.current;
      if (currentActive) {
        socket.emit('join_conversation', currentActive._id);
      }
    };

    const handleGroupUpdated = (updatedConv) => {
      if (!updatedConv || !updatedConv._id) return;
      setConversations((prev) =>
        prev.map((c) => (c._id === updatedConv._id ? { ...c, ...updatedConv } : c))
      );
      if (activeConversationRef.current?._id === updatedConv._id) {
        setActiveConversation((prev) => ({ ...prev, ...updatedConv }));
      }
    };

    const handleGroupMembersAdded = ({ conversationId, conversation }) => {
      if (conversation) {
        handleGroupUpdated(conversation);
      } else {
        fetchConversations();
      }
    };

    const handleGroupMemberRemoved = ({ conversationId, conversation }) => {
      if (conversation) {
        handleGroupUpdated(conversation);
      } else {
        fetchConversations();
      }
    };

    const handleGroupMemberLeft = ({ conversationId, conversation }) => {
      if (conversation) {
        handleGroupUpdated(conversation);
      } else {
        fetchConversations();
      }
    };

    const handleGroupRemovedYou = ({ conversationId }) => {
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    };

    socket.on('presence:online', handleOnline);
    socket.on('presence:offline', handleOffline);
    socket.on('conversation:new', handleNewConversation);
    socket.on('message:new', handleNewMessage);
    socket.on('message:update', handleUpdateMessage);
    socket.on('message:delete', handleDeleteMessage);
    socket.on('message:read', handleReadMessage);
    socket.on('chat:unread_update', handleUnreadUpdate);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('group:updated', handleGroupUpdated);
    socket.on('group:members_added', handleGroupMembersAdded);
    socket.on('group:member_removed', handleGroupMemberRemoved);
    socket.on('group:member_left', handleGroupMemberLeft);
    socket.on('group:removed_you', handleGroupRemovedYou);
    socket.on('reconnect', handleReconnect);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('presence:online', handleOnline);
      socket.off('presence:offline', handleOffline);
      socket.off('conversation:new', handleNewConversation);
      socket.off('message:new', handleNewMessage);
      socket.off('message:update', handleUpdateMessage);
      socket.off('message:delete', handleDeleteMessage);
      socket.off('message:read', handleReadMessage);
      socket.off('chat:unread_update', handleUnreadUpdate);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('group:updated', handleGroupUpdated);
      socket.off('group:members_added', handleGroupMembersAdded);
      socket.off('group:member_removed', handleGroupMemberRemoved);
      socket.off('group:member_left', handleGroupMemberLeft);
      socket.off('group:removed_you', handleGroupRemovedYou);
      socket.off('reconnect', handleReconnect);
      socket.off('connect', handleReconnect);
    };
  }, [isAuthenticated, socket, user?._id, fetchConversations]);

  // Select a conversation and load message history
  const selectConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        if (socket && activeConversationRef.current) {
          socket.emit('leave_conversation', activeConversationRef.current._id);
        }
        setActiveConversation(null);
        setMessages([]);
        return;
      }

      try {
        setLoading(true);
        // Find conversation in state
        let targetConv = conversations.find((c) => c._id === conversationId);
        if (targetConv) {
          setActiveConversation(targetConv);
        }

        // Leave previous conversation room
        if (socket && activeConversationRef.current && activeConversationRef.current._id !== conversationId) {
          socket.emit('leave_conversation', activeConversationRef.current._id);
        }

        // Join new conversation room
        if (socket) {
          socket.emit('join_conversation', conversationId);
        }

        // Fetch messages with pagination limit
        const res = await api.get(`/chat/conversations/${conversationId}/messages?limit=40`);
        if (res.data?.success) {
          setMessages(res.data.data || []);
          setPagination(res.data.pagination || { total: res.data.data.length, hasMore: false, page: 1 });

          // Reset unread count locally for this conversation
          setConversations((prev) =>
            prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
          );

          // Mark conversation read on backend
          await api.put(`/chat/conversations/${conversationId}/read`).catch(() => {});
        }
      } catch (error) {
        console.error('Error loading messages:', error.message);
      } finally {
        setLoading(false);
      }
    },
    [conversations, socket]
  );

  // Load older messages (cursor-based pagination)
  const loadMoreMessages = useCallback(async () => {
    const currentActive = activeConversationRef.current;
    if (!currentActive || messages.length === 0 || loadingMore || !pagination.hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      const oldestMessage = messages[0];
      const res = await api.get(
        `/chat/conversations/${currentActive._id}/messages?limit=40&before=${encodeURIComponent(
          oldestMessage.createdAt
        )}`
      );

      if (res.data?.success && res.data.data?.length > 0) {
        setMessages((prev) => [...res.data.data, ...prev]);
        setPagination(res.data.pagination);
      } else {
        setPagination((prev) => ({ ...prev, hasMore: false }));
      }
    } catch (err) {
      console.error('Error loading older messages:', err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [messages, loadingMore, pagination.hasMore]);

  // Create or get direct conversation with an employee
  const startDirectConversation = async (userId) => {
    try {
      const res = await api.post('/chat/conversations', { userId });
      if (res.data?.success) {
        const conversation = res.data.data;
        setConversations((prev) => {
          if (!prev.find((c) => c._id === conversation._id)) {
            return [conversation, ...prev];
          }
          return prev;
        });
        return conversation;
      }
    } catch (error) {
      console.error('Error starting conversation:', error.message);
      throw error;
    }
  };

  // Send message
  const sendMessage = async (conversationId, payload) => {
    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
      if (res.data?.success) {
        const msg = res.data.data;
        // Optimistically ensure message is in local messages
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        return msg;
      }
    } catch (error) {
      console.error('Error sending message:', error.message);
      throw error;
    }
  };

  // Edit message
  const editMessage = async (conversationId, msgId, text) => {
    try {
      const res = await api.put(`/chat/conversations/${conversationId}/messages/${msgId}`, { text });
      if (res.data?.success) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.data.data : m)));
        return res.data.data;
      }
    } catch (error) {
      console.error('Error editing message:', error.message);
      throw error;
    }
  };

  // Delete message
  const deleteMessage = async (conversationId, msgId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}/messages/${msgId}`);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msgId
            ? { ...m, isDeleted: true, text: 'This message was deleted' }
            : m
        )
      );
    } catch (error) {
      console.error('Error deleting message:', error.message);
      throw error;
    }
  };

  // React to message
  const reactToMessage = async (conversationId, msgId, emoji) => {
    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages/${msgId}/react`, {
        emoji,
      });
      if (res.data?.success) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.data.data : m)));
        return res.data.data;
      }
    } catch (error) {
      console.error('Error reacting to message:', error.message);
      throw error;
    }
  };

  // Typing indicator trigger
  const emitTyping = (conversationId, isTyping) => {
    if (!socket || !conversationId) return;
    if (isTyping) {
      socket.emit('typing:start', conversationId);
    } else {
      socket.emit('typing:stop', conversationId);
    }
  };

  // Create group conversation
  const createGroup = async (groupData) => {
    try {
      const res = await api.post('/chat/groups', groupData);
      if (res.data?.success) {
        const group = res.data.data;
        setConversations((prev) => [group, ...prev.filter((c) => c._id !== group._id)]);
        return group;
      }
    } catch (error) {
      console.error('Error creating group:', error.message);
      throw error;
    }
  };

  // Update group details
  const updateGroup = async (groupId, updateData) => {
    try {
      const res = await api.put(`/chat/groups/${groupId}`, updateData);
      if (res.data?.success) {
        const updated = res.data.data;
        setConversations((prev) =>
          prev.map((c) => (c._id === groupId ? { ...c, ...updated } : c))
        );
        if (activeConversationRef.current?._id === groupId) {
          setActiveConversation((prev) => ({ ...prev, ...updated }));
        }
        return updated;
      }
    } catch (error) {
      console.error('Error updating group:', error.message);
      throw error;
    }
  };

  // Add members to group
  const addGroupMembers = async (groupId, memberIds) => {
    try {
      const res = await api.post(`/chat/groups/${groupId}/members`, { memberIds });
      if (res.data?.success) {
        const updated = res.data.data;
        setConversations((prev) =>
          prev.map((c) => (c._id === groupId ? { ...c, ...updated } : c))
        );
        if (activeConversationRef.current?._id === groupId) {
          setActiveConversation((prev) => ({ ...prev, ...updated }));
        }
        return updated;
      }
    } catch (error) {
      console.error('Error adding group members:', error.message);
      throw error;
    }
  };

  // Remove member from group
  const removeGroupMember = async (groupId, userId) => {
    try {
      const res = await api.delete(`/chat/groups/${groupId}/members/${userId}`);
      if (res.data?.success) {
        const updated = res.data.data;
        setConversations((prev) =>
          prev.map((c) => (c._id === groupId ? { ...c, ...updated } : c))
        );
        if (activeConversationRef.current?._id === groupId) {
          setActiveConversation((prev) => ({ ...prev, ...updated }));
        }
        return updated;
      }
    } catch (error) {
      console.error('Error removing group member:', error.message);
      throw error;
    }
  };

  // Leave group
  const leaveGroup = async (groupId) => {
    try {
      const res = await api.post(`/chat/groups/${groupId}/leave`);
      if (res.data?.success) {
        if (activeConversationRef.current?._id === groupId) {
          setActiveConversation(null);
          setMessages([]);
        }
        setConversations((prev) => prev.filter((c) => c._id !== groupId));
        return res.data;
      }
    } catch (error) {
      console.error('Error leaving group:', error.message);
      throw error;
    }
  };

  const value = {
    socket,
    isSocketConnected: isConnected,
    onlineUsers,
    conversations,
    chatUsers,
    activeConversation,
    messages,
    pagination,
    loading,
    loadingMore,
    totalUnreadChatCount,
    typingUsers,
    fetchConversations,
    fetchChatUsers,
    selectConversation,
    loadMoreMessages,
    startDirectConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    emitTyping,
    createGroup,
    updateGroup,
    addGroupMembers,
    removeGroupMember,
    leaveGroup,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
