import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { createRequire } from 'node:module';

function load(path, imports) {
  const module = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: false }
  });
  new Function('require', 'module', 'exports', outputText)(name => {
    if (!(name in imports)) throw new Error('Unexpected dependency: ' + name);
    return imports[name];
  }, module, module.exports);
  return module.exports;
}
const id = '0123456789abcdef01234567';

test('progress session rejects forged and expired cookies and changed passwords', () => {
  process.env.ADMIN_SESSION_SECRET = 'test-only';
  const session = load('../api/_utils/learnerSession.ts', { 'node:crypto': createRequire(import.meta.url)('node:crypto') });
  let cookie;
  session.setLearnerSession({ setHeader: (_name, value) => { cookie = value; } }, id, 'hash');
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
  const headers = { cookie: cookie.split(';')[0] };
  assert.equal(session.readLearnerSession({ headers }).authenticates('hash'), true);
  assert.equal(session.readLearnerSession({ headers }).authenticates('wrong'), false);
  assert.equal(session.readLearnerSession({ headers: { cookie: headers.cookie.replace(id, '1123456789abcdef01234567') } }).authenticates('hash'), false);
  assert.equal(session.readLearnerSession({ headers: { cookie: headers.cookie.replace(headers.cookie.split('.')[1], '1000000000') } }), undefined);
});

test('database zeros and complete review records replace browser data without local writes', async () => {
  globalThis.localStorage = { getItem() { throw new Error('Browser progress must never be read'); }, setItem() { throw new Error('Browser progress must never be written'); } };
  globalThis.sessionStorage = { getItem: () => id };
  globalThis.window = { dispatchEvent() {} };
  const review = { id: 'quiz', questions: [{ id: 'q' }], attempts: { q: { answer: 'a' } } };
  let written;
  globalThis.fetch = async (_url, options) => {
    if (options.method === 'POST') written = JSON.parse(options.body);
    return { ok: true, json: async () => ({ success: true, progress: {
      learnerId: id, questionsAttempted: 0, questionsCorrect: 0,
      activeSession: review, completedSessions: [{ id: 'finished' }],
      bookmarkedQuestionIds: ['q'], masteredFlashcardIds: ['f'], spacedRepetition: { q: { intervalDays: 5 } }
    } }) };
  };
  const storage = load('../src/services/storage.ts', {
    './security': { getOrCreateLearnerIdentity: () => ({ pseudonym: 'learner' }), computeProgressDigest: () => 'test' }
  });
  await assert.rejects(storage.persistDatabaseProgress(), /not loaded/);
  await storage.fetchDatabaseProgress();
  const progress = storage.loadProgress();
  assert.equal(progress.questionsAttempted, 0);
  assert.equal(typeof progress.learnerId, 'object');
  assert.deepEqual(progress.activeSession, review);
  assert.deepEqual(progress.bookmarkedQuestionIds, ['q']);
  assert.deepEqual(progress.masteredFlashcardIds, ['f']);
  assert.equal(progress.spacedRepetition.q.intervalDays, 5);
  await storage.persistDatabaseProgress(100, 250);
  assert.equal(written.learnerId, id);
  assert.deepEqual(written.progressData.activeSession, review);
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ success: false }) });
  await assert.rejects(storage.persistDatabaseProgress(), /could not be saved/);
  await assert.rejects(storage.fetchDatabaseProgress(), /Could not load/);
});

test('progress writes cannot replace ownership or database identifiers', async () => {
  let update;
  const handler = load('../api/learners/progress.ts', {
    '../_utils/db.js': { default: async () => {} },
    '../_utils/learnerSession.js': { readLearnerSession: () => ({ id, authenticates: () => true }), clearLearnerSession() {} },
    '../_models/Progress.js': { default: { findOneAndUpdate: async (filter, value) => { update = { filter, value }; return {}; } } },
    '../_models/Learner.js': { default: { findById: async () => ({ passwordHash: 'test', async save() {} }) } }
  }).default;
  const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } });
  const res = response();
  await handler({ headers: {}, method: 'POST', body: { learnerId: id, progressData: { learnerId: 'different', _id: 'override', questionsAttempted: 0 } } }, res);
  assert.equal(res.code, 200);
  assert.equal(update.filter.learnerId, id);
  assert.equal(update.value.$set.learnerId, undefined);
  assert.equal(update.value.$set._id, undefined);
  assert.equal(update.value.$set.questionsAttempted, 0);
  const denied = response();
  await handler({ headers: {}, method: 'GET', query: { learnerId: 'another-user' } }, denied);
  assert.equal(denied.code, 401);
});
