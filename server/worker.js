// A room stores connection metadata only. All game rules run in the host browser.
import {UPLOAD_PAGE,REVIEW_PAGE,VIEWER_JS} from './model-pages.js';
import {PALETTE_PNG_BASE64} from './palette-image.js';
export {ReviewStore} from './review-store.js';
import {STATUS_PAGE} from './presence.js';
export {Presence} from './presence.js';
const presence = env => env.PRESENCE.get(env.PRESENCE.idFromName('global'));
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ ok: true, service: "castaween-relay" });
    if(url.pathname==='/models/paleta-castaween.png'&&request.method==='GET')return new Response(Uint8Array.from(atob(PALETTE_PNG_BASE64),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/png','Content-Disposition':'attachment; filename="paleta-castaween.png"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    if(['/models','/revisio','/models/viewer.js'].includes(url.pathname)){
      if(request.method!=='GET')return new Response('Method not allowed',{status:405});
      return new Response(url.pathname==='/models'?UPLOAD_PAGE:url.pathname==='/revisio'?REVIEW_PAGE:VIEWER_JS,{headers:{'Content-Type':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
    }
    if(url.pathname==='/estat'&&request.method==='GET')return new Response(STATUS_PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    if(url.pathname==='/api/estat'&&request.method==='GET')return presence(env).fetch('https://presence/estat');
    // El joc l'envia com a text/plain per evitar la consulta CORS prèvia.
    if(url.pathname==='/api/entrada'&&request.method==='POST'){const body=await request.text();if(body.length>300)return new Response('',{status:413});return presence(env).fetch('https://presence/entrada',{method:'POST',body});}
    if(url.pathname==='/api/local'&&request.method==='POST'){const body=await request.text();if(body.length>500)return new Response('',{status:413});return presence(env).fetch('https://presence/local',{method:'POST',body});}
    if(url.pathname.startsWith('/api/models/'))return env.REVIEWS.get(env.REVIEWS.idFromName('classroom')).fetch(request);
    const match = /^\/room\/(\d{4})$/.exec(url.pathname);
    if (!match) return new Response("Castaween WebSocket relay", { status: 404 });
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return new Response("WebSocket required", { status: 426 });
    return env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(request);
  }
};

export class Room {
  constructor(state, env) { this.state = state; this.env = env; }
  // Envia només números al comptador global (cap nom). Si falla, la partida continua igual.
  report() {
    if (!this.env?.PRESENCE || !this.code) return;
    const all = this.sockets().map(s => s.deserializeAttachment()), open = all.some(a => a.role === 'host');
    const n = f => all.filter(a => a.role === 'client' && f(a)).length;
    const sessions = all.filter(a => Number.isFinite(a.connectedAt)).map(a => ({ id: a.id, inici: a.connectedAt, tipus: a.role === 'host' ? 'professor' : !a.joined ? 'entrant' : a.spectator ? 'espectador' : 'jugador' }));
    const body = JSON.stringify({ code: this.code, open, sessions, jugadors: n(a => a.joined && !a.spectator), espectadors: n(a => a.joined && a.spectator), entrant: n(a => !a.joined) });
    const p = presence(this.env).fetch('https://presence/report', { method: 'POST', body }).catch(() => {});
    try { this.state.waitUntil?.(p); } catch {}
    return p;
  }
  get code() { return this._code ?? this.state.id?.name; }
  sockets() { return this.state.getWebSockets().filter(s => s.readyState === 1 && !s.deserializeAttachment()?.closed); }
  host() { return this.sockets().find(s => s.deserializeAttachment()?.role === "host"); }
  send(s, message) { try { s.send(JSON.stringify(message)); } catch { this.webSocketClose(s); } }
  async fetch(request) {
    const url = new URL(request.url), role = url.searchParams.get("role") === "host" ? "host" : "client";
    const host = this.host(), [client, socket] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(socket);
    const id = crypto.randomUUID();
    socket.serializeAttachment({ id, role, connectedAt: Date.now(), joined: false, window: 0, count: 0, last: 0 });
    if ((role === "host" && host) || (role === "client" && !host) || this.sockets().length > 151) {
      socket.serializeAttachment({ id, role: "rejected", closed: true });
      this.send(socket, { t: "error", error: role === "host" && host ? "ocupada" : !host ? "inexistent" : "limit" });
      socket.close(1008, "Sala no disponible");
    } else { this._code = url.pathname.split("/").pop(); this.send(socket, { t: "hello", id, code: this._code }); socket.serializeAttachment({ ...socket.deserializeAttachment(), code: this._code }); this.report(); }
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(socket, raw) {
    if (typeof raw !== "string" || raw.length > 250000) return socket.close(1009, "Missatge massa gran");
    let m; try { m = JSON.parse(raw); } catch { return socket.close(1008, "JSON incorrecte"); }
    if (!m || typeof m !== "object") return;
    const a = socket.deserializeAttachment(); if (!a) return;
    const now = Date.now();
    if (now - a.window >= 1000) { a.window = now; a.count = 0; }
    if (++a.count > (a.role === "host" ? 80 : 20)) return socket.close(1008, "Massa missatges");
    socket.serializeAttachment(a);
    if (a.role === "host") {
      if (m.t !== "estat") return;
      // Refresh presence from existing traffic, including after DO hibernation.
      if (now - (a.presenceAt || 0) >= 60000) {
        a.presenceAt = now; socket.serializeAttachment(a); this._code ??= a.code; this.report();
      }
      // Some school proxies time out one-way sockets. An outgoing ack is free,
      // needs no timer and keeps the host connection bidirectional.
      if (now - (a.ack || 0) >= 1000) {
        a.ack = now; socket.serializeAttachment(a);
        this.send(socket, { t: "ack", seq: m.seq });
      }
      // Targeted full snapshots are for new arrivals. Deltas go to every joined client.
      for (const peer of this.sockets()) {
        const p = peer.deserializeAttachment();
        if (p.role !== "host" && p.joined && (!m.to || p.id === m.to)) this.send(peer, m);
      }
      return;
    }
    const host = this.host();
    if (!host) { this.send(socket, { t: "error", error: "amfitrio" }); return socket.close(1001, "Amfitrió desconnectat"); }
    if (m.t === "join" && !a.joined) {
      if (!Number.isInteger(m.curs) || m.curs < 0 || m.curs > 4 || typeof m.nom !== "string" || !m.look || typeof m.look !== "object" || JSON.stringify(m.look).length > 1500) return socket.close(1008, "Entrada incorrecta");
      a.joined = true; a.spectator = m.spectator === true; socket.serializeAttachment(a);
      this._code ??= a.code; this.report();
      this.send(host, { t: "join", id: a.id, curs: m.curs, nom: m.nom.slice(0, 16), look: m.look, spectator: m.spectator === true });
    } else if (m.t === "input" && a.joined) {
      if (![m.mx, m.mz].every(v => Number.isFinite(v) && Math.abs(v) <= 1)) return;
      // 10/s sustained, with two packets of tolerance for network jitter.
      // Never silently discard a release packet and leave a player firing.
      a.credit = Math.min(2, (a.credit ?? 2) + (now - a.last) / 100);
      if (a.credit < 1) return socket.close(1008, "Massa inputs");
      a.credit--; a.last = now; socket.serializeAttachment(a);
      const aim = [m.ax, m.az].every(v => Number.isFinite(v) && Math.abs(v) <= 1) ? { ax: m.ax, az: m.az } : {};
      this.send(host, { t: "input", id: a.id, mx: m.mx, mz: m.mz, tir: m.tir === true, construir: m.construir === true, millorar: m.millorar === true, ...aim });
    } else if (m.t === "sync" && a.joined) this.send(host, { t: "sync", id: a.id });
  }
  webSocketClose(socket) {
    const a = socket.deserializeAttachment();
    if (!a || a.closed) return;
    a.closed = true; socket.serializeAttachment(a);
    if (a.role === "host") {
      for (const peer of this.sockets()) if (peer !== socket) {
        this.send(peer, { t: "error", error: "amfitrio" }); peer.close(1001, "Amfitrió desconnectat");
      }
    } else if (a.joined) { const host = this.host(); if (host) this.send(host, { t: "leave", id: a.id }); }
    try { socket.close(1000); } catch {}
    this._code ??= a.code; this.report();
  }
  webSocketError(socket) { this.webSocketClose(socket); }
}
