import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

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

for (const referred of [false, true]) {
  test(`new account keeps welcome bonuses (referral: ${referred})`, async () => {
    const referrer = { username: 'friend', referrals: [], async save() {} };
    let calls = 0;
    const handler = load('../api/auth/_register.ts', {
      '../_utils/db.js': { default: async () => {} },
      '../_models/Learner.js': { default: {
        async findOne() { return calls++ === 0 ? null : referrer; },
        async create(user) { return user; }
      } }
    }).default;
    const res = { status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: 'POST', body: {
      email: 'new@example.test', username: 'newlearner', passwordHash: 'test', recoveryPhrase: 'test',
      referralCode: referred ? 'REF-FRIEND' : undefined
    } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.data.user.xp, referred ? 500 : 250);
    assert.equal(res.data.user.coins, referred ? 250 : 100);
    assert.equal(res.data.user.referralCount, 0);
    assert.deepEqual(res.data.user.referrals, []);
    if (referred) {
      assert.equal(referrer.referrals[0].currentXp, 500);
      assert.equal(referrer.referrals[0].currentCoins, 250);
    }
  });
}

test('signup discards guest history and initializes empty progress', () => {
  const memory = () => {
    const data = new Map();
    return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  };
  globalThis.localStorage = memory();
  globalThis.sessionStorage = memory();
  globalThis.window = { dispatchEvent() {} };
  const storage = load('../src/services/storage.ts', {
    './security': { getOrCreateLearnerIdentity: () => ({ pseudonym: 'guest' }), computeProgressDigest: () => 'test' }
  });
  sessionStorage.setItem(storage.GUEST_SESSION_PROGRESS_KEY, JSON.stringify({ questionsAttempted: 99 }));
  storage.initializeNewLearnerProgress('new-id', 'New learner');
  const progress = JSON.parse(localStorage.getItem(storage.REGISTERED_PROGRESS_PREFIX + 'new-id'));
  assert.equal(progress.questionsAttempted, 0);
  assert.equal(progress.currentStreak, 0);
  assert.equal(progress.totalScore, 0);
  assert.deepEqual(progress.completedSessions, []);
  assert.equal(sessionStorage.getItem(storage.GUEST_SESSION_PROGRESS_KEY), null);
});

test('welcome and referral bonuses do not raise levels, but learning does', () => {
  const memory = () => {
    const data = new Map();
    return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  };
  globalThis.localStorage = memory();
  globalThis.sessionStorage = memory();
  const service = load('../src/services/learnerService.ts', {
    './adminService': {}, './security': {}, './storage': {}, './emailService': {}
  });
  const progress = { questionsAttempted: 0, questionsCorrect: 0, currentStreak: 0, completedSessions: [] };
  for (const referral of [false, true]) {
    service.saveRegisteredLearnerAccount({ id: 'new', xp: referral ? 500 : 250, coins: referral ? 250 : 100,
      referralBonusXp: referral ? 250 : 0, referralBonusCoins: referral ? 150 : 0 });
    const stats = service.getLearnerGamificationStats(progress);
    assert.equal(stats.rank, 1);
    assert.equal(stats.levelXp, 0);
    assert.equal(stats.xp, referral ? 500 : 250);
    assert.equal(stats.coins, referral ? 250 : 100);
    const earned = service.getLearnerGamificationStats({ ...progress, questionsAttempted: 4, questionsCorrect: 4 });
    assert.equal(earned.rank, 2);
    assert.equal(earned.levelXp, 100);
    assert.equal(earned.xp, stats.xp + 100);
  }
});
