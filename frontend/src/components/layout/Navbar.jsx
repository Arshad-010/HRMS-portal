import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  Activity,
  LogOut,
  LogIn,
  LayoutDashboard,
  Users,
  Building2,
  Clock,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'System Health', path: '/health', icon: Activity },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Main Nav */}
        <div className="flex items-center gap-8">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white m-0">HRMS Portal</h1>
              <p className="text-[10px] text-slate-400 m-0">Enterprise HR Suite</p>
            </div>
          </Link>

          {/* Primary Nav Links (when authenticated) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
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
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
          {!isAuthenticated && (
            <Link
              to="/health"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>System Health</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User Identity Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  {user?.employee?.firstName ? user.employee.firstName[0] : user?.email[0].toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight m-0">
                    {user?.employee?.firstName
                      ? `${user.employee.firstName} ${user.employee.lastName}`
                      : user?.email}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono m-0">
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
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
