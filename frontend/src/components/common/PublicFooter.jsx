import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export const PublicFooter = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
          {/* Left - Brand */}
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-3 mb-4 no-underline">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">HRMS Portal</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Modern workforce management made simple.
            </p>
          </div>
          
          {/* Right - Columns */}
          <div className="flex flex-wrap gap-12 sm:gap-20 md:gap-24">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-4 tracking-wider uppercase">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Features</Link></li>
                <li><Link to="/attendance" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Attendance</Link></li>
                <li><Link to="/leave" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Leave</Link></li>
                <li><Link to="/tasks" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Tasks</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-4 tracking-wider uppercase">Company</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">About</Link></li>
                <li><Link to="/privacy" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Terms</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-4 tracking-wider uppercase">Support</h3>
              <ul className="space-y-3">
                <li><Link to="/contact" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Contact</Link></li>
                <li><Link to="/help" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Help</Link></li>
                <li><Link to="/login" className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Login</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">&copy; {new Date().getFullYear()} HRMS Portal</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
