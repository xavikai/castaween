import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { Presence, STATUS_PAGE } from '../presence.js';
import { Room } from '../worker.js';

class Storage {
  data = new Map();
  async get(key) { return structuredClone(this.data.get(key)); }
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) { this.data.delete(key); }
  async list({ prefix = '', reverse = false, limit = 1000, startAfter } = {}) {
    let entries = [...this.data].filter(([key]) => key.startsWith(prefix) && (!startAfter || key > startAfter)).sort(([a], [b]) => a.localeCompare(b));
    if (reverse) entries.reverse();
    return new Map(structuredClone(entries.slice(0, limit)));
  }
  async transaction(fn) { return fn(this); }
}
const report = (store, sessions, open = true) => store.fetch(new Request('https://presence/report', {
  method: 'POST', body: JSON.stringify({ code: '1234', open, jugadors: 1, sessions })
}));

test('session arrival, role changes, departure and reconnect preserve exact durations across hibernation', async t => {
  let now = Date.parse('2026-10-27T09:00:00Z');
  t.mock.method(Date, 'now', () => now);
  const storage = new Storage(); let store = new Presence({ storage });
  const host = { id: 'host-1', inici: now, tipus: 'professor' };
  await report(store, [host]);
  now += 10000;
  const client = { id: 'client-1', inici: now, tipus: 'entrant' };
  await report(store, [host, client]);
  now += 10000; client.tipus = 'jugador';
  await report(store, [host, client]);
  store = new Presence({ storage }); now += 60000;
  let data = await store.summary(true);
  assert.equal(data.sessions.length, 2);
  assert.equal(data.sessions[0].inici, client.inici);
  assert.equal(data.sessions[0].durada, 70000);
  assert.equal(data.sessions[0].tipus, 'jugador');
  await report(store, [host]);
  now += 30000;
  data = await store.summary(true);
  assert.equal(data.sessions.find(s => s.id === client.id).durada, 70000, 'closed duration stops increasing');
  const reconnect = { id: 'client-2', inici: now, tipus: 'espectador' };
  await report(store, [host, reconnect]);
  now += 5000; await report(store, [], false);
  data = await store.summary(true);
  assert.equal(data.total, 0);
  assert.equal(data.sessions.length, 3);
  assert.ok(data.sessions.every(s => s.fi !== null));
  assert.equal(data.sessions.find(s => s.id === reconnect.id).durada, 5000);
  assert.equal(data.sessions.find(s => s.id === host.id).durada, 115000);
});

test('old reports remain compatible, invalid metadata is excluded and stale sessions have approximate ends', async t => {
  let now = Date.parse('2026-10-27T09:00:00Z'); t.mock.method(Date, 'now', () => now);
  const store = new Presence({ storage: new Storage() });
  await report(store, undefined);
  assert.deepEqual((await store.summary(true)).sessions, []);
  const valid = { id: 'client', inici: now, tipus: 'jugador' };
  await report(store, [valid, { ...valid, id: '<script>' }, { ...valid, inici: now + 1 }]);
  assert.equal((await store.summary(true)).sessions.length, 1);
  now += 3 * 3600000 + 1;
  const data = await store.summary(true);
  assert.equal(data.total, 0);
  assert.equal(data.sessions[0].aproximada, true);
  assert.equal(data.sessions[0].durada, 0, 'unknown time is not counted as connected');
});

test('retention removes expired history across storage pages and preserves active sessions', async t => {
  const now = Date.parse('2026-10-27T09:00:00Z'); t.mock.method(Date, 'now', () => now);
  const storage = new Storage(), store = new Presence({ storage });
  for (let i = 0; i < 1002; i++) await storage.put('sessio:2026-01-01T09:00:00.000Z:' + String(i).padStart(4, '0'), { fi: now - 86400000 });
  await storage.put('sessio:2026-01-01T09:00:00.000Z:active', { fi: null });
  await store.prune('2026-10-27');
  assert.equal((await storage.list({ prefix: 'sessio:' })).size, 1);
});

test('room reports anonymous timestamps and roles from socket attachments after hibernation', async () => {
  const attachments = [
    { id: 'h', role: 'host', connectedAt: 1000, code: '1234' },
    { id: 'a', role: 'client', connectedAt: 2000, joined: true, spectator: true, nom: 'Private name' }
  ];
  const sockets = attachments.map(a => ({ readyState: 1, deserializeAttachment: () => a }));
  let body;
  const env = { PRESENCE: { idFromName: x => x, get: () => ({ fetch: async (_, options) => { body = JSON.parse(options.body); } }) } };
  const room = new Room({ getWebSockets: () => sockets }, env); room._code = attachments[0].code;
  await room.report();
  assert.equal(body.sessions[0].tipus, 'professor');
  assert.equal(body.sessions[1].tipus, 'espectador');
  assert.equal(body.sessions[1].inici, 2000);
  assert.ok(!JSON.stringify(body).includes('Private name'));
});

test('status page script parses and shows Madrid timestamps, active and closed durations', () => {
  const script = STATUS_PAGE.match(/<script>([\s\S]*?)<\/script>/)[1];
  new vm.Script(script);
  const nodes = new Map();
  const context = vm.createContext({ document: { getElementById: id => { if (!nodes.has(id)) nodes.set(id, {}); return nodes.get(id); } }, setInterval() {} });
  vm.runInContext(script.replace('tick();setInterval(tick,5000);', ''), context);
  assert.equal(vm.runInContext('durada(3661000)', context), '1 h 1 min 1 s');
  assert.match(vm.runInContext("hora(Date.parse('2026-10-27T09:00:00Z'))", context), /10:00:00/);
});
