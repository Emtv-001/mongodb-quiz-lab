const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminBrandingConfig.tsx', 'utf8');

const maintenanceUI = `
          {/* Maintenance Mode Toggle */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <span className="text-rose-400">🚨</span>
              <span>Site Status</span>
            </h3>
            <div 
              onClick={() => setConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
              className={\`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center \${config.maintenanceMode ? 'bg-rose-950/40 border-rose-500/50' : 'bg-slate-950/50 border-slate-800'}\`}
            >
              <div>
                <div className={\`font-bold \${config.maintenanceMode ? 'text-rose-400' : 'text-slate-300'}\`}>
                  Global Maintenance Mode
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  When enabled, all learners will be locked out of the site and see a maintenance screen. Admin portal remains accessible.
                </div>
              </div>
              <div className={\`px-3 py-1 rounded-full text-[10px] font-bold uppercase \${config.maintenanceMode ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}\`}>
                {config.maintenanceMode ? 'ACTIVE' : 'OFF'}
              </div>
            </div>
          </div>
`;

code = code.replace(/<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">\s*<h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">/, maintenanceUI + '\n          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">\n            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">');

fs.writeFileSync('src/components/admin/AdminBrandingConfig.tsx', code);
