import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../worker.js';

function socket(role, id, joined = false) {
  return { readyState: 1, attachment: { role, id, joined, last: 0, window: 0, count: 0 }, messages: [],
    deserializeAttachment() { return structuredClone(this.attachment); },
    serializeAttachment(a) { this.attachment = structuredClone(a); },
    send(raw) { this.messages.push(JSON.parse(raw)); }, close() { this.readyState = 3; } };
}
const fixture = () => { const host = socket('host', 'h'), a = socket('client', 'a'), b = socket('client', 'b');const state = { getWebSockets: () => [host, a, b] };return { host, a, b, state, room: new Room(state) }; };

test('joins and inputs reach only host; identity cannot be forged', () => {
  const { room, host, a, b } = fixture();
  room.webSocketMessage(a, JSON.stringify({ t: 'join', id: 'fake', curs: 2, nom: 'Alumne', look: { scarf: 1 } }));
  assert.equal(host.messages[0].id, 'a');assert.equal(host.messages[0].curs, 2);
  room.webSocketMessage(a, JSON.stringify({ t: 'input', id: 'b', mx: 1, mz: 0, tir: true }));
  assert.equal(host.messages[1].id, 'a');assert.equal(b.messages.length, 0);
  room.webSocketMessage(a, JSON.stringify({ t: 'input', mx: 0, mz: 0 }));
  assert.equal(host.messages.length, 3, 'release survives a two-packet jitter burst');
  room.webSocketMessage(a, JSON.stringify({ t: 'input', mx: 0, mz: 0 }));
  assert.equal(a.readyState, 3, 'sustained input flooding closes sender');
});
test('state is host-only, supports snapshots targeted to one client', () => {
  const { room, host, a, b } = fixture();a.attachment.joined=b.attachment.joined=true;
  room.webSocketMessage(a, JSON.stringify({ t: 'estat', up: ['forged'] }));assert.equal(b.messages.length, 0);
  room.webSocketMessage(host, JSON.stringify({ t: 'estat', seq: 1, up: [] }));assert.equal(a.messages.length, 1);assert.equal(b.messages.length, 1);
  room.webSocketMessage(host, JSON.stringify({ t: 'estat', to: 'a', full: true }));assert.equal(a.messages.length, 2);assert.equal(b.messages.length, 1);
});
test('metadata survives hibernation; disconnect notifies host once', () => {
  const { state, host, a, room } = fixture();
  room.webSocketMessage(a, JSON.stringify({ t: 'join', curs: 0, nom: 'A', look: {} }));
  const awakened = new Room(state);awakened.webSocketMessage(a, JSON.stringify({ t: 'input', mx: 0, mz: -1 }));
  assert.equal(host.messages.at(-1).mz, -1);
  awakened.webSocketClose(a);awakened.webSocketClose(a);assert.equal(host.messages.filter(m => m.t === 'leave').length, 1);
});
test('host departure closes room; malformed JSON closes sender', () => {
  const { room, host, a, b } = fixture();room.webSocketClose(host);
  assert.equal(a.messages[0].error, 'amfitrio');assert.equal(b.readyState, 3);
  const f=fixture();f.room.webSocketMessage(f.a, '{');assert.equal(f.a.readyState, 3);
});
