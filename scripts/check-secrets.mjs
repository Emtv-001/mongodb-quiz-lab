import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const committed = process.argv.includes('--committed');
const run = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const files = run(committed ? ['ls-tree', '-r', '--name-only', '-z', 'HEAD'] : ['ls-files', '-z']).split('\0').filter(Boolean);
const patterns = [
  /mongodb(?:\+srv)?:\/\/[^\s"'<>/]+:[^\s"'<>/]+@/i,
  /AIza[0-9A-Za-z_-]{35}/,
  /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
const findings = [];
for (const file of files) {
  const value = committed ? run(['show', 'HEAD:' + file]) : readFileSync(file, 'utf8');
  for (const [index, line] of value.split(/\r?\n/).entries()) {
    if (patterns.some(pattern => pattern.test(line))) findings.push(file + ':' + (index + 1));
  }
}
if (findings.length) {
  console.error('Push blocked: potential credentials at these locations (values suppressed):');
  for (const finding of findings) console.error(finding);
  process.exit(1);
}
console.log('Secret-pattern check passed for ' + files.length + ' tracked files.');
