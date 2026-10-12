import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Calendar,
  CheckSquare,
  Clock,
  Info,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const Notifications = () => {
  const navigate = useNavigate();
  const { markAsRead: contextMarkRead, markAllAsRead: contextMarkAllRead, fetchUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (unreadOnly) {
        queryParams.append('unreadOnly', 'true');
      }

      const response = await api.get(`/notifications?${queryParams.toString()}`);
      if (response.data?.success) {
        setNotifications(response.data.data.notifications || []);
        setTotalPages(response.data.data.pages || 1);
        setTotalCount(response.data.data.total || 0);
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await contextMarkRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking as read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await contextMarkAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking all as read:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      fetchUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err.message);
    }
  };

  const handleNavigateToEntity = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    if (notif.relatedEntityType === 'LEAVE') {
      navigate('/leaves');
    } else if (notif.relatedEntityType === 'TASK') {
      navigate('/tasks');
    } else if (notif.relatedEntityType === 'ATTENDANCE') {
      navigate('/attendance');
    } else if (notif.relatedEntityType === 'EMPLOYEE') {
      navigate('/employees');
    } else if (notif.relatedEntityType === 'DEPARTMENT') {
      navigate('/departments');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'LEAVE_APPROVED':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'LEAVE_REJECTED':
      case 'LEAVE_CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'TASK_ASSIGNED':
        return <CheckSquare className="w-4 h-4 text-indigo-400" />;
      case 'TASK_STATUS_CHANGED':
      case 'TASK_COMPLETED':
        return <CheckCircle className="w-4 h-4 text-cyan-400" />;
      case 'ATTENDANCE_REMINDER':
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight m-0">Notification Center</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Manage and track your HRMS alerts and activity updates</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            onClick={() => fetchNotifications()}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !unreadOnly
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            All Notifications ({totalCount})
          </button>

          <button
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              unreadOnly
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                unreadOnly ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 px-2 font-mono">
          Showing page {page} of {totalPages}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchNotifications}
            className="ml-auto underline hover:text-rose-200 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2.5">
        {loading && notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading your notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 dark:text-slate-400">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-0">
              {unreadOnly
                ? 'Great job staying on top of everything! You have read all notifications.'
                : 'When new leaves, tasks, or system updates are assigned to you, they will appear here.'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNavigateToEntity(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !notif.isRead
                  ? 'bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        NEW
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      &bull; {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-2 max-w-2xl">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-2">
                    {notif.relatedEntityType && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-indigo-400 border border-slate-300 dark:border-slate-700 uppercase">
                        {notif.relatedEntityType}
                      </span>
                    )}
                    {notif.isRead && notif.readAt && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Read {new Date(notif.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {notif.relatedEntityType && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToEntity(notif);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-100 dark:bg-indigo-600/20 hover:bg-indigo-200 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-colors cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                {!notif.isRead && (
                  <button
                    onClick={(e) => handleMarkAsRead(notif._id, e)}
                    title="Mark as read"
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={(e) => handleDelete(notif._id, e)}
                  title="Delete notification"
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
