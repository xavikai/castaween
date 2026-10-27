// Comptador global de gent connectada. Cada sala (Room) n'envia el recompte quan
// algú entra o surt; sessions anònimes i recomptes per codi de sala, cap nom.
const STALE_MS = 3 * 3600000; // una sala que fa 3 h que no informa es dona per tancada
const LOCAL_STALE_MS = 120000; // local heartbeat: 15 s; retain measured time on abrupt departure
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
const clean = n => Number.isInteger(n) && n >= 0 && n <= 200 ? n : 0;
const MODES = ['local', 'online', 'espectador'], KEEP_DAYS = 60, MAX_DEVICES_DAY = 5000;
const day = (t = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(t);
const emptyDay = d => ({ dia: d, dispositius: 0, local: 0, online: 0, espectador: 0, entrades: 0, pic: 0 });
const sessionKey = s => 'sessio:' + new Date(s.inici).toISOString() + ':' + s.id;
const TYPES = ['professor', 'jugador', 'espectador', 'entrant'];

export class Presence {
  constructor(state) { this.storage = state.storage; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/report') {
      const r = await request.json().catch(() => null);
      if (!r || !/^\d{4}$/.test(r.code)) return json({ error: 'incorrecte' }, 400);
      const key = 'sala:' + r.code, at = Date.now();
      const sessions = r.open && Array.isArray(r.sessions) ? r.sessions.slice(0, 151).filter(s =>
        s && typeof s.id === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(s.id) &&
        Number.isSafeInteger(s.inici) && s.inici > 0 && s.inici <= at && TYPES.includes(s.tipus)
      ).map(s => ({ id: s.id, inici: s.inici, tipus: s.tipus, codi: r.code, fi: null })) : [];
      await this.storage.transaction(async tx => {
        const old = await tx.get(key), current = new Set(sessions.map(sessionKey));
        for (const s of old?.sessions || []) if (!current.has(sessionKey(s))) await tx.put(sessionKey(s), { ...s, fi: at });
        for (const s of sessions) await tx.put(sessionKey(s), s);
        if (!r.open) await tx.delete(key);
        else await tx.put(key, { codi: r.code, jugadors: clean(r.jugadors), espectadors: clean(r.espectadors), entrant: clean(r.entrant), oberta: old?.oberta || at, actualitzat: at, sessions });
      });
      const now = await this.summary();
      await this.storage.transaction(async tx => { const d = day(), k = 'dia:' + d, row = (await tx.get(k)) || emptyDay(d); if (now.total > row.pic) { row.pic = now.total; await tx.put(k, row); } });
      await this.prune(day());
      return json({ ok: true });
    }
    if (request.method === 'POST' && url.pathname === '/entrada') {
      // Un dispositiu = un identificador aleatori desat al navegador. No es guarda cap nom.
      const r = await request.json().catch(() => null);
      if (!r || !MODES.includes(r.mode) || typeof r.dispositiu !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(r.dispositiu)) return json({ error: 'incorrecte' }, 400);
      const d = day(), hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(r.dispositiu)))].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
      await this.storage.transaction(async tx => {
        const k = 'dia:' + d, row = (await tx.get(k)) || emptyDay(d), vk = 'vist:' + d + ':' + hash, seen = await tx.get(vk);
        if (!seen && row.dispositius >= MAX_DEVICES_DAY) return;
        row.entrades++;
        if (!seen) row.dispositius++;
        if (!seen?.includes(r.mode)) { row[r.mode]++; await tx.put(vk, [...(seen || []), r.mode]); }
        await tx.put(k, row);
      });
      await this.prune(d);
      return json({ ok: true });
    }
    if (request.method === 'POST' && url.pathname === '/local') {
      const r = await request.json().catch(() => null), now = Date.now();
      if (!r || typeof r.id !== 'string' || !/^local-[a-zA-Z0-9-]{8,64}$/.test(r.id) ||
        !Number.isSafeInteger(r.inici) || r.inici < now - KEEP_DAYS * 86400000 || r.inici > now + 60000 ||
        !Number.isSafeInteger(r.at) || r.at < r.inici || r.at > now + 60000 ||
        !Number.isSafeInteger(r.durada) || r.durada < 0 || r.durada > r.at - r.inici + 1000 ||
        !Number.isSafeInteger(r.seq) || r.seq < 1 || !['jugant', 'pausa', 'acabada', 'interrompuda'].includes(r.estat)) return json({ error: 'incorrecte' }, 400);
      const ended = r.estat === 'acabada' || r.estat === 'interrompuda';
      const session = { id: r.id, inici: r.inici, codi: 'Local', tipus: 'local', fi: ended ? r.at : null,
        duradaJoc: r.durada, estat: r.estat, seq: r.seq, at: r.at, actualitzat: now, aproximada: r.estat === 'interrompuda' };
      await this.storage.transaction(async tx => {
        const key = sessionKey(session), old = await tx.get(key);
        // Late heartbeats cannot reopen a finished round or lower its recorded time.
        if (old && (old.seq >= r.seq || old.duradaJoc > r.durada || old.fi !== null && !old.aproximada)) return;
        await tx.put(key, session);
        if (ended) await tx.delete('local:' + r.id);
        else await tx.put('local:' + r.id, session);
      });
      await this.prune(day());
      return json({ ok: true });
    }
    if (request.method === 'GET') return json(await this.summary(true));
    return json({ error: 'Mètode no admès' }, 405);
  }
  async prune(today) {
    if (this.pruned === today) return; this.pruned = today;
    const limit = day(Date.now() - KEEP_DAYS * 86400000);
    for (const prefix of ['vist:', 'dia:', 'sessio:']) {
      let startAfter;
      while (true) {
        const keys = [...(await this.storage.list({ prefix, limit: 1000, ...(startAfter ? { startAfter } : {}) })).keys()];
        for (const key of keys) {
          const d = key.slice(prefix.length, prefix.length + 10);
          if (prefix === 'vist:' ? d < today : d < limit) {
            const s = prefix === 'sessio:' ? await this.storage.get(key) : null;
            if (!s || s.fi !== null) await this.storage.delete(key);
          }
        }
        if (keys.length < 1000) break;
        startAfter = keys.at(-1);
      }
    }
  }
  async summary(withDays = false) {
    const now = Date.now(), sales = [], locals = [];
    for (const [key, s] of await this.storage.list({ prefix: 'local:', limit: 500 })) {
      if (now - s.actualitzat > LOCAL_STALE_MS) {
        await this.storage.put(sessionKey(s), { ...s, fi: s.at, estat: 'interrompuda', aproximada: true });
        await this.storage.delete(key);
      } else locals.push(s);
    }
    for (const [key, s] of await this.storage.list({ prefix: 'sala:', limit: 500 })) {
      if (now - s.actualitzat > STALE_MS) {
        for (const session of s.sessions || []) await this.storage.put(sessionKey(session), { ...session, fi: s.actualitzat, aproximada: true });
        await this.storage.delete(key); continue;
      }
      sales.push(s);
    }
    sales.sort((a, b) => a.oberta - b.oberta);
    const sum = k => sales.reduce((n, s) => n + s[k], 0);
    // Cada sala té un professor (amfitrió) a més dels alumnes.
    const extra = {};
    if (withDays) {
      const days = [...(await this.storage.list({ prefix: 'dia:', reverse: true, limit: 14 })).values()];
      extra.avui = days.find(x => x.dia === day()) || emptyDay(day());
      extra.dies = days;
      const recent = new Map(await this.storage.list({ prefix: 'sessio:', reverse: true, limit: 100 }));
      // Always include active sessions, even if more than 100 others started later.
      for (const room of sales) for (const s of room.sessions || []) recent.set(sessionKey(s), s);
      for (const s of locals) recent.set(sessionKey(s), s);
      extra.sessions = [...recent.values()].sort((a, b) => b.inici - a.inici).map(s => ({ ...s, durada: s.tipus === 'local' ? s.duradaJoc : Math.max(0, (s.fi ?? now) - s.inici) }));
    }
    return { ...extra, localsActius: locals.filter(s => s.estat === 'jugant').length, total: sales.length + sum('jugadors') + sum('espectadors') + sum('entrant'), sales: sales.length, jugadors: sum('jugadors'), espectadors: sum('espectadors'), entrant: sum('entrant'), detall: sales, ara: now };
  }
}

export const STATUS_PAGE = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Castaween · connectats</title><style>
:root{--bg:#1b1020;--card:#2a1a30;--ink:#fff3e6;--muted:#c9b3c9;--acc:#ff8a2a}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.4 system-ui,sans-serif;padding:16px}
main{max-width:820px;margin:0 auto}h1{font-size:20px;margin:0 0 12px}.scroll{overflow-x:auto}.sessions{min-width:650px}
.big{font-size:64px;font-weight:800;color:var(--acc);line-height:1}.card{background:var(--card);border-radius:14px;padding:16px;margin:0 0 12px}
.row{display:flex;gap:8px;flex-wrap:wrap}.row div{flex:1;min-width:120px}.n{font-size:28px;font-weight:700}small,.muted{color:var(--muted)}
table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px 4px;border-bottom:1px solid #ffffff1a}th{color:var(--muted);font-weight:500;font-size:13px}
</style></head><body><main><h1>🌰 Castaween · gent connectada ara</h1>
<div class="card"><div class="big" id="total">–</div><div class="muted">persones connectades al servidor</div></div>
<div class="card row"><div><div class="n" id="sales">–</div><small>sales obertes</small></div><div><div class="n" id="jug">–</div><small>jugant</small></div><div><div class="n" id="esp">–</div><small>mirant</small></div><div><div class="n" id="ent">–</div><small>entrant</small></div></div>
<p class="muted">Jugant en mode local: <b id="locals">–</b> (sense ocupar una sala).</p>
<h1 style="margin-top:20px">📅 Avui</h1>
<div class="card row"><div><div class="n" id="aDisp">–</div><small>dispositius diferents</small></div><div><div class="n" id="aLoc">–</div><small>en mode local</small></div><div><div class="n" id="aOn">–</div><small>en línia</small></div><div><div class="n" id="aPic">–</div><small>màxim alhora (en línia)</small></div></div>
<h1 style="margin-top:20px">🟢 Sales obertes ara</h1>
<div class="card"><table><thead><tr><th>Sala</th><th>Jugant</th><th>Mirant</th><th>Entrant</th><th>Oberta fa</th></tr></thead><tbody id="llista"><tr><td colspan="5" class="muted">Carregant…</td></tr></tbody></table></div>
<h1 style="margin-top:20px">🕒 Hores de connexió</h1>
<p class="muted">Hora de Catalunya. Sessions actives i les 100 més recents, sense noms. En línia es mostra el temps connectat; en mode local, el temps real de joc de cada ronda, excloent pauses i resultats (s’envia cada 15 s). Una sortida aproximada conserva l’últim temps confirmat.</p>
<div class="card scroll"><table class="sessions"><thead><tr><th>Sessió</th><th>Sala / mode</th><th>Tipus</th><th>Inici</th><th>Final / estat</th><th>Temps connectat / de joc</th></tr></thead><tbody id="sessions"><tr><td colspan="6" class="muted">Carregant…</td></tr></tbody></table></div>
<h1 style="margin-top:20px">🗓️ Últims dies</h1>
<div class="card"><table><thead><tr><th>Dia</th><th>Dispositius</th><th>Local</th><th>En línia</th><th>Mirant</th><th>Partides</th></tr></thead><tbody id="dies"></tbody></table></div>
<p class="muted">Es compta un dispositiu (mòbil o ordinador) per dia, sense guardar noms. Es conserven 60 dies.</p>
<p class="muted" id="peu">S'actualitza cada 5 segons.</p></main><script>
const $=id=>document.getElementById(id),mins=ms=>{const m=Math.round(ms/60000);return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min';};
const hora=t=>new Date(t).toLocaleString('ca',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const durada=ms=>{const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60);return (h?h+' h ':'')+(m%60)+' min '+(s%60)+' s';};
const tipus={professor:'Professor',jugador:'Jugador',espectador:'Espectador',entrant:'Entrant',local:'Partida local'};
async function tick(){try{const d=await (await fetch('/api/estat',{cache:'no-store'})).json();
$('total').textContent=d.total;$('sales').textContent=d.sales;$('jug').textContent=d.jugadors;$('esp').textContent=d.espectadors;$('ent').textContent=d.entrant;
$('locals').textContent=d.localsActius;
const a=d.avui;$('aDisp').textContent=a.dispositius;$('aLoc').textContent=a.local;$('aOn').textContent=a.online;$('aPic').textContent=a.pic;
$('dies').innerHTML=d.dies.length?d.dies.map(x=>'<tr><td>'+new Date(x.dia+'T12:00').toLocaleDateString('ca',{weekday:'short',day:'numeric',month:'short'})+'</td><td><b>'+x.dispositius+'</b></td><td>'+x.local+'</td><td>'+x.online+'</td><td>'+x.espectador+'</td><td>'+x.entrades+'</td></tr>').join(''):'<tr><td colspan="6" class="muted">Encara no hi ha dades</td></tr>';
$('llista').innerHTML=d.detall.length?d.detall.map(s=>'<tr><td><b>'+s.codi+'</b></td><td>'+s.jugadors+'</td><td>'+s.espectadors+'</td><td>'+s.entrant+'</td><td>'+mins(d.ara-s.oberta)+'</td></tr>').join(''):'<tr><td colspan="5" class="muted">Cap sala oberta</td></tr>';
$('sessions').innerHTML=d.sessions.length?d.sessions.map(s=>'<tr><td>'+s.id.replace(/^local-/,'').slice(0,8)+'</td><td>'+s.codi+'</td><td>'+tipus[s.tipus]+'</td><td>'+hora(s.inici)+'</td><td>'+(s.fi===null?(s.tipus==='local'?(s.estat==='pausa'?'En pausa':'Jugant'):'Connectada'):hora(s.fi)+(s.aproximada?' (aprox.)':''))+'</td><td>'+durada(s.durada)+'</td></tr>').join(''):'<tr><td colspan="6" class="muted">Les noves partides i connexions apareixeran aquí</td></tr>';
$('peu').textContent='Actualitzat a les '+new Date().toLocaleTimeString('ca')+' · cada 5 segons.';}catch{$('peu').textContent='No es pot connectar amb el servidor. Ho torno a provar…';}}
tick();setInterval(tick,5000);</script></body></html>`;
