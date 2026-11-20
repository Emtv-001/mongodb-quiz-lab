// Validate and append locally prepared questions. This script never calls a model.
import { readFile, writeFile } from 'node:fs/promises';
const base = 'https://mongodbquizlab.emtvtech.com';
const seed = JSON.parse(await readFile(new URL('../seeds/question-bank-2026-11-20.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('../src/services/storage.ts', import.meta.url), 'utf8');
const topicBlock = source.split('export const ALL_TOPICS')[1].split('];')[0];
const topics = [...topicBlock.matchAll(/'([^']+)'/g)].map(m => m[1]);
const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
const credentials = /mongodb(?:\+srv)?:\/\/[^\s"'<>/]+:[^\s"'<>/]+@/i;
const questions = seed.questions;
if (questions.length !== 800 || new Set(questions.map(q => q.id)).size !== 800) throw new Error('Expected 800 unique questions.');
if (credentials.test(JSON.stringify(questions))) throw new Error('Credential-bearing content is blocked.');
for (const q of questions) {
  if (!q.title || !q.scenario || !q.databaseName || !q.datasetName || !q.fieldNames?.length || !q.explanation) throw new Error('Incomplete question.');
  if (q.type === 'multiple-choice' && (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4 || !Number.isInteger(q.correctOptionIndex) || q.correctOptionIndex < 0 || q.correctOptionIndex > 3)) throw new Error('Invalid answer options.');
  if (q.type === 'write-command' && !q.expectedCommand?.trim()) throw new Error('Missing expected command.');
}
const coverage = topics.flatMap(topic => difficulties.map(difficulty => ({
  topic, difficulty, prepared: questions.filter(q => q.topic === topic && q.difficulty === difficulty).length
})));
if (coverage.length !== 80 || coverage.some(row => row.prepared < 10)) throw new Error('Incomplete topic/difficulty coverage.');
console.log('Validated 800 questions across all 80 topic/difficulty combinations; no credential-bearing URIs.');
if (!process.argv.includes('--write')) process.exit(0);
async function request(path, body) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(120000),
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) throw new Error('Database API returned HTTP ' + response.status);
  const result = await response.json();
  if (!result.success) throw new Error('Database API rejected request.');
  return result;
}
const existing = (await request('/api/questions')).questions;
if (!Array.isArray(existing)) throw new Error('Invalid database baseline.');
const correctedIds = new Set(JSON.parse(await readFile(new URL('../seeds/corrected-question-ids.json', import.meta.url), 'utf8')));
const ids = new Set(existing.map(q => q.id));
const additions = questions.filter(q => !ids.has(q.id) || correctedIds.has(q.id));
for (let i = 0; i < additions.length; i += 20) {
  await request('/api/questions?mode=append', additions.slice(i, i + 20));
  console.log('Saved/updated ' + Math.min(i + 20, additions.length) + '/' + additions.length);
}
const saved = (await request('/api/questions')).questions;
const byId = new Map(saved.map(q => [q.id, q]));
if (questions.some(q => !byId.has(q.id)) || existing.some(q => !byId.has(q.id))) throw new Error('Database verification failed: IDs missing.');
if (questions.some(q => credentials.test(JSON.stringify(byId.get(q.id))))) throw new Error('Unsafe generated content remains in the database.');
for (const id of correctedIds) {
  if (byId.get(id).title !== questions.find(q => q.id === id).title) throw new Error('Question correction did not persist.');
}
await writeFile(new URL('../seeds/question-bank-verification.json', import.meta.url), JSON.stringify({
  verifiedAt: new Date().toISOString(), databaseTotal: saved.length,
  verifiedSeedQuestions: questions.length, targetSeedQuestions: 800, remainingSeedQuestions: 0,
  preExistingQuestionsPreserved: existing.length, credentialFreeGeneratedQuestions: true,
  coverage: coverage.map(row => ({ ...row, inDatabase: saved.filter(q => q.topic === row.topic && q.difficulty === row.difficulty).length }))
}, null, 2) + '\n');
console.log('Verified all 800 questions and preserved all existing IDs. Database total: ' + saved.length);
