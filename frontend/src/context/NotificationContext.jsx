import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Track previous connection state to detect reconnection
  const wasConnectedRef = useRef(false);

  // Add toast notification with deduplication
  const addToast = useCallback((notification) => {
    if (!notification || !notification._id) return;
    const toastId = notification._id;

    setToasts((prev) => {
      // Prevent duplicate toasts
      if (prev.some((t) => t.id === toastId)) return prev;
      return [
        {
          id: toastId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedEntityType: notification.relatedEntityType,
          relatedEntityId: notification.relatedEntityId,
          createdAt: notification.createdAt || new Date(),
        },
        ...prev.slice(0, 4), // Keep max 5 queued toasts
      ];
    });
  }, []);

  // Remove toast by id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch unread count from REST API
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications/unread');
      if (response.data?.success) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.debug('Failed to fetch unread count:', err.message);
    }
  }, [isAuthenticated]);

  // Fetch top recent notifications for dropdown
  const fetchRecentNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=6');
      if (response.data?.success) {
        setRecentNotifications(response.data.data.notifications || []);
        if (typeof response.data.data.unreadCount === 'number') {
          setUnreadCount(response.data.data.unreadCount);
        }
      }
    } catch (err) {
      console.debug('Failed to fetch recent notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data?.success) {
        setRecentNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
    return false;
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      if (response.data?.success) {
        setRecentNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
        return true;
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
    return false;
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.data?.success) {
        setRecentNotifications((prev) => prev.filter((n) => n._id !== id));
        fetchUnreadCount();
        return true;
      }
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
    return false;
  }, [fetchUnreadCount]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecentNotifications([]);
      setToasts([]);
      return;
    }

    fetchUnreadCount();
    fetchRecentNotifications();
  }, [isAuthenticated, fetchUnreadCount, fetchRecentNotifications]);

  // Real-time socket event listeners & Reconnection missed notification catch-up
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Handle new incoming real-time notification
    const handleNewNotification = (notification) => {
      if (!notification || !notification._id) return;

      // Update recent notifications list
      setRecentNotifications((prev) => {
        const filtered = prev.filter((n) => n._id !== notification._id);
        return [notification, ...filtered].slice(0, 10);
      });

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Trigger unobtrusive toast
      addToast(notification);

      // Broadcast custom DOM event for active views (like Notifications page)
      window.dispatchEvent(
        new CustomEvent('hrms:notification:new', { detail: notification })
      );
    };

    // Authoritative unread count update from backend
    const handleUnreadCount = (data) => {
      if (data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    // When a notification was read in another tab or window
    const handleNotificationRead = (data) => {
      if (data?.notificationId) {
        setRecentNotifications((prev) =>
          prev.map((n) =>
            n._id === data.notificationId ? { ...n, isRead: true, readAt: new Date() } : n
          )
        );
      }
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    // When all notifications were marked read in another tab
    const handleAllRead = () => {
      setRecentNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    };

    // When a notification was deleted
    const handleNotificationDeleted = (data) => {
      if (data?.notificationId) {
        setRecentNotifications((prev) =>
          prev.filter((n) => n._id !== data.notificationId)
        );
      }
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    // Handle Socket Reconnection: retrieve any missed notifications while disconnected
    const handleReconnect = () => {
      fetchUnreadCount();
      fetchRecentNotifications();
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:unread_count', handleUnreadCount);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notification:all_read', handleAllRead);
    socket.on('notification:deleted', handleNotificationDeleted);
    socket.on('reconnect', handleReconnect);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:unread_count', handleUnreadCount);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notification:all_read', handleAllRead);
      socket.off('notification:deleted', handleNotificationDeleted);
      socket.off('reconnect', handleReconnect);
      socket.off('connect', handleReconnect);
    };
  }, [socket, isAuthenticated, addToast, fetchUnreadCount, fetchRecentNotifications]);

  // Track isConnected to fetch on reconnect in case socket instance was reused
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      // Just reconnected! Retrieve missed notifications
      fetchUnreadCount();
      fetchRecentNotifications();
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected, fetchUnreadCount, fetchRecentNotifications]);

  const value = {
    unreadCount,
    recentNotifications,
    loading,
    toasts,
    addToast,
    removeToast,
    fetchUnreadCount,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isSocketConnected: isConnected,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
