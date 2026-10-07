import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Layers,
  Activity,
  LogOut,
  LogIn,
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Calendar,
  CheckSquare,
  Bell,
  CheckCheck,
  History,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sun,
  Moon,
  Shield,
  Home,
  Phone
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    unreadCount,
    recentNotifications,
    loading: notificationsLoading,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Fetch recent notifications when dropdown opens
  const handleToggleDropdown = () => {
    if (!isDropdownOpen) {
      fetchRecentNotifications();
    }
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationItemClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setIsDropdownOpen(false);

    // Route to respective domain view
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
    } else {
      navigate('/notifications');
    }
  };

  const roleBadgeColors = {
    ADMIN: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    HR: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    MANAGER: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    EMPLOYEE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Leaves', path: '/leaves', icon: Calendar },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Activity', path: '/activity', icon: History },
  ];

  // Helper for notification type icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case 'LEAVE_APPROVED':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'LEAVE_REJECTED':
      case 'LEAVE_CANCELLED':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'TASK_ASSIGNED':
        return <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />;
      case 'TASK_STATUS_CHANGED':
      case 'TASK_COMPLETED':
        return <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />;
      case 'ATTENDANCE_REMINDER':
        return <Clock className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Main Nav */}
        <div className="flex items-center gap-8">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white m-0">HRMS Portal</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 m-0">Enterprise HR Suite</p>
            </div>
          </Link>

          {/* Primary Nav Links (when authenticated) */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  location.pathname === link.path ||
                  (link.path !== '/dashboard' && location.pathname.startsWith(link.path));

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Nav & User Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-2 mr-2">
              <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <Link to="/about" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Info className="w-3.5 h-3.5" />
                <span>About</span>
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                <span>Contact</span>
              </Link>
            </nav>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* Notification Bell with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={handleToggleDropdown}
                  title="Notifications"
                  className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                    isDropdownOpen
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 border border-transparent'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-md shadow-rose-500/40 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Popover */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Notification Items List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                      {notificationsLoading && recentNotifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                          Loading alerts...
                        </div>
                      ) : recentNotifications.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-500 dark:text-slate-400">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">All caught up!</p>
                          <p className="text-[11px] text-slate-500 mb-0">No new notifications for you right now.</p>
                        </div>
                      ) : (
                        recentNotifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationItemClick(notif)}
                            className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-100 dark:bg-slate-800 ${
                              !notif.isRead ? 'bg-indigo-950/20' : 'bg-transparent'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <h4 className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {notif.title}
                                </h4>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-1">
                                {notif.message}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>{formatTimeAgo(notif.createdAt)}</span>
                                {notif.relatedEntityType && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] uppercase font-semibold">
                                    {notif.relatedEntityType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setIsDropdownOpen(false)}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors no-underline"
                      >
                        <span>View all notifications</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  {user?.employee?.firstName ? user.employee.firstName[0] : user?.email[0].toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight m-0">
                    {user?.employee?.firstName
                      ? `${user.employee.firstName} ${user.employee.lastName}`
                      : user?.email}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono m-0">
                    {user?.employee?.employeeCode || user?.role}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    roleBadgeColors[user?.role] || roleBadgeColors.EMPLOYEE
                  }`}
                >
                  {user?.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Admin Portal</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
