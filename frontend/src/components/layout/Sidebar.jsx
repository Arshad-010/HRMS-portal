import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { BrandLogo, BrandSymbol } from '../common/BrandLogo';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  CheckSquare,
  Users,
  Building2,
  MessageSquare,
  Bell,
  History,
  Settings,
  User,
  BarChart3,
  Award,
  Sparkles,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen, isCollapsed }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { totalUnreadChatCount } = useChat();

  if (!isAuthenticated) return null;

  const isAdmin = user?.role === 'ADMIN';
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';

  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        ...(isAdmin || isHR ? [{ name: 'Analytics', path: '/analytics', icon: BarChart3, isNew: true }] : []),
        { name: 'Attendance', path: '/attendance', icon: Clock },
        { name: 'Leaves', path: '/leaves', icon: Calendar },
        { name: 'Tasks', path: '/tasks', icon: CheckSquare },
      ],
    },
    {
      title: 'WORKFORCE',
      items: [
        {
          name: user?.role === 'EMPLOYEE' ? 'My Team' : 'Employees',
          path: user?.role === 'EMPLOYEE' ? '/my-team' : '/employees',
          icon: Users,
        },
        { name: 'Departments', path: '/departments', icon: Building2 },
        ...(isAdmin || isHR
          ? [
              { name: 'Team Management', path: '/team-management', icon: Sparkles, isNew: true },
              { name: 'Performance', path: '/performance', icon: Award, isNew: true },
            ]
          : []),
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { name: 'Chat', path: '/chat', icon: MessageSquare, badge: totalUnreadChatCount, badgeColor: 'bg-blue-600 text-white shadow-blue-600/30' },
        { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount, badgeColor: 'bg-rose-500 text-white shadow-rose-500/30' },
      ],
    },
    ...(isAdmin || isHR
      ? [
          {
            title: 'GOVERNANCE',
            items: [{ name: 'Audit & Activity', path: '/activity', icon: History }],
          },
        ]
      : []),
  ];

  const bottomLinks = [
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const renderLink = (link) => {
    const Icon = link.icon;
    const isActive =
      location.pathname === link.path ||
      (link.path !== '/dashboard' && location.pathname.startsWith(link.path));

    return (
      <Link
        key={link.path}
        to={link.path}
        onClick={() => setIsMobileOpen(false)}
        title={isCollapsed ? link.name : undefined}
        className={`flex items-center ${
          isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3.5 py-2.5'
        } rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 group relative cursor-pointer no-underline ${
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-500'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
        }`}
      >
        {/* Active Indicator Notch */}
        {isActive && !isCollapsed && (
          <div className="w-1.5 h-4.5 rounded-full bg-white shadow-sm shrink-0" />
        )}

        <Icon
          className={`w-4.5 h-4.5 shrink-0 transition-transform duration-150 ${
            isActive
              ? 'text-white'
              : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-105'
          }`}
        />

        {!isCollapsed && <span className="truncate flex-1 tracking-tight">{link.name}</span>}

        {/* Feature badge */}
        {!isCollapsed && link.isNew && !isActive && (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            PRO
          </span>
        )}

        {/* Notification badge */}
        {link.badge > 0 && (
          <span
            className={`flex items-center justify-center text-[10px] font-black rounded-full shadow-md ${
              link.badgeColor || 'bg-rose-500 text-white shadow-rose-500/30'
            } ${
              isCollapsed
                ? 'absolute -top-1 -right-1 w-4.5 h-4.5'
                : 'px-1.5 py-0.5 min-w-4.5 h-4.5'
            }`}
          >
            {link.badge > 99 ? '99+' : link.badge}
          </span>
        )}

        {/* Floating tooltip for collapsed view */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
            {link.name}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        )}
      </Link>
    );
  };

  const employee = user?.employee;
  const fullName = employee?.firstName
    ? `${employee.firstName} ${employee.lastName || ''}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-[#111C2E] border-r border-slate-200 dark:border-[#263449] flex flex-col transition-all duration-200 ease-in-out shadow-sm select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Brand Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-[#263449]/80 shrink-0">
          {isCollapsed ? (
            <div className="mx-auto">
              <BrandSymbol size="md" hasGlow={true} />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <BrandLogo variant="horizontal" size="md" linkTo="/dashboard" />
            </div>
          )}
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {group.title}
                </div>
              )}
              {group.items.map(renderLink)}
            </div>
          ))}
        </div>

        {/* Bottom Navigation & User Profile Card */}
        <div className="p-3 border-t border-slate-200/80 dark:border-[#263449]/80 space-y-2 shrink-0 bg-slate-50/60 dark:bg-[#0B1220]/40">
          <div className="space-y-1">{bottomLinks.map(renderLink)}</div>

          {/* User Profile Pill */}
          {!isCollapsed ? (
            <div className="pt-2 border-t border-slate-200/60 dark:border-[#263449]/60 flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white dark:bg-[#111C2E] border border-slate-200/80 dark:border-[#263449]/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                  {employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {fullName}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate uppercase">
                    {user?.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Log out of HRMS"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={logout}
              title="Log out"
              className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
