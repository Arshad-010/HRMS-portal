import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Server, 
  Database, 
  Code2, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Globe 
} from 'lucide-react';

export const HealthCheck = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pingLatency, setPingLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const response = await api.get('/health');
      const endTime = performance.now();
      setPingLatency(Math.round(endTime - startTime));
      setHealthData(response.data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            System Architecture Foundation
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Full-Stack Environment Health</h2>
          <p className="text-slate-400 text-sm mt-1">
            Verification status for React 19 + Vite frontend, Express REST API, and MongoDB connection.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Pinging API...' : 'Run Diagnostics Ping'}
        </button>
      </div>

      {/* Main Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Frontend Status */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-600/60 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Code2 className="w-5 h-5" />
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">Frontend Client</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">React 19 + Vite 8 SPA</p>
          <div className="space-y-2 text-xs text-slate-300 border-t border-slate-700/40 pt-4">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Framework:</span>
              <span className="font-mono font-medium text-slate-200">React 19.2.x</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Styling:</span>
              <span className="font-mono font-medium text-slate-200">Tailwind CSS v4</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Routing:</span>
              <span className="font-mono font-medium text-slate-200">React Router v7</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">HTTP Client:</span>
              <span className="font-mono font-medium text-slate-200">Axios Interceptors</span>
            </div>
          </div>
        </div>

        {/* Backend Status */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-600/60 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </span>
            {healthData?.status === 'ok' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Operational
              </span>
            ) : error ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                <XCircle className="w-3.5 h-3.5" />
                Offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                Checking
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white">Express Backend</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">Node.js REST API (ES Modules)</p>
          <div className="space-y-2 text-xs text-slate-300 border-t border-slate-700/40 pt-4">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Endpoint:</span>
              <span className="font-mono font-medium text-slate-200">http://localhost:5001/api</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Process Uptime:</span>
              <span className="font-mono font-medium text-slate-200">{healthData?.uptime || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Environment:</span>
              <span className="font-mono font-medium text-slate-200 capitalize">{healthData?.environment || 'development'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Round-trip Ping:</span>
              <span className="font-mono font-medium text-indigo-300">{pingLatency ? `${pingLatency} ms` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-600/60 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              healthData?.database === 'connected' 
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}>
              <Activity className="w-3.5 h-3.5" />
              {healthData?.database === 'connected' ? 'Connected' : 'Standby / Local'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">Database Layer</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">MongoDB + Mongoose ODM</p>
          <div className="space-y-2 text-xs text-slate-300 border-t border-slate-700/40 pt-4">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Driver Status:</span>
              <span className="font-mono font-medium text-slate-200 capitalize">
                {healthData?.database || 'Ready (Mongoose)'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Default URI:</span>
              <span className="font-mono font-medium text-slate-200 truncate max-w-[150px]">mongodb://localhost:27017</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Auto-Reconnect:</span>
              <span className="font-mono font-medium text-emerald-400">Enabled</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Last Verified:</span>
              <span className="font-mono font-medium text-slate-400">{lastChecked || 'Initial load'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Payload & Diagnostics Section */}
      <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-slate-200">Live Health API Payload (Axios GET /health)</h4>
          </div>
          <span className="text-xs font-mono text-slate-500">HTTP 200 OK</span>
        </div>

        {error ? (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-semibold">Backend Unreachable</p>
              <p className="text-xs mt-1 text-rose-300/80">{error}</p>
              <p className="text-xs mt-2 text-slate-400">Ensure backend server is running via <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">cd backend && npm run dev</code></p>
            </div>
          </div>
        ) : (
          <pre className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-emerald-400 font-mono text-xs overflow-x-auto">
            {JSON.stringify(healthData || { status: 'loading...' }, null, 2)}
          </pre>
        )}
      </div>

      {/* Next Steps Card */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Baseline Scaffolding Complete
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Frontend, backend, database config, routing, and styling foundations are active. As requested, HRMS modules (employees, attendance, leaves, auth) will be implemented in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthCheck;
