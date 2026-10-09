import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { Download } from 'lucide-react';
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Layers,
  CheckCircle,
  XCircle,
  CheckSquare,
  Building2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';

export const Activity = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Metadata detail inspection modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (actionFilter) params.append('action', actionFilter);
      if (entityTypeFilter) params.append('entityType', entityTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/activity?${params.toString()}`);
      if (response.data?.success) {
        setLogs(response.data.data.logs || []);
        setTotalPages(response.data.data.pages || 1);
        setTotalCount(response.data.data.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityTypeFilter, startDate, endDate]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  
  const [isExporting, setIsExporting] = useState(false);

  const fetchExportData = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Fetch up to 1000 for export
      });

      if (actionFilter) params.append('action', actionFilter);
      if (entityTypeFilter) params.append('entityType', entityTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/activity?${params.toString()}`);
      if (response.data?.success) {
        return response.data.data.logs || [];
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch data for export:', err);
      return [];
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    const data = await fetchExportData();
    setIsExporting(false);
    
    if (!data.length) return alert('No data to export');

    const csvData = data.map(log => ({
      Timestamp: new Date(log.createdAt).toLocaleString(),
      Actor: log.actor ? `${log.actor.email} (${log.actor.role})` : 'System',
      Action: log.action,
      EntityType: log.entityType,
      Description: log.description,
      IP_Address: log.metadata?.ipAddress || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Audit_Log_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const data = await fetchExportData();
    setIsExporting(false);

    if (!data.length) return alert('No data to export');

    const doc = new jsPDF('landscape');
    doc.text('HRMS Activity & Audit Log Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = data.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.actor ? `${log.actor.email} (${log.actor.role})` : 'System',
      log.action,
      log.entityType,
      log.description
    ]);

    doc.autoTable({
      head: [['Timestamp', 'Actor', 'Action', 'Entity Type', 'Description']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] } // slate-900
    });

    doc.save(`Audit_Log_Export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleResetFilters = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (action.includes('REJECTED') || action.includes('CANCELLED') || action.includes('DEACTIVATED') || action.includes('DELETED')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (action.includes('COMPLETED')) {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
    if (action.includes('ASSIGNED') || action.includes('STATUS')) {
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'EMPLOYEE':
        return <User className="w-3.5 h-3.5 text-pink-400" />;
      case 'DEPARTMENT':
        return <Building2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'LEAVE':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case 'TASK':
        return <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight m-0">HRMS Activity &amp; Audit Log</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              Immutable chronological record of organizational events, approvals, and mutations
            </p>
          </div>
        </div>

        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => fetchActivityLogs()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Filter by Action</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">All Actions</option>
              <option value="EMPLOYEE_CREATED">Employee Created</option>
              <option value="EMPLOYEE_UPDATED">Employee Updated</option>
              <option value="EMPLOYEE_DEACTIVATED">Employee Deactivated</option>
              <option value="DEPARTMENT_CREATED">Department Created</option>
              <option value="DEPARTMENT_UPDATED">Department Updated</option>
              <option value="DEPARTMENT_DEACTIVATED">Department Deactivated</option>
              <option value="LEAVE_APPLIED">Leave Applied</option>
              <option value="LEAVE_APPROVED">Leave Approved</option>
              <option value="LEAVE_REJECTED">Leave Rejected</option>
              <option value="LEAVE_CANCELLED">Leave Cancelled</option>
              <option value="TASK_CREATED">Task Created</option>
              <option value="TASK_ASSIGNED">Task Assigned</option>
              <option value="TASK_STATUS_CHANGED">Task Status Changed</option>
              <option value="TASK_COMPLETED">Task Completed</option>
              <option value="TASK_DELETED">Task Deleted</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">All Entities</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="DEPARTMENT">Department</option>
              <option value="LEAVE">Leave</option>
              <option value="TASK">Task</option>
              <option value="ATTENDANCE">Attendance</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
        </div>

        {/* Clear Filters & Count */}
        {(actionFilter || entityTypeFilter || startDate || endDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Filtering enabled &bull; Found <strong className="text-slate-900 dark:text-white">{totalCount}</strong> entries
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchActivityLogs}
            className="ml-auto underline hover:text-rose-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-medium">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mx-auto mb-2" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">No Activity Logs Found</p>
                    <p className="text-[11px] text-slate-500 mb-0">Try clearing active filters or check back later.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actorEmp = log.actor?.employee;
                  const actorName = actorEmp
                    ? `${actorEmp.firstName} ${actorEmp.lastName}`
                    : log.actor?.email || 'System';

                  return (
                    <tr key={log._id} className="hover:bg-slate-850/40 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                            {actorName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{actorName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {log.actor?.role || 'SYSTEM'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getEntityIcon(log.entityType)}
                          <span className="font-medium text-slate-700 dark:text-slate-300">{log.entityType}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                        <p className="truncate m-0" title={log.description}>
                          {log.description}
                        </p>
                      </td>

                      {/* Details button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            title="Inspect Metadata"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="py-3 px-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Total Records: <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong></span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Audit Event Metadata
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono">
              Action: <span className="text-indigo-400 font-semibold">{selectedLog.action}</span> &bull; Entity ID: {selectedLog.entityId}
            </p>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 mb-4 max-h-64 overflow-y-auto">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap m-0">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activity;
