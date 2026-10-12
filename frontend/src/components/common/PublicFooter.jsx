import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { BRAND_CONFIG } from '../../config/brand';
import { 
  Layers, 
  Sparkles, 
  Clock, 
  Calendar, 
  CheckSquare, 
  Building2, 
  Info, 
  ShieldCheck, 
  FileText, 
  Mail, 
  HelpCircle, 
  LogIn, 
  ChevronRight,
  Globe
} from 'lucide-react';

export const PublicFooter = ({ onOpenTerms, onOpenPrivacy }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const scrollToSection = (id) => {
    if (isHome) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
  };

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="flex flex-col lg:flex-row justify-between gap-12 mb-14">
          {/* Left - Brand */}
          <div className="max-w-sm">
            <div className="mb-4">
              <BrandLogo variant="full" size="md" linkTo="/" />
            </div>
            
            <div className="flex items-center gap-3 mt-4 mb-6">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
              </a>
              <a href="https://example.com" target="_blank" rel="noopener noreferrer" aria-label="Company Portal" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            </div>

          </div>
          
          {/* Right - Columns: PRODUCT, COMPANY, SUPPORT (Enabled & Interactive) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
            {/* Product Column */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-5 border border-blue-100 dark:border-blue-500/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Product</span>
              </div>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/features" 
                    onClick={() => scrollToSection('features')}
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:translate-x-1"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span>Features Directory</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/attendance" 
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:translate-x-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span>Attendance &amp; Hours</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/leave" 
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:translate-x-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span>Leave Quotas</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/tasks" 
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:translate-x-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span>Task Delegations</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-wider mb-5 border border-violet-100 dark:border-violet-500/20 shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>Company</span>
              </div>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/about" 
                    onClick={() => scrollToSection('about')}
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all hover:translate-x-1"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                    <span>About HRMS Suite</span>
                  </Link>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => onOpenPrivacy ? onOpenPrivacy() : window.location.assign('/privacy')}
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all hover:translate-x-1 text-left cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => onOpenTerms ? onOpenTerms() : window.location.assign('/terms')}
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all hover:translate-x-1 text-left cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                    <span>Terms &amp; Conditions</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-wider mb-5 border border-teal-100 dark:border-teal-500/20 shadow-xs">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Support</span>
              </div>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/contact" 
                    onClick={() => scrollToSection('contact')}
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all hover:translate-x-1"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    <span>Contact Help Desk</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/help" 
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all hover:translate-x-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    <span>Knowledge &amp; FAQ</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/login" 
                    className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all hover:translate-x-1"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    <span>Portal Login</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <p>{BRAND_CONFIG.copyright}</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => onOpenTerms && onOpenTerms()}>Terms</span>
            <span>&bull;</span>
            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => onOpenPrivacy && onOpenPrivacy()}>Privacy</span>
            <span>&bull;</span>
            <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
