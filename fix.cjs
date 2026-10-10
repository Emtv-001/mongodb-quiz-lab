const fs = require('fs');
let code = fs.readFileSync('src/services/adminService.ts', 'utf8');

code = code.replace(
  /export async function getDeletionStatements\(\): Promise<DeletionStatement\[\]> \{\s*try \{\s*const res = await fetch\('\/api\/admin\/statements'\);\s*if \(!res\.ok\) return \[\];\s*return await res\.json\(\);\s*\}\s*catch \(err\) \{/g,
  `export async function getDeletionStatements(): Promise<DeletionStatement[]> {
  try {
    const res = await fetch('/api/admin/statements');
    if (!res.ok) return [];
    const data = await res.json();
    return data.statements || [];
  } catch (err) {`
);

fs.writeFileSync('src/services/adminService.ts', code);
