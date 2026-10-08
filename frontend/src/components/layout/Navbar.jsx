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
  Users,
  Clock,
  Calendar,
  CheckSquare,
  Bell,
  CheckCheck,
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
  Phone,
  Camera,
  Palette,
  Check,
  Menu
} from 'lucide-react';

export const Navbar = ({ toggleMobileSidebar, isCollapsed, toggleCollapse }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    unreadCount,
    recentNotifications,
    loading: notificationsLoading,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { themeMode, setThemeMode, themeFamily, setThemeFamily } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const themeDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setIsThemeDropdownOpen(false);
      }
    };

    if (isDropdownOpen || isProfileDropdownOpen || isThemeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isProfileDropdownOpen]);

  // Fetch recent notifications when dropdown opens
  const handleToggleDropdown = () => {
    if (!isDropdownOpen) {
      fetchRecentNotifications();
    }
    setIsDropdownOpen((prev) => !prev);
    setIsProfileDropdownOpen(false);
  };

  const handleToggleProfileDropdown = () => {
    setIsProfileDropdownOpen((prev) => !prev);
    setIsDropdownOpen(false);
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

  const employee = user?.employee;
  const initials = employee?.firstName 
    ? `${employee.firstName[0]}${employee.lastName?.[0] || ''}`.toUpperCase()
    : user?.email?.[0].toUpperCase();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Left Hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Mobile Hamburger */}
              <button 
                onClick={toggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Open navigation sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Desktop Hamburger / Collapse Toggle */}
              <button 
                onClick={toggleCollapse}
                className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label="Collapse sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            /* Animated Brand Logo with hover slide animation (Requirement 3) */
            <Link 
              to="/" 
              className="group flex items-center gap-3 no-underline cursor-pointer py-1 select-none"
              title="HRMS Portal Home"
            >
              {/* Logo Icon with 3D lift, spin and pulse dot */}
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-indigo-500/40 shrink-0">
                <Layers className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 group-hover:animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
              </div>

              {/* Site Name with Slide Animation when cursor nears it */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 transition-all duration-300 ease-out group-hover:translate-x-2">
                  <span className="text-base font-black tracking-tight text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
                    HRMS
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white transition-colors">
                    Portal
                  </span>
                  <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                    &rarr;
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 m-0 leading-tight transition-all duration-300 ease-out group-hover:translate-x-2">
                  Enterprise HR Suite
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Center Navigation for Unauthenticated Users (Individual standalone buttons with bright hover/active states) */}
        {!isAuthenticated && (
          <nav className="hidden lg:flex items-center gap-2">
            {[
              { name: 'Home', path: '/', icon: Home },
              { name: 'Features', path: '/features', icon: Sparkles },
              { name: 'Attendance', path: '/attendance', icon: Clock },
              { name: 'Leave Portal', path: '/leave', icon: Calendar },
              { name: 'Tasks', path: '/tasks', icon: CheckSquare },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name}
                  to={item.path} 
                  className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer hover:-translate-y-0.5 hover:shadow-lg ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white border-indigo-400/50 shadow-md shadow-indigo-600/35 scale-[1.03]' 
                      : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:bg-indigo-600 dark:hover:text-white dark:hover:border-indigo-500 hover:shadow-indigo-500/25'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-white'
                  }`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Nav & Action Buttons (Requirements 1 & 2: User Login and Admin Portal) */}
        <div className="flex items-center gap-2.5 shrink-0">

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

              {/* Compact Profile Control & Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={handleToggleProfileDropdown}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-500 text-white flex items-center justify-center text-xs font-bold border border-white/20 dark:border-slate-800">
                    {employee?.profilePicture ? (
                      <img src={employee.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-wide">
                      {user?.role}
                    </span>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {employee?.profilePicture ? (
                          <img src={employee.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {employee?.firstName ? `${employee.firstName} ${employee.lastName}` : user?.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {employee?.employeeCode || 'N/A'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            roleBadgeColors[user?.role] || roleBadgeColors.EMPLOYEE
                          } px-1.5 py-0.5 rounded-full`}>
                            {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors no-underline"
                      >
                        <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        My Profile
                      </Link>
                      
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors no-underline"
                      >
                        <Camera className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        Change Profile Photo
                      </Link>
                    </div>

                    <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Dark / Light Mode Toggle Button with right proportion */}
              <button
                type="button"
                onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:border-amber-400 dark:hover:border-indigo-400 hover:bg-amber-50/40 dark:hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} mode`}
                aria-label="Toggle theme mode"
              >
                {themeMode === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-90" />
                    <span className="text-xs font-bold text-slate-200 hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
                    <span className="text-xs font-bold text-slate-700 hidden sm:inline">Dark</span>
                  </>
                )}
              </button>

              {/* User Login Button (Requirement 1 & bright hover) */}
              <Link
                to="/login?portal=user"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-xs font-bold transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 group cursor-pointer"
                title="Employee & Manager Login"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
                <span>User Login</span>
              </Link>

              {/* Admin Portal Button (Requirement 1 & bright gradient) */}
              <Link
                to="/login?portal=admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:via-violet-500 hover:to-violet-600 text-white text-xs font-bold transition-all duration-200 shadow-md shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5 hover:scale-[1.03] group cursor-pointer"
                title="System Administrator & HR Management Portal"
              >
                <Shield className="w-3.5 h-3.5 text-white transition-transform group-hover:rotate-12" />
                <span>Admin Portal</span>
              </Link>

              {/* Mobile Menu Toggle for unauthenticated users */}
              <button
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unauthenticated Mobile Dropdown Menu */}
      {!isAuthenticated && isMobileNavOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation</span>
            {/* Mobile Dark/Light toggle */}
            <button
              type="button"
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {[
            { name: 'Home', path: '/', icon: Home },
            { name: 'Features', path: '/features', icon: Sparkles },
            { name: 'Attendance', path: '/attendance', icon: Clock },
            { name: 'Leave Portal', path: '/leave', icon: Calendar },
            { name: 'Tasks', path: '/tasks', icon: CheckSquare },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileNavOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            <Link
              to="/login?portal=user"
              onClick={() => setIsMobileNavOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>User Login</span>
            </Link>
            <Link
              to="/login?portal=admin"
              onClick={() => setIsMobileNavOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 hover:shadow-lg transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
