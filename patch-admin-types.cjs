const fs = require('fs');
let code = fs.readFileSync('src/types/admin.ts', 'utf8');

if (!code.includes('maintenanceMode?: boolean;')) {
  code = code.replace(/customTabLabels: Record<string, string>;/, "customTabLabels: Record<string, string>;\n    maintenanceMode?: boolean;");
  fs.writeFileSync('src/types/admin.ts', code);
}
