import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../../assets/local-session.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  let time = 0, serial = 0, online = true, beat;
  const storage = { value: null, getItem() { return this.value; }, setItem(_, value) { this.value = value; } };
  const sent = [], context = vm.createContext({}); vm.runInContext(source, context);
  const options = { storage, clock: () => time, wall: () => 1793091600000 + time,
    uuid: () => 'session-' + (++serial), every: fn => { beat = fn; return 1; }, cancel: () => { beat = null; },
    url: async () => 'https://relay.example', send: async (_, body) => { if (!online) throw Error('offline'); sent.push(JSON.parse(body)); return { ok: true }; } };
  return { create: () => context.createLocalSessionTracker(options), sent, storage,
    advance(ms) { time += ms; }, beat() { beat?.(); }, online(value) { online = value; } };
}

test('local time excludes pauses and results, and each round receives a separate session', async () => {
  const f = fixture(), tracker = f.create(); await settle();
  tracker.start(); await settle(); f.advance(30000); tracker.pause(); await settle();
  assert.equal(f.sent.at(-1).durada, 30000);
  f.advance(120000); f.beat(); await settle();
  assert.equal(f.sent.at(-1).durada, 30000);
  assert.equal(f.sent.at(-1).estat, 'pausa');
  tracker.resume(); f.advance(15000); tracker.finish(); await settle();
  assert.equal(f.sent.at(-1).durada, 45000);
  assert.equal(f.sent.at(-1).estat, 'acabada');
  const id = f.sent.at(-1).id;
  f.advance(60000); f.beat(); await settle();
  assert.equal(f.sent.at(-1).durada, 45000);
  tracker.start(); await settle();
  assert.notEqual(f.sent.at(-1).id, id); assert.equal(f.sent.at(-1).durada, 0);
});

test('offline departure is saved and sent after a new page reconnects', async () => {
  const f = fixture(); f.online(false);
  const tracker = f.create(); await settle(); tracker.start(); f.advance(25000); tracker.finish(); await settle();
  const queued = JSON.parse(f.storage.value);
  assert.equal(queued[0].durada, 25000); assert.equal(queued[0].estat, 'acabada');
  f.online(true); f.create(); await settle();
  assert.equal(f.sent.at(-1).durada, 25000); assert.deepEqual(JSON.parse(f.storage.value), []);
});

test('an interrupted page recovers only measured time and marks the departure approximate', async () => {
  const f = fixture(); f.online(false);
  const tracker = f.create(); await settle(); tracker.start(); f.advance(15000); f.beat(); await settle();
  f.advance(3600000); f.online(true); f.create(); await settle();
  assert.equal(f.sent.at(-1).durada, 15000);
  assert.equal(f.sent.at(-1).estat, 'interrompuda');
});

test('a finish queued during an in-flight update is sent without waiting for another heartbeat', async () => {
  let release; const messages = [];
  const context = vm.createContext({}); vm.runInContext(source, context);
  const tracker = context.createLocalSessionTracker({ clock: () => 0, wall: () => 1793091600000, uuid: () => 'session-000', every: () => 1, cancel() {}, url: async () => 'https://relay.example',
    send: async (_, body) => { messages.push(JSON.parse(body)); if (messages.length === 1) await new Promise(resolve => { release = resolve; }); return { ok: true }; } });
  await settle(); tracker.start(); await settle(); tracker.finish(); release(); await settle();
  assert.equal(messages.at(-1).estat, 'acabada'); assert.equal(messages.length, 2);
});

test('the game scripts parse and lifecycle hooks cover local round, pause, quit and page departure', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  for (const [, script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) if (script.trim()) new vm.Script(script);
  assert.match(html, /assets\/local-session\.js/);
  assert.match(html, /function endRound\(\)\{\s*if\(!NET.role\)localSessions.finish\(\)/);
  assert.match(html, /const toLobby=\(\)=>\{localSessions.finish\(\)/);
  assert.match(html, /addEventListener\('pagehide',\(\)=>localSessions.finish\(\)\)/);
});
