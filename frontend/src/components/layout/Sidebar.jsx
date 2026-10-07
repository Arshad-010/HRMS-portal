import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard, Clock, Calendar, CheckSquare,
  Users, Building2, MessageSquare, Bell, History,
  Settings, User, Layers, X
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen, isCollapsed }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  if (!isAuthenticated) return null;

  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
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
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
          isActive
            ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:bg-slate-800'
        }`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
        
        {!isCollapsed && (
          <span className="truncate flex-1">{link.name}</span>
        )}

        {/* Badge */}
        {link.badge > 0 && (
          <span className={`flex items-center justify-center text-[10px] font-bold rounded-full ${
            isCollapsed 
              ? 'absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white shadow-sm'
              : 'px-2 py-0.5 bg-rose-500 text-white shadow-sm'
          }`}>
            {link.badge > 99 ? '99+' : link.badge}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {link.name}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[72px]' : 'w-64'}
        `}
      >
        {/* Header / Branding */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 shrink-0 justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden no-underline" onClick={() => setIsMobileOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate m-0">HRMS Portal</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 m-0 leading-tight">Enterprise HR Suite</p>
              </div>
            )}
          </Link>
          
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-6 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="px-3">
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.title}
                </h3>
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

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-1">
          {bottomLinks.map(renderLink)}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
