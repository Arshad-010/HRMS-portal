import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard, Clock, Calendar, CheckSquare,
  Users, Building2, MessageSquare, Bell, History,
  Settings, User, Layers, X, BarChart3, Award,
  Sparkles, ShieldCheck, ChevronRight
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen, isCollapsed }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  if (!isAuthenticated) return null;

  const isAdmin = user?.role === 'ADMIN';
  const isHR = user?.role === 'HR';

  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', path: '/analytics', icon: BarChart3, isNew: true },
        { name: 'Attendance', path: '/attendance', icon: Clock },
        { name: 'Leaves', path: '/leaves', icon: Calendar },
        { name: 'Tasks', path: '/tasks', icon: CheckSquare },
      ]
    },
    {
      title: 'WORKFORCE',
      items: [
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Departments', path: '/departments', icon: Building2 },
        { name: 'Performance', path: '/performance', icon: Award, isNew: true },
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { name: 'Chat', path: '/chat', icon: MessageSquare },
        { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
      ]
    },
    {
      title: 'ACTIVITY',
      items: [
        { name: 'Activity', path: '/activity', icon: History },
      ]
    }
  ];

  const bottomLinks = [
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const renderLink = (link) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.path || 
      (link.path !== '/dashboard' && location.pathname.startsWith(link.path));

    return (
      <Link
        key={link.path}
        to={link.path}
        onClick={() => setIsMobileOpen(false)}
        title={isCollapsed ? link.name : undefined}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 group relative ${
          isActive
            ? 'bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/30 border border-sky-400/40 ring-1 ring-white/10'
            : 'text-slate-300 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-slate-800/80 dark:hover:bg-slate-800/80 hover:translate-x-1 border border-transparent'
        }`}
      >
        {/* Active glowing accent indicator bar (hidden when collapsed) */}
        {isActive && !isCollapsed && (
          <div className="w-1.5 h-4.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] shrink-0" />
        )}

        <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${
          isActive 
            ? 'text-white drop-shadow-sm scale-105' 
            : 'text-slate-400 dark:text-slate-400 group-hover:text-sky-400 group-hover:scale-110'
        }`} />
        
        {!isCollapsed && (
          <span className="truncate flex-1 tracking-wide">{link.name}</span>
        )}

        {/* Feature Pill badge (e.g. New for Analytics / Performance) */}
        {!isCollapsed && link.isNew && !isActive && (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
            PRO
          </span>
        )}

        {/* Unread notification Badge */}
        {link.badge > 0 && (
          <span className={`flex items-center justify-center text-[10px] font-black rounded-full shadow-md ${
            isCollapsed 
              ? 'absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white'
              : 'px-2 py-0.5 bg-rose-500 text-white shadow-rose-500/30'
          }`}>
            {link.badge > 99 ? '99+' : link.badge}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700/80 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
            {link.name}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-slate-800/90 flex flex-col transition-all duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'w-64'}`}
      >
        {/* Header / Branding with High Contrast */}
        <div className="h-18 flex items-center px-4 border-b border-slate-200 dark:border-slate-800/90 shrink-0 justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden no-underline" onClick={() => setIsMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-400/20 shrink-0">
              <Layers className="w-5 h-5 drop-shadow-xs" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate m-0">
                    HRMS Portal
                  </h1>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    {user?.role || 'PRO'}
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 m-0 leading-tight">
                  Executive HR Suite
                </p>
              </div>
            )}
          </Link>
          
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-5 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="px-3">
              {!isCollapsed && (
                <div className="flex items-center gap-2 px-3 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80 shadow-[0_0_6px_rgba(56,189,248,0.7)]" />
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-sky-400 dark:text-sky-400 m-0">
                    {group.title}
                  </h3>
                </div>
              )}
              {isCollapsed && (
                <div className="w-full flex justify-center mb-2">
                  <div className="w-4 border-t border-slate-300 dark:border-slate-700" />
                </div>
              )}
              <div className="space-y-1">
                {group.items.map(renderLink)}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom User Card & Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/90 shrink-0 bg-slate-50/50 dark:bg-slate-950/60 space-y-2">
          {!isCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md">
                    {user?.employee?.firstName ? user.employee.firstName[0] : (user?.email ? user.email[0].toUpperCase() : 'A')}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse shadow-[0_0_6px_#34d399]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate">
                    {user?.employee?.firstName ? `${user.employee.firstName} ${user.employee.lastName || ''}` : (user?.email?.split('@')[0] || 'Admin')}
                  </span>
                  <span className="text-[10px] text-sky-400 font-semibold block truncate">
                    {user?.role || 'Administrator'} • Online
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {bottomLinks.map(renderLink)}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
