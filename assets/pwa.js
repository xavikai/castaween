(() => {
  const scriptURL = document.currentScript.src, base = new URL('../', scriptURL);
  const button = document.getElementById('installBtn'), dialog = document.getElementById('installDialog');
  const help = document.getElementById('installHelp'), status = document.getElementById('pwaStatus');
  if (window.self !== window.top || new URLSearchParams(location.search).has('qa') || new URLSearchParams(location.search).has('disseny')) return;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let prompt = null;
  button.hidden = standalone();
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); prompt = event; button.hidden = standalone();
  });
  window.addEventListener('appinstalled', () => { prompt = null; button.hidden = true; });
  document.getElementById('installClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  button.addEventListener('click', async () => {
    if (prompt) {
      const offered = prompt; prompt = null;
      try { await offered.prompt(); const choice = await offered.userChoice; if (choice.outcome === 'accepted') button.hidden = true; return; } catch {}
    }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const macSafari = /Macintosh/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg/.test(navigator.userAgent);
    help.textContent = ios ? 'Obre el menú Comparteix del navegador i tria «Afegeix a la pantalla d’inici». Si no apareix, obre el joc amb Safari.'
      : macSafari ? 'A Safari, obre Fitxer → Afegeix al Dock. Confirma el nom Castaween i prem Afegeix.'
      : 'Obre el menú del navegador i tria «Instal·la Castaween» o «Instal·la aquesta pàgina com a aplicació». Si no trobes aquesta opció, obre el joc amb Chrome o Edge.';
    if (!dialog.open) dialog.showModal();
  });
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  const register = async () => {
    try {
      await navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.href, updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      status.textContent = 'Mode local disponible sense connexió. Per jugar en línia cal Internet.';
    } catch { status.textContent = 'Obre el joc amb Internet per preparar el mode local sense connexió.'; }
  };
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', register, { once: true });
})();
