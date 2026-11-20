import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

const patterns = [
  /mongodb(?:\+srv)?:\/\/[^\s"'<>/]+:[^\s"'<>/]+@/i,
  /AIza[0-9A-Za-z_-]{35}/,
  /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
test('tracked files contain no credential-bearing MongoDB URIs or common secret formats', () => {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const findings = [];
  for (const file of files) {
    if (file.split('/').some(part => part === 'node_modules' || part === 'dist')) continue;
    const content = readFileSync(file, 'utf8');
    for (const [index, line] of content.split(/\r?\n/).entries()) {
      if (patterns.some(pattern => pattern.test(line))) findings.push(file + ':' + (index + 1));
    }
  }
  assert.deepEqual(findings, [], 'Potential secrets detected at file/line locations (values suppressed).');
});
test('all 80 topic/difficulty groups have ten credential-free questions with valid answers', () => {
  const seed = JSON.parse(readFileSync(new URL('../seeds/question-bank-2026-11-20.json', import.meta.url), 'utf8'));
  assert.equal(seed.questions.length, 800);
  assert.equal(new Set(seed.questions.map(q => q.id)).size, 800);
  const groups = new Map();
  for (const q of seed.questions) {
    const key = q.topic + '|' + q.difficulty;
    groups.set(key, (groups.get(key) || 0) + 1);
    assert.equal(patterns[0].test(JSON.stringify(q)), false);
    if (q.type === 'multiple-choice') {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(Number.isInteger(q.correctOptionIndex) && q.correctOptionIndex >= 0 && q.correctOptionIndex < 4);
    } else assert.ok(q.expectedCommand?.trim());
  }
  assert.equal(groups.size, 80);
  for (const count of groups.values()) assert.equal(count, 10);
});
