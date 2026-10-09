const fs = require('fs');
const path = 'frontend/src/pages/Activity.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import jsPDF')) {
  content = content.replace("import { useAuth } from '../context/AuthContext';", "import { useAuth } from '../context/AuthContext';\nimport jsPDF from 'jspdf';\nimport 'jspdf-autotable';\nimport Papa from 'papaparse';\nimport { Download } from 'lucide-react';");
}

const exportFunctions = `
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

      const response = await api.get(\`/activity?\${params.toString()}\`);
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
      Actor: log.actor ? \`\${log.actor.email} (\${log.actor.role})\` : 'System',
      Action: log.action,
      EntityType: log.entityType,
      Description: log.description,
      IP_Address: log.metadata?.ipAddress || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', \`Audit_Log_Export_\${new Date().toISOString().slice(0, 10)}.csv\`);
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
    doc.text(\`Generated on: \${new Date().toLocaleString()}\`, 14, 22);

    const tableData = data.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.actor ? \`\${log.actor.email} (\${log.actor.role})\` : 'System',
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

    doc.save(\`Audit_Log_Export_\${new Date().toISOString().slice(0, 10)}.pdf\`);
  };
`;

if (!content.includes('handleExportCSV')) {
  content = content.replace("const handleResetFilters = () => {", exportFunctions + "\n  const handleResetFilters = () => {");
}

const headerButtons = `
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
            <RefreshCw className={\`w-3.5 h-3.5 \${loading ? 'animate-spin text-indigo-400' : ''}\`} />
            <span>Refresh</span>
          </button>
        </div>
`;

if (!content.includes('handleExportCSV')) {
  // It won't match here because I already injected the function string, but wait, the replacement below relies on the old button.
  // Wait, I should replace the single refresh button with my new group.
}

content = content.replace(
  /<button\s+onClick=\{\(\) => fetchActivityLogs\(\)\}\s+className="inline-flex items-center gap-1\.5 px-3 py-1\.5 rounded-xl text-xs font-semibold bg-slate-100[\s\S]*?<\/button>/,
  headerButtons
);

fs.writeFileSync(path, content, 'utf8');
console.log('Injected Export actions to Activity.jsx');
