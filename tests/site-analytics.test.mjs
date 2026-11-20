import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, imports = {}) {
  const module = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: false }
  });
  new Function('require', 'module', 'exports', outputText)(
    name => Object.hasOwn(imports, name) ? imports[name] : require(name), module, module.exports
  );
  return module.exports;
}
function response() {
  return {
    headers: {}, code: 200,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
    end() { return this; }
  };
}

process.env.ADMIN_SESSION_SECRET = 'local-test-only';
const session = load('../api/_utils/analyticsSession.ts');
const id = '0123456789abcdef01234567';
const cookieResponse = response();
session.setAnalyticsSession(cookieResponse, id, 'test-password-hash');
const cookie = cookieResponse.headers['Set-Cookie'].split(';')[0];

test('analytics session rejects tampering and a changed password hash', () => {
  assert.match(cookieResponse.headers['Set-Cookie'], /HttpOnly; SameSite=Strict; Secure/);
  assert.equal(session.readAnalyticsSession({ headers: { cookie } }).authenticates('test-password-hash'), true);
  assert.equal(session.readAnalyticsSession({ headers: { cookie } }).authenticates('different'), false);
  const tampered = cookie.replace(id, '1123456789abcdef01234567');
  assert.equal(session.readAnalyticsSession({ headers: { cookie: tampered } }).authenticates('test-password-hash'), false);
});

test('records and classifies visits and shares, deduplicates event IDs, guards reports', async () => {
  const events = new Map();
  const chain = result => ({ select() { return this; }, async lean() { return result; } });
  const admin = { passwordHash: 'test-password-hash', role: 'super-admin', status: 'active' };
  const handler = load('../api/admin/_analytics.ts', {
    '../_models/Admin.js': { default: { findById: () => chain(admin) } },
    '../_models/Learner.js': { default: {
      findOne: ({ referralCode }) => chain(referralCode === 'REF-VALID' ? { referralCode } : null),
      find: () => chain([{ referralCode: 'REF-VALID', username: 'learner' }])
    } },
    '../_models/SiteEvent.js': { default: {
      async create(event) {
        if (events.has(event._id)) throw Object.assign(new Error(), { code: 11000 });
        events.set(event._id, event);
      },
      async aggregate(pipeline) {
        assert.ok(pipeline[0].$match.createdAt.$gte instanceof Date);
        return [{ counts: [], leaders: [{ _id: 'REF-VALID', visits: 1 }] }];
      }
    } },
    '../_utils/db.js': { default: async () => {} },
    '../_utils/analyticsSession.js': session
  }).default;
  async function call(method, body, headers = {}) {
    return handler({ method, headers, body }, response());
  }
  const eventId = number => '00000000-0000-0000-0000-00000000000' + number;
  assert.equal((await call('POST', { id: eventId(1), kind: 'visit', referral: 'ref-valid' })).code, 204);
  await call('POST', { id: eventId(1), kind: 'visit', referral: 'ref-valid' });
  await call('POST', { id: eventId(2), kind: 'visit' });
  await call('POST', { id: eventId(3), kind: 'visit', referral: 'unknown' });
  await call('POST', { id: eventId(4), kind: 'share', method: 'whatsapp' });
  assert.deepEqual([...events.values()].map(event => event.channel), ['referral', 'non-referral', 'unknown-referral', 'whatsapp']);
  assert.equal(events.get(eventId(3)).referralCode, undefined);
  assert.equal((await call('POST', { id: eventId(5), kind: 'share', method: 'unknown' })).code, 400);
  assert.equal((await call('GET')).code, 401);
  assert.deepEqual((await call('GET', null, { cookie })).data.leaders, [{ code: 'REF-VALID', visits: 1, username: 'learner' }]);
  admin.role = 'viewer';
  assert.equal((await call('GET', null, { cookie })).code, 403);
});
