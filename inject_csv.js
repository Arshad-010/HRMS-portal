const fs = require('fs');
const path = 'frontend/src/components/dashboard/AdminCommandCenter.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('CsvImportModal')) {
  content = content.replace("import EmptyState from '../common/EmptyState';", "import EmptyState from '../common/EmptyState';\nimport CsvImportModal from '../people/CsvImportModal';");
}

if (!content.includes('isImportModalOpen')) {
  content = content.replace("const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);", "const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);\n  const [isImportModalOpen, setIsImportModalOpen] = useState(false);");
}

const newPeopleGrid = `            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between cursor-pointer group" onClick={() => setIsImportModalOpen(true)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded flex items-center justify-center text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Import Employees (CSV)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Bulk upload personnel data</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
            </div>`;

if (!content.includes('Import Employees (CSV)')) {
  content = content.replace("</div>\n        </div>\n      )}", newPeopleGrid + "\n          </div>\n        </div>\n      )}");
}

const modalMarkup = `      <CsvImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={fetchDashboardData} 
      />`;

if (!content.includes('<CsvImportModal')) {
  content = content.replace('{/* Quick Add Person Drawer */}', modalMarkup + '\n\n      {/* Quick Add Person Drawer */}');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Injected CsvImportModal to AdminCommandCenter.jsx');
