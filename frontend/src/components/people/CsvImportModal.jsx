import React, { useState } from 'react';
import {
  X, Upload, Download, CheckCircle2, AlertTriangle,
  FileSpreadsheet, AlertCircle, ArrowRight
} from 'lucide-react';
import api from '../../api/axios';

export const CsvImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const csvContent =
      'First Name,Last Name,Email,Role,Department,Designation,Phone,Salary\n' +
      'Aarav,Sharma,aarav.sharma@company.com,EMPLOYEE,Engineering,Full Stack Developer,+91 9876543210,850000\n' +
      'Priya,Patel,priya.patel@company.com,MANAGER,Engineering,Engineering Lead,+91 9876543211,1400000\n' +
      'Rohan,Mehta,rohan.mehta@company.com,HR,Human Resources,People Partner,+91 9876543212,900000\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hrms_employee_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV string into objects
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvText(text);
        parseCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const parseCsv = (rawText) => {
    setParseErrors([]);
    setImportResult(null);

    const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setParseErrors(['CSV must have a header row and at least one data record.']);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const rows = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3) {
        errors.push(`Row #${i + 1}: Incomplete row data.`);
        continue;
      }

      const rowObj = {
        firstName: values[0] || '',
        lastName: values[1] || '',
        email: values[2] || '',
        role: values[3] || 'EMPLOYEE',
        department: values[4] || 'Engineering',
        designation: values[5] || 'Specialist',
        phone: values[6] || '',
        salary: values[7] || '0',
      };

      if (!rowObj.email || !rowObj.firstName) {
        errors.push(`Row #${i + 1}: Missing First Name or Email.`);
      }

      rows.push(rowObj);
    }

    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setSubmitting(true);
    setImportResult(null);

    try {
      const res = await api.post('/employees/bulk-import', { employees: parsedRows });
      if (res.data?.success) {
        setImportResult(res.data.data);
        onSuccess();
      }
    } catch (err) {
      setParseErrors([err.response?.data?.message || err.message || 'Import failed.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white m-0">Bulk Personnel Import</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Onboard multiple employees, managers, and HR team members from CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 py-5 space-y-5">
          {/* Action Row: Download Template */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Need the correct column format?</div>
              <div className="text-[11px] text-slate-500">Download the pre-structured Excel/CSV template with demo headers.</div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-sky-500 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-sky-500 block mb-1">Click to select CSV file</span>
              <span className="text-[11px] text-slate-400">Supports comma-separated UTF-8 values</span>
            </label>
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Validation Notices:</span>
              </div>
              <ul className="list-disc pl-5 m-0 space-y-0.5">
                {parseErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Preview ({parsedRows.length} records parsed)
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Designation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-semibold">{r.firstName} {r.lastName}</td>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">{r.email}</td>
                        <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">{r.role}</span></td>
                        <td className="p-2.5">{r.department}</td>
                        <td className="p-2.5">{r.designation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result Feedback */}
          {importResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Import Finished: {importResult.createdCount} accounts provisioned successfully!</span>
              </div>
              {importResult.errorCount > 0 && (
                <div className="text-xs text-rose-500 mt-1">
                  {importResult.errorCount} records were skipped due to conflicts or duplicate emails.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            Close
          </button>

          <button
            onClick={handleExecuteImport}
            disabled={submitting || parsedRows.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Importing {parsedRows.length} records...</span>
            ) : (
              <>
                <span>Import {parsedRows.length} Personnel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal;
