import React, { useState } from 'react';
import { X, Upload, Download, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import api from '../../api/axios';

const CsvImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('UPLOAD'); // UPLOAD -> PREVIEW -> RESULT
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Results from backend
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = ['firstName', 'lastName', 'email', 'department', 'role', 'designation', 'joiningDate', 'employmentType', 'salary'];
    const sample = ['Jane', 'Doe', 'jane.doe@company.com', 'Engineering', 'EMPLOYEE', 'Software Engineer', '2026-10-15', 'FULL_TIME', '80000'];
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sample.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    
    setIsValidating(true);
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const errors = [];
        
        // Basic frontend validation
        rows.forEach((row, idx) => {
          if (!row.firstName || !row.lastName || !row.email) {
            errors.push({ row: idx + 1, error: 'Missing required fields (firstName, lastName, email)' });
          }
          if (row.email && !/^\\S+@\\S+\\.\\S+$/.test(row.email)) {
            errors.push({ row: idx + 1, error: 'Invalid email format' });
          }
        });
        
        setParsedData(rows);
        setValidationErrors(errors);
        setIsValidating(false);
        setStep('PREVIEW');
      },
      error: (err) => {
        setValidationErrors([{ row: 0, error: 'Failed to parse CSV: ' + err.message }]);
        setIsValidating(false);
        setStep('PREVIEW');
      }
    });
  };

  const handleConfirmImport = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/employees/bulk-import', { employees: parsedData });
      if (res.data?.success) {
        setImportResult(res.data.data);
        setStep('RESULT');
      }
    } catch (err) {
      setImportResult({
        createdCount: 0,
        errorCount: parsedData.length,
        errors: [{ row: 0, error: err.response?.data?.message || err.message }]
      });
      setStep('RESULT');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!importResult?.errors?.length) return;
    const headers = ['Row', 'Email', 'Error'];
    const rows = importResult.errors.map(err => [err.row || '-', err.email || '-', err.error]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(v => `"${(v||'').toString().replace(/"/g, '""')}"`).join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "import_errors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setStep('UPLOAD');
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Bulk Import Employees</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 'UPLOAD' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded shadow-sm border border-slate-200">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">Download Template</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Use this CSV template to format your data.</p>
                  </div>
                </div>
                <button onClick={handleDownloadTemplate} className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
                  <Download className="w-4 h-4" /> Template
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-900 mb-1">Click to upload CSV</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Maximum 500 records recommended.</p>
                <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Select File
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {step === 'PREVIEW' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-900">Data Preview</h3>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                  {parsedData.length} Records
                </span>
              </div>
              
              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Validation Errors Found ({validationErrors.length})</h4>
                    <ul className="text-xs text-red-700 mt-1 space-y-0.5 list-disc pl-4">
                      {validationErrors.slice(0, 3).map((err, i) => (
                        <li key={i}>Row {err.row}: {err.error}</li>
                      ))}
                      {validationErrors.length > 3 && <li>...and {validationErrors.length - 3} more</li>}
                    </ul>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Name</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Email</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Role</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-slate-900">{row.firstName} {row.lastName}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.email}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.role}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <div className="px-4 py-2 bg-slate-50 text-xs text-center text-slate-500 dark:text-slate-400 border-t border-slate-100">
                    Showing 5 of {parsedData.length} records
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'RESULT' && importResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                {importResult.errorCount === 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : importResult.createdCount > 0 ? (
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                ) : (
                  <X className="w-8 h-8 text-red-500" />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Import Complete</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Processed {importResult.createdCount + importResult.errorCount} total records.</p>
              </div>

              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <span className="block text-2xl font-semibold text-emerald-600">{importResult.createdCount}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Imported</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-semibold text-red-600">{importResult.errorCount}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Failed/Skipped</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
          {step === 'UPLOAD' && (
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          )}
          
          {step === 'PREVIEW' && (
            <>
              <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" disabled={isSubmitting}>
                Back
              </button>
              <button 
                onClick={handleConfirmImport} 
                disabled={isSubmitting || parsedData.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 border border-transparent rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Importing...' : 'Confirm Import'}
              </button>
            </>
          )}

          {step === 'RESULT' && (
            <>
              {importResult?.errorCount > 0 && (
                <button onClick={handleDownloadErrorReport} className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download Error Report
                </button>
              )}
              <button onClick={() => { onSuccess(); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal;
