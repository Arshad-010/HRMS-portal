const fs = require('fs');
const path = 'frontend/src/components/dashboard/AdminCommandCenter.jsx';
let content = fs.readFileSync(path, 'utf8');

const originalCard = `<div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between cursor-pointer group" onClick={() => { setDrawerRole('MANAGER'); setIsAddDrawerOpen(true); }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Managers & HR Directory</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Quickly provision new leadership roles</p>
                </div>
              </div>
              <UserPlus className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </div>`;

const newCards = `<div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between cursor-pointer group" onClick={() => { setDrawerRole('MANAGER'); setIsAddDrawerOpen(true); }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Add Manager</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Provision new leadership roles</p>
                </div>
              </div>
              <UserPlus className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between cursor-pointer group" onClick={() => { setDrawerRole('HR'); setIsAddDrawerOpen(true); }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Add HR</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Provision new HR personnel</p>
                </div>
              </div>
              <UserPlus className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </div>`;

if (content.includes('Managers & HR Directory')) {
  content = content.replace(originalCard, newCards);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed HR & Manager cards');
}
