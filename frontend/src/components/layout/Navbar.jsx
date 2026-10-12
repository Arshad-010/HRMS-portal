import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo, BrandSymbol } from '../common/BrandLogo';
import {
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
  MessageSquare,
  Menu,
  Search,
  User,
  Settings,
  ChevronDown,
  X
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
    isSocketConnected,
  } = useNotifications();
  const { themeMode, toggleTheme } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
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
    };

    if (isDropdownOpen || isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isProfileDropdownOpen]);

  // Global keyboard shortcut ('/' or 'cmd+k') to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.metaKey && e.key === 'k')) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();

    if (q.includes('leave')) {
      navigate('/leaves');
    } else if (q.includes('attend') || q.includes('clock') || q.includes('punch')) {
      navigate('/attendance');
    } else if (q.includes('task') || q.includes('todo')) {
      navigate('/tasks');
    } else if (q.includes('dept') || q.includes('department')) {
      navigate('/departments');
    } else if (q.includes('team')) {
      navigate('/my-team');
    } else {
      navigate(`/employees?search=${encodeURIComponent(searchQuery.trim())}`);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleNotificationItemClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setIsDropdownOpen(false);

    if (notif.relatedEntityType === 'LEAVE') {
      navigate('/leaves');
    } else if (notif.relatedEntityType === 'TASK') {
      navigate('/tasks');
    } else if (notif.relatedEntityType === 'CHAT' || notif.type === 'DIRECT_MESSAGE' || notif.type === 'GROUP_MESSAGE') {
      navigate('/chat');
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED':
        return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      case 'LEAVE_APPROVED':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'LEAVE_REJECTED':
        return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      case 'TASK_ASSIGNED':
        return <CheckSquare className="w-3.5 h-3.5 text-blue-500" />;
      case 'TASK_COMPLETED':
        return <CheckCircle className="w-3.5 h-3.5 text-teal-500" />;
      case 'DIRECT_MESSAGE':
      case 'GROUP_MESSAGE':
        return <MessageSquare className="w-3.5 h-3.5 text-violet-500" />;
      case 'ATTENDANCE_REMINDER':
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-500" />;
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

  const fullName = employee?.firstName
    ? `${employee.firstName} ${employee.lastName || ''}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <header className="border-b border-slate-200 dark:border-[#263449] bg-white/95 dark:bg-[#111C2E]/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Sidebar Toggle & Brand Info */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={toggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Open navigation sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Collapse Trigger */}
              <button
                type="button"
                onClick={toggleCollapse}
                className="hidden lg:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label="Toggle sidebar collapse"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link to="/" className="group no-underline cursor-pointer py-1 select-none">
              <BrandLogo variant="horizontal" size="md" linkTo={false} />
            </Link>
          )}
        </div>

        {/* Center: Global Quick Search (Authenticated) or Public Nav Links */}
        {isAuthenticated ? (
          <div className="flex-1 max-w-md mx-2 hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees, tasks, departments... (Press '/')"
                className="w-full pl-9 pr-14 py-2 bg-slate-100/80 dark:bg-[#0B1220] border border-slate-200 dark:border-[#263449] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
                  /
                </kbd>
              </div>
            </form>
          </div>
        ) : (
          <nav className="hidden sm:flex items-center gap-2">
            {[
              { name: 'Home', path: '/', icon: Home },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Light / Dark Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111C2E] text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme mode"
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-90" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Notification Bell Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={handleToggleDropdown}
                  title="Notifications"
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isDropdownOpen
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111C2E] text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400'
                  }`}
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-black text-white bg-rose-500 rounded-full shadow-sm animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-[#0B1220] border-b border-slate-200 dark:border-[#263449] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                        {isSocketConnected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" title="Live real-time active" />
                        )}
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#263449]/50">
                      {notificationsLoading && recentNotifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">Loading alerts...</div>
                      ) : recentNotifications.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <Sparkles className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All caught up!</p>
                          <p className="text-[11px] text-slate-400">No new alerts right now.</p>
                        </div>
                      ) : (
                        recentNotifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationItemClick(notif)}
                            className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-[#16253D] ${
                              !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'bg-transparent'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-[#263449] flex items-center justify-center shrink-0 mt-0.5">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <h4
                                  className={`text-xs font-semibold truncate ${
                                    !notif.isRead
                                      ? 'text-blue-900 dark:text-white'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {notif.title}
                                </h4>
                                {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-1">
                                {notif.message}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>{formatTimeAgo(notif.createdAt)}</span>
                                {notif.relatedEntityType && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] uppercase font-bold">
                                    {notif.relatedEntityType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-[#0B1220] border-t border-slate-200 dark:border-[#263449] text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setIsDropdownOpen(false)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1.5"
                      >
                        <span>View all notifications</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Menu Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={handleToggleProfileDropdown}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111C2E] hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="User profile options"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div className="hidden md:block text-left min-w-0 max-w-[120px]">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                      {fullName}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 truncate uppercase">
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Profile Popover Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] shadow-2xl z-50 p-1.5 animate-fadeIn">
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-[#263449]/70 mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Preferences</span>
                    </Link>

                    <div className="pt-1 mt-1 border-t border-slate-100 dark:border-[#263449]/70">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login?portal=user"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111C2E] hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>User Login</span>
              </Link>
              <Link
                to="/login?portal=admin"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-white" />
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
