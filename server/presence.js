// Comptador global de gent connectada. Cada sala (Room) n'envia el recompte quan
// algú entra o surt; aquí només es guarden números per codi de sala, cap nom.
const STALE_MS = 3 * 3600000; // una sala que fa 3 h que no informa es dona per tancada
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
const clean = n => Number.isInteger(n) && n >= 0 && n <= 200 ? n : 0;
const MODES = ['local', 'online', 'espectador'], KEEP_DAYS = 60, MAX_DEVICES_DAY = 5000;
const day = (t = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(t);
const emptyDay = d => ({ dia: d, dispositius: 0, local: 0, online: 0, espectador: 0, entrades: 0, pic: 0 });

export class Presence {
  constructor(state) { this.storage = state.storage; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/report') {
      const r = await request.json().catch(() => null);
      if (!r || !/^\d{4}$/.test(r.code)) return json({ error: 'incorrecte' }, 400);
      const key = 'sala:' + r.code;
      if (!r.open) await this.storage.delete(key);
      else {
        const old = await this.storage.get(key);
        await this.storage.put(key, { codi: r.code, jugadors: clean(r.jugadors), espectadors: clean(r.espectadors), entrant: clean(r.entrant), oberta: old?.oberta || Date.now(), actualitzat: Date.now() });
      }
      const now = await this.summary();
      await this.storage.transaction(async tx => { const d = day(), k = 'dia:' + d, row = (await tx.get(k)) || emptyDay(d); if (now.total > row.pic) { row.pic = now.total; await tx.put(k, row); } });
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
    if (request.method === 'GET') return json(await this.summary(true));
    return json({ error: 'Mètode no admès' }, 405);
  }
  async prune(today) {
    if (this.pruned === today) return; this.pruned = today;
    const limit = day(Date.now() - KEEP_DAYS * 86400000);
    for (const prefix of ['vist:', 'dia:']) for (const key of (await this.storage.list({ prefix, limit: 1000 })).keys()) {
      const d = key.slice(prefix.length, prefix.length + 10);
      if (prefix === 'vist:' ? d < today : d < limit) await this.storage.delete(key);
    }
  }
  async summary(withDays = false) {
    const now = Date.now(), sales = [];
    for (const [key, s] of await this.storage.list({ prefix: 'sala:', limit: 500 })) {
      if (now - s.actualitzat > STALE_MS) { await this.storage.delete(key); continue; }
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
    }
    return { ...extra, total: sales.length + sum('jugadors') + sum('espectadors') + sum('entrant'), sales: sales.length, jugadors: sum('jugadors'), espectadors: sum('espectadors'), entrant: sum('entrant'), detall: sales, ara: now };
  }
}

export const STATUS_PAGE = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Castaween · connectats</title><style>
:root{--bg:#1b1020;--card:#2a1a30;--ink:#fff3e6;--muted:#c9b3c9;--acc:#ff8a2a}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.4 system-ui,sans-serif;padding:16px}
main{max-width:640px;margin:0 auto}h1{font-size:20px;margin:0 0 12px}
.big{font-size:64px;font-weight:800;color:var(--acc);line-height:1}.card{background:var(--card);border-radius:14px;padding:16px;margin:0 0 12px}
.row{display:flex;gap:8px;flex-wrap:wrap}.row div{flex:1;min-width:120px}.n{font-size:28px;font-weight:700}small,.muted{color:var(--muted)}
table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px 4px;border-bottom:1px solid #ffffff1a}th{color:var(--muted);font-weight:500;font-size:13px}
</style></head><body><main><h1>🌰 Castaween · gent connectada ara</h1>
<div class="card"><div class="big" id="total">–</div><div class="muted">persones connectades al servidor</div></div>
<div class="card row"><div><div class="n" id="sales">–</div><small>sales obertes</small></div><div><div class="n" id="jug">–</div><small>jugant</small></div><div><div class="n" id="esp">–</div><small>mirant</small></div><div><div class="n" id="ent">–</div><small>entrant</small></div></div>
<h1 style="margin-top:20px">📅 Avui</h1>
<div class="card row"><div><div class="n" id="aDisp">–</div><small>dispositius diferents</small></div><div><div class="n" id="aLoc">–</div><small>en mode local</small></div><div><div class="n" id="aOn">–</div><small>en línia</small></div><div><div class="n" id="aPic">–</div><small>màxim alhora (en línia)</small></div></div>
<h1 style="margin-top:20px">🟢 Sales obertes ara</h1>
<div class="card"><table><thead><tr><th>Sala</th><th>Jugant</th><th>Mirant</th><th>Entrant</th><th>Oberta fa</th></tr></thead><tbody id="llista"><tr><td colspan="5" class="muted">Carregant…</td></tr></tbody></table></div>
<h1 style="margin-top:20px">🗓️ Últims dies</h1>
<div class="card"><table><thead><tr><th>Dia</th><th>Dispositius</th><th>Local</th><th>En línia</th><th>Mirant</th><th>Partides</th></tr></thead><tbody id="dies"></tbody></table></div>
<p class="muted">Es compta un dispositiu (mòbil o ordinador) per dia, sense guardar noms. Es conserven 60 dies.</p>
<p class="muted" id="peu">S'actualitza cada 5 segons.</p></main><script>
const $=id=>document.getElementById(id),mins=ms=>{const m=Math.round(ms/60000);return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min';};
async function tick(){try{const d=await (await fetch('/api/estat',{cache:'no-store'})).json();
$('total').textContent=d.total;$('sales').textContent=d.sales;$('jug').textContent=d.jugadors;$('esp').textContent=d.espectadors;$('ent').textContent=d.entrant;
const a=d.avui;$('aDisp').textContent=a.dispositius;$('aLoc').textContent=a.local;$('aOn').textContent=a.online;$('aPic').textContent=a.pic;
$('dies').innerHTML=d.dies.length?d.dies.map(x=>'<tr><td>'+new Date(x.dia+'T12:00').toLocaleDateString('ca',{weekday:'short',day:'numeric',month:'short'})+'</td><td><b>'+x.dispositius+'</b></td><td>'+x.local+'</td><td>'+x.online+'</td><td>'+x.espectador+'</td><td>'+x.entrades+'</td></tr>').join(''):'<tr><td colspan="6" class="muted">Encara no hi ha dades</td></tr>';
$('llista').innerHTML=d.detall.length?d.detall.map(s=>'<tr><td><b>'+s.codi+'</b></td><td>'+s.jugadors+'</td><td>'+s.espectadors+'</td><td>'+s.entrant+'</td><td>'+mins(d.ara-s.oberta)+'</td></tr>').join(''):'<tr><td colspan="5" class="muted">Cap sala oberta</td></tr>';
$('peu').textContent='Actualitzat a les '+new Date().toLocaleTimeString('ca')+' · cada 5 segons.';}catch{$('peu').textContent='No es pot connectar amb el servidor. Ho torno a provar…';}}
tick();setInterval(tick,5000);</script></body></html>`;
