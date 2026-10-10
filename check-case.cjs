const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
let errors = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(file), importPath);
      let targetPath = '';
      if (fs.existsSync(resolved + '.ts')) targetPath = resolved + '.ts';
      else if (fs.existsSync(resolved + '.tsx')) targetPath = resolved + '.tsx';
      else if (fs.existsSync(resolved + '/index.ts')) targetPath = resolved + '/index.ts';
      else if (fs.existsSync(resolved + '/index.tsx')) targetPath = resolved + '/index.tsx';
      
      if (targetPath) {
        const basename = path.basename(targetPath);
        const dirname = path.dirname(targetPath);
        const actualFiles = fs.readdirSync(dirname);
        if (!actualFiles.includes(basename)) {
          console.log('Case mismatch in ' + file + ': ' + importPath + ' (Resolved to: ' + targetPath + ')');
          errors++;
        }
      }
    }
  }
});
if (errors === 0) console.log('No case mismatches found.');
