// Unit tests for the pure logic: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passwordProblem } from '../server/passwordPolicy.js';
import { configProblems } from '../server/config.js';
import { createLimiter } from '../server/rateLimit.js';
import { parseEnv } from '../server/env.js';
import { safeDecode, isLocalRequest, clientIp, setTrustedProxies } from '../server/http.js';
import { classify, stageFrom, parseIst, mergeScans, normalizeScan } from '../server/delivery/status.js';
import { newGuestToken, guestTokenMatches } from '../server/guestOrders.js';
import { matchPath, legacyHashTarget } from '../src/lib/routes.js';

test('weak passwords are refused', () => {
  assert.match(passwordProblem('short'), /at least 8/);
  assert.match(passwordProblem('12345678'), /common/);
  assert.match(passwordProblem('98765432123'), /only numbers/);
  assert.match(passwordProblem('aaaaaaaaaa'), /repetitive/);
  assert.match(passwordProblem('ashaRao2026!', { email: 'asharao@example.com' }), /email/);
  assert.equal(passwordProblem('desert-rose-7'), '');
});

test('the server refuses a weak admin password and an unprotected live webhook', () => {
  assert.ok(configProblems({ ADMIN_EMAIL: 'a@b.co', ADMIN_PASSWORD: 'change-me-please' }).length);
  assert.ok(configProblems({ ADMIN_EMAIL: 'a@b.co', ADMIN_PASSWORD: 'short' }).length);
  assert.deepEqual(configProblems({ ADMIN_EMAIL: 'a@b.co', ADMIN_PASSWORD: 'Camel-Admin-2026!' }), []);
  const live = { ADMIN_EMAIL: 'a@b.co', ADMIN_PASSWORD: 'Camel-Admin-2026!', SHIPROCKET_EMAIL: 'api@b.co', SHIPROCKET_PASSWORD: 'x' };
  assert.ok(configProblems({ ...live, SHIPROCKET_WEBHOOK_TOKEN: 'short' }).length);
  assert.deepEqual(configProblems({ ...live, SHIPROCKET_WEBHOOK_TOKEN: 'x'.repeat(32) }), []);
});

test('rate limiter blocks after max hits and forgets old entries', () => {
  const l = createLimiter({ windowMs: 1000, max: 2 });
  l.take('k');
  l.take('k');
  assert.throws(() => l.take('k'), (e) => e.status === 429);
  l.prune(Date.now() + 5000);
  assert.equal(l.size(), 0);
  assert.doesNotThrow(() => l.take('k'));
});

test('.env parsing keeps $ and # inside quoted values', () => {
  const env = parseEnv("A='p@ss$word#1'\n# comment\nB = plain \nbad line\nC=a=b\r\n");
  assert.deepEqual(env, { A: 'p@ss$word#1', B: 'plain', C: 'a=b' });
});

test('malformed URLs decode to null instead of throwing', () => {
  assert.equal(safeDecode('%E0%A4%A'), null);
  assert.equal(safeDecode('a%20b'), 'a b');
});

test('forwarded-for is only trusted behind a configured proxy', () => {
  const req = { headers: { 'x-forwarded-for': '6.6.6.6, 1.2.3.4' }, socket: { remoteAddress: '9.9.9.9' } };
  setTrustedProxies(0);
  assert.equal(clientIp(req), '9.9.9.9');
  setTrustedProxies(1);
  assert.equal(clientIp(req), '1.2.3.4');
  setTrustedProxies(0);
});

test('local and LAN hosts are recognised (no Secure cookie needed there)', () => {
  for (const host of ['localhost:5173', '127.0.0.1', '192.168.1.4:5173', '10.0.0.2', '172.20.0.1']) {
    assert.equal(isLocalRequest({ headers: { host } }), true, host);
  }
  for (const host of ['quirkycamel.in', '172.40.0.1', '8.8.8.8']) {
    assert.equal(isLocalRequest({ headers: { host } }), false, host);
  }
});

test('Shiprocket statuses map to customer steps', () => {
  assert.deepEqual(classify('OUT FOR DELIVERY'), { stage: 'out' });
  assert.deepEqual(classify('RTO DELIVERED'), { state: 'returned' });
  assert.deepEqual(classify('DELIVERED'), { stage: 'delivered' });
  assert.equal(stageFrom('IN TRANSIT', [], 'picked').stage, 'transit');
  assert.equal(stageFrom('MANIFEST GENERATED', [], 'transit').stage, 'transit', 'progress never goes back');
});

test('Shiprocket dates are Indian time; duplicate scans are dropped', () => {
  assert.equal(parseIst('2023-05-23 15:40:19').toISOString(), '2023-05-23T10:10:19.000Z');
  assert.equal(parseIst('23 05 2023 11:43:52').toISOString(), '2023-05-23T06:13:52.000Z');
  const scan = normalizeScan({ date: '2023-05-19 11:59:16', activity: 'Picked up', location: 'Hub', 'sr-status-label': 'PICKED UP' });
  assert.equal(mergeScans([scan], [scan]).length, 1);
});

test('guest order tokens: only the right token matches', () => {
  const { token, hash } = newGuestToken();
  const order = { guestTokenHash: hash };
  assert.equal(guestTokenMatches(order, token), true);
  assert.equal(guestTokenMatches(order, 'wrong'), false);
  assert.equal(guestTokenMatches({}, token), false);
});

test('store routes and old # links', () => {
  assert.deepEqual(matchPath('/product/the-complete-kit'), { view: 'product', slug: 'the-complete-kit' });
  assert.deepEqual(matchPath('/shop/saved/'), { view: 'shop', saved: true });
  assert.deepEqual(matchPath('/episodes/mirage'), { view: 'episode', episodeId: 'mirage' });
  assert.deepEqual(matchPath('/episodes/nope'), { view: 'notfound' });
  assert.deepEqual(matchPath('/product/%E0%A4%A'), { view: 'notfound' });
  assert.equal(legacyHashTarget('#product/madam-camel'), '/product/madam-camel');
  assert.equal(legacyHashTarget('#mirage'), '/episodes/mirage');
  assert.equal(legacyHashTarget('#kit'), null, 'home section anchors stay as they are');
});
