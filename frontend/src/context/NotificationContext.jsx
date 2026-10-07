import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications/unread');
      if (response.data?.success) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Gracefully handle network/auth errors without crashing UI
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

  // Initial load and periodic polling every 45 seconds
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 45000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const value = {
    unreadCount,
    recentNotifications,
    loading,
    fetchUnreadCount,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
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
