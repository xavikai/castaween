// Anonymous local-round timing. Never blocks gameplay; paused time is excluded.
function createLocalSessionTracker(options) {
  const clock = options.clock || (() => performance.now()), wall = options.wall || Date.now;
  const uuid = options.uuid || (() => crypto.randomUUID());
  const every = options.every || setInterval, cancel = options.cancel || clearInterval;
  const storage = options.storage, key = 'castaween-local-pendent';
  let pending = [], current = null, runningSince = null, timer = null, sending = false, resend = false;
  try { pending = JSON.parse(storage?.getItem(key) || '[]'); if (!Array.isArray(pending)) pending = []; } catch { pending = []; }
  // A previous page could not confirm its departure: retain only measured time.
  pending = pending.slice(-100).map(s => s.estat === 'acabada' || s.estat === 'interrompuda' ? s : { ...s, seq: s.seq + 1, estat: 'interrompuda' });
  const save = () => { try { storage?.setItem(key, JSON.stringify(pending)); } catch {} };
  function measure() {
    if (current && runningSince !== null) { const now = clock(); current.durada += Math.max(0, now - runningSince); runningSince = now; }
  }
  function snapshot() {
    if (!current) return;
    measure(); current.seq++;
    const data = { ...current, durada: Math.floor(current.durada), at: wall() };
    pending = pending.filter(s => s.id !== data.id).concat(data).slice(-100); save();
    return data;
  }
  async function flush() {
    if (sending) { resend = true; return; }
    sending = true;
    try {
      const base = await options.url(); if (!base) return;
      for (const item of [...pending]) {
        try {
          const response = await options.send(base + '/api/local', JSON.stringify(item));
          if (!response.ok && response.status !== 400) continue;
          pending = pending.filter(s => s.id !== item.id || s.seq !== item.seq); save();
        } catch {}
      }
    } catch {} finally { sending = false; if (resend) { resend = false; void flush(); } }
  }
  function update() { snapshot(); void flush(); }
  function finish() {
    if (!current) return;
    measure(); runningSince = null; current.estat = 'acabada'; update(); current = null;
    if (timer !== null) cancel(timer); timer = null;
  }
  function start() {
    finish(); current = { id: 'local-' + uuid(), inici: wall(), durada: 0, seq: 0, estat: 'jugant' };
    runningSince = clock(); update(); timer = every(update, 15000);
  }
  function pause() { if (!current) return; measure(); runningSince = null; current.estat = 'pausa'; update(); }
  function resume() { if (!current) { start(); return; } if (runningSince !== null) return; current.estat = 'jugant'; runningSince = clock(); update(); }
  save(); void flush();
  return { start, pause, resume, finish, flush, update };
}
