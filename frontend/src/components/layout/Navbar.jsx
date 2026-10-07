import React from 'react';
import { Layers, Activity, Server, Database } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white m-0">HRMS Portal</h1>
            <p className="text-xs text-slate-400 m-0">Full-Stack Architecture Scaffolding</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            React 19 + Vite
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            Express API (5001)
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            MongoDB
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
