// Creates an empty test room and a spectator, verifies timestamps, then closes both.
import assert from 'node:assert/strict';
import { setTimeout as pause } from 'node:timers/promises';
const base = process.argv[2] || 'http://127.0.0.1:8787';
const sockets = [];
async function connect(code, host = false) {
  const ws = new WebSocket(base.replace(/^http/, 'ws') + '/room/' + code + (host ? '?role=host' : ''));
  sockets.push(ws);
  const hello = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('WebSocket timeout')), 10000);
    ws.addEventListener('message', e => {
      const data = JSON.parse(e.data);
      if (data.t === 'hello' || data.t === 'error') { clearTimeout(timer); resolve(data); }
    });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(Error('WebSocket error')); }, { once: true });
  });
  return { ws, hello };
}
async function until(check) {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(base + '/api/estat', { signal: AbortSignal.timeout(10000) }); assert.equal(res.status, 200);
    const data = await res.json(); if (check(data)) return data;
    await pause(250);
  }
  throw Error('Presence did not reach the expected state');
}
try {
  const page = await fetch(base + '/estat', { signal: AbortSignal.timeout(10000) }); assert.equal(page.status, 200);
  assert.match(await page.text(), /Hores de connexió/);
  let host, code;
  for (let i = 0; i < 5; i++) {
    code = String(1000 + Math.floor(Math.random() * 9000));
    host = await connect(code, true);
    if (host.hello.t === 'hello') break;
    host.ws.close(); host = null;
  }
  assert.ok(host, 'free test room');
  const client = await connect(code); assert.equal(client.hello.t, 'hello');
  client.ws.send(JSON.stringify({ t: 'join', curs: 0, nom: 'Prova', look: {}, spectator: true }));
  const ids = [host.hello.id, client.hello.id];
  const active = await until(d => Array.isArray(d.sessions) && ids.every(id => d.sessions.some(s => s.id === id && s.fi === null)) && d.sessions.some(s => s.id === client.hello.id && s.tipus === 'espectador'));
  assert.equal(active.sessions.find(s => s.id === host.hello.id).tipus, 'professor');
  assert.ok(active.sessions.find(s => s.id === client.hello.id).durada >= 0);
  client.ws.close(); host.ws.close();
  const closed = await until(d => ids.every(id => d.sessions.some(s => s.id === id && s.fi !== null)));
  for (const id of ids) {
    const s = closed.sessions.find(s => s.id === id);
    assert.equal(s.durada, s.fi - s.inici); assert.ok(s.fi >= s.inici);
  }
  console.log('OK: panel, active professor/spectator sessions, arrival, departure and final duration. Test sockets closed.');
} finally {
  for (const ws of sockets) if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
}
