// Exercises the actual browser tracker against the live HTTP API, then ends the test round.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { setTimeout as pause } from 'node:timers/promises';
const base = process.argv[2] || 'http://127.0.0.1:8787';
const id = crypto.randomUUID(), sessionId = 'local-' + id;
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../../assets/local-session.js', import.meta.url), 'utf8'), context);
const tracker = context.createLocalSessionTracker({ uuid: () => id, wall: Date.now, clock: () => performance.now(), every: setInterval, cancel: clearInterval,
  url: async () => base, send: (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body, signal: AbortSignal.timeout(10000) }) });
async function until(check) {
  for (let i = 0; i < 40; i++) {
    const response = await fetch(base + '/api/estat', { signal: AbortSignal.timeout(10000) }); assert.equal(response.status, 200);
    const data = await response.json(), s = data.sessions.find(s => s.id === sessionId);
    if (s && check(s)) return s;
    await pause(250);
  }
  throw Error('Local session did not reach expected state');
}
try {
  tracker.start(); await until(s => s.estat === 'jugant');
  await pause(600); tracker.pause();
  const paused = await until(s => s.estat === 'pausa');
  await pause(400);
  const stillPaused = await until(s => s.estat === 'pausa');
  assert.equal(stillPaused.durada, paused.durada);
  tracker.resume(); await pause(300); tracker.finish();
  const ended = await until(s => s.estat === 'acabada' && s.fi !== null);
  assert.ok(ended.durada >= 900);
  assert.ok(ended.durada <= ended.fi - ended.inici - 300, 'pause excluded from gameplay duration');
  assert.equal(ended.tipus, 'local'); assert.equal(ended.aproximada, false);
  console.log('OK: local start, pause excluded, resume and final gameplay duration. Test round ended.');
} finally { tracker.finish(); await tracker.flush(); }
