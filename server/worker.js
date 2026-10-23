// A room stores connection metadata only. All game rules run in the host browser.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ ok: true, service: "castaween-relay" });
    const match = /^\/room\/(\d{4})$/.exec(url.pathname);
    if (!match) return new Response("Castaween WebSocket relay", { status: 404 });
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return new Response("WebSocket required", { status: 426 });
    return env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(request);
  }
};

export class Room {
  constructor(state) { this.state = state; }
  sockets() { return this.state.getWebSockets().filter(s => s.readyState === 1 && !s.deserializeAttachment()?.closed); }
  host() { return this.sockets().find(s => s.deserializeAttachment()?.role === "host"); }
  send(s, message) { try { s.send(JSON.stringify(message)); } catch { this.webSocketClose(s); } }
  async fetch(request) {
    const url = new URL(request.url), role = url.searchParams.get("role") === "host" ? "host" : "client";
    const host = this.host(), [client, socket] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(socket);
    const id = crypto.randomUUID();
    socket.serializeAttachment({ id, role, joined: false, window: 0, count: 0, last: 0 });
    if ((role === "host" && host) || (role === "client" && !host) || this.sockets().length > 151) {
      socket.serializeAttachment({ id, role: "rejected", closed: true });
      this.send(socket, { t: "error", error: role === "host" && host ? "ocupada" : !host ? "inexistent" : "limit" });
      socket.close(1008, "Sala no disponible");
    } else this.send(socket, { t: "hello", id, code: url.pathname.split("/").pop() });
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
      a.joined = true; socket.serializeAttachment(a);
      this.send(host, { t: "join", id: a.id, curs: m.curs, nom: m.nom.slice(0, 12), look: m.look, spectator: m.spectator === true });
    } else if (m.t === "input" && a.joined) {
      if (![m.mx, m.mz].every(v => Number.isFinite(v) && Math.abs(v) <= 1)) return;
      // 10/s sustained, with two packets of tolerance for network jitter.
      // Never silently discard a release packet and leave a player firing.
      a.credit = Math.min(2, (a.credit ?? 2) + (now - a.last) / 100);
      if (a.credit < 1) return socket.close(1008, "Massa inputs");
      a.credit--; a.last = now; socket.serializeAttachment(a);
      this.send(host, { t: "input", id: a.id, mx: m.mx, mz: m.mz, tir: m.tir === true, construir: m.construir === true, millorar: m.millorar === true });
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
  }
  webSocketError(socket) { this.webSocketClose(socket); }
}
