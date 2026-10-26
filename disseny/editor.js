/* Castaween · Editor de Disseny
   Pàgina: disseny.html (carrega el joc en un marc amb index.html?disseny). Permet canviar textos, colors, tipografies, cantonades i tres imatges,
   veure-ho al moment als menús reals del joc i descarregar-ho en un ZIP per entregar-lo.
   La posició i la mida dels elements no es poden canviar. */
(function(){
'use strict';
const KEY='castaween-disseny-v1';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const SCREENS=[['inici','Inici'],['entrada','Entrada'],['codi','Codi de sala'],['personatge','Personatge'],['com-es-juga','Com es juga'],['opcions','Opcions'],['partida','Partida'],['pausa','Pausa'],['resultats','Resultats']];
const GROUP_SCREEN={inici:'inici',menu:'inici',entrada:'entrada',codi:'codi',personatge:'personatge','com-es-juga':'com-es-juga',opcions:'opcions',partida:'partida',espectador:'partida',pausa:'pausa',resultats:'resultats'};
const GROUP_NAME={inici:'Inici',menu:'Capçalera',entrada:'Entrada',codi:'Codi de sala',personatge:'Personatge','com-es-juga':'Com es juga',opcions:'Opcions',partida:'Partida',espectador:'Espectador',pausa:'Pausa',resultats:'Resultats'};
const COLORS=[
  ['accent','Color principal','Botons, títol i detalls'],['accent-fosc','Principal fosc','Vora i ombra dels botons'],
  ['fons','Fons','Darrere de tot'],['targeta','Targetes','Fons de les targetes del menú'],['panell','Panells del joc','Marcadors, rellotge… (pot ser transparent)',true],
  ['text','Text','Text principal'],['text-secundari','Text secundari','Explicacions i etiquetes'],['linies','Línies','Vores fines (pot ser transparent)',true],
  ['halloween','Halloween','Nit de Difunts i avisos'],['perill','Perill','Errors i vida baixa'],['vida','Vida','Barra de vida']];
const FONTS_T=['Bungee','Luckiest Guy','Creepster','Bangers','Lilita One','Titan One','Rubik Mono One','Chewy','Righteous','Black Ops One','Permanent Marker','Press Start 2P','Butcherman','Eater','Griffy','Mystery Quest','Fredoka','Baloo 2','Sigmar','Bowlby One'];
const FONTS_B=['Rubik','Nunito','Poppins','Montserrat','Inter','Lato','Work Sans','Quicksand','Fredoka','Baloo 2','Atkinson Hyperlegible','Lexend','Karla','Manrope','Outfit','Comfortaa'];
const IMGS=[
  ['logo','Logo del títol','Substitueix el títol «Castaween» del menú. Es veu dins d\'una caixa fixa.','image/png,image/svg+xml,image/webp',300,'PNG transparent, SVG o WebP · màx. 300 KB · horitzontal (p. ex. 1200 × 400 px)'],
  ['fons','Fons del menú','Imatge o vídeo darrere dels menús. Es retalla per omplir la pantalla.','image/jpeg,image/png,image/webp,video/mp4,video/webm',800,'JPG o WebP · màx. 800 KB (vídeo MP4 màx. 3 MB) · vertical, 1080 × 1920 px'],
  ['icona_llanca','Icona del botó LLANÇA','Dibuix dins del botó rodó de llançar. Mida fixa.','image/png,image/svg+xml,image/webp',100,'PNG transparent o SVG · màx. 100 KB · quadrat, 256 × 256 px']];

let API=null,base={};
let st=load()||{nom:'',colors:{},tipografies:{},cantonades:1,textos:{},imgs:{}};
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
let saveWarned=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){if(!saveWarned){saveWarned=true;toast('Les imatges són massa grans per desar-se soles. Descarrega el ZIP abans de tancar.');}}}

/* ---------- estils del panell (fixos: no canvien amb el tema de l'alumne) ---------- */
const css=`
#dz{position:fixed;top:0;right:0;bottom:0;width:380px;z-index:1000;background:#14152a;color:#efe8d8;font:14px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;flex-direction:column;border-left:1px solid #2c2d4a;box-shadow:-8px 0 30px rgba(0,0,0,.35)}
#dz *{box-sizing:border-box}
#dz header{padding:14px 16px 10px;border-bottom:1px solid #2c2d4a}
#dz h1{margin:0;font-size:16px;letter-spacing:.02em;display:flex;align-items:center;gap:8px}
#dz h1 i{font-style:normal;font-size:11px;font-weight:600;background:#ff8a2a;color:#1a0d05;padding:2px 7px;border-radius:999px}
#dz .sub{margin:4px 0 0;color:#a9a3bb;font-size:12.5px}
#dz .screens{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
#dz .screens button,#dz .seg button{font:inherit;font-size:12px;padding:5px 9px;border-radius:7px;border:1px solid #34365a;background:#1c1d36;color:#efe8d8;cursor:pointer}
#dz .screens button[aria-pressed=true],#dz .seg button[aria-pressed=true]{background:#ff8a2a;border-color:#ff8a2a;color:#1a0d05;font-weight:600}
#dz nav{display:flex;border-bottom:1px solid #2c2d4a}
#dz nav button{flex:1;font:inherit;font-size:13px;padding:10px 4px;background:none;border:0;border-bottom:2px solid transparent;color:#a9a3bb;cursor:pointer}
#dz nav button[aria-selected=true]{color:#fff;border-bottom-color:#ff8a2a;font-weight:600}
#dz main{flex:1;overflow-y:auto;padding:14px 16px 24px}
#dz .row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #22233d}
#dz .row .lab{flex:1;min-width:0}
#dz .row .lab b{display:block;font-size:13.5px}
#dz .row .lab small{color:#8f89a3;font-size:12px}
#dz input[type=color]{width:42px;height:32px;padding:0;border:1px solid #34365a;border-radius:7px;background:none;cursor:pointer}
#dz input[type=range]{width:100%}
#dz .alpha{width:70px}
#dz .mini{font:inherit;font-size:11.5px;padding:3px 7px;border-radius:6px;border:1px solid #34365a;background:transparent;color:#a9a3bb;cursor:pointer}
#dz .mini:hover{color:#fff;border-color:#55577f}
#dz select,#dz input[type=text],#dz textarea{width:100%;font:inherit;font-size:13.5px;padding:7px 9px;border-radius:7px;border:1px solid #34365a;background:#0f1022;color:#efe8d8}
#dz textarea{resize:vertical;min-height:38px}
#dz .field{margin:0 0 14px}
#dz .field>label{display:block;font-weight:600;margin-bottom:5px}
#dz .help{color:#8f89a3;font-size:12px;margin:5px 0 0}
#dz .grp{margin:16px 0 4px;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ff8a2a;display:flex;justify-content:space-between;align-items:center}
#dz .txt{padding:8px 0;border-bottom:1px solid #22233d}
#dz .txt .k{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#8f89a3;margin-bottom:4px}
#dz .txt.changed .k span:first-child{color:#ffb36b}
#dz .img{border:1px dashed #3a3c63;border-radius:10px;padding:12px;margin-bottom:14px}
#dz .img .pv{height:90px;border-radius:7px;background:#0f1022 repeating-conic-gradient(#191a33 0 25%,#0f1022 0 50%) 0 0/16px 16px;display:grid;place-items:center;margin:8px 0;overflow:hidden}
#dz .img .pv img,#dz .img .pv video{max-width:100%;max-height:100%}
#dz .img .pv span{color:#6f6a85;font-size:12px}
#dz .btn{display:block;width:100%;font:inherit;font-weight:700;font-size:14.5px;padding:11px;border-radius:10px;border:0;background:#ff8a2a;color:#1a0d05;cursor:pointer;margin-top:8px}
#dz .btn.ghost{background:transparent;border:1px solid #34365a;color:#efe8d8;font-weight:600}
#dz .btn:disabled{opacity:.5;cursor:not-allowed}
#dz .steps{margin:0 0 14px;padding:0;list-style:none;counter-reset:s}
#dz .steps li{counter-increment:s;display:flex;gap:10px;padding:6px 0;color:#cfc8b8}
#dz .steps li::before{content:counter(s);flex:none;width:22px;height:22px;border-radius:50%;background:#2a2b4b;color:#ff8a2a;font-weight:700;display:grid;place-items:center;font-size:12px}
#dz .err{color:#ff7b70;font-size:12.5px;margin-top:6px}
#dz .toggle{position:absolute;left:-38px;top:12px;width:38px;height:38px;border-radius:9px 0 0 9px;border:1px solid #2c2d4a;border-right:0;background:#14152a;color:#fff;cursor:pointer;font-size:16px}
#dz.closed{transform:translateX(100%)}
html,body{margin:0;height:100%;background:#05060d;overflow:hidden}
#dzFrame{position:fixed;border:0;background:#0e1122;display:block}
#dztoast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1001;background:#ff8a2a;color:#1a0d05;font:600 13.5px system-ui,sans-serif;padding:10px 16px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.4);max-width:90vw;opacity:0;transition:opacity .25s;pointer-events:none}
#dztoast.on{opacity:1}
@media (max-width:760px){#dz{width:100%;top:auto;height:56vh;border-left:0;border-top:1px solid #2c2d4a}#dz.closed{transform:translateY(calc(100% - 44px))}#dz .toggle{left:auto;right:12px;top:-38px;border-radius:9px 9px 0 0;border:1px solid #2c2d4a;border-bottom:0}}`;
const styleEl=document.createElement('style');styleEl.textContent=css;document.head.appendChild(styleEl);

/* ---------- la previsualització: el joc en un marc, a mida de mòbil o d'ordinador ---------- */
const frame=document.createElement('iframe');frame.id='dzFrame';frame.title='Vista prèvia del joc';frame.src='index.html?disseny';document.body.appendChild(frame);
let view='mobil';
function layout(){const wide=innerWidth>760,open=!dz.classList.contains('closed');let L,T,W,H,r=0;
  if(!wide){L=0;T=0;W=innerWidth;H=open?innerHeight*0.44:innerHeight-44;}
  else{const free=innerWidth-(open?380:0);
    if(view==='mobil'){H=Math.min(innerHeight-48,880);W=Math.round(Math.min(free-48,H/2.05));H=Math.round(Math.min(H,W*2.05));L=Math.round((free-W)/2);T=Math.round((innerHeight-H)/2);r=22;}
    else{L=0;T=0;W=free;H=innerHeight;}}
  Object.assign(frame.style,{left:L+'px',top:T+'px',width:W+'px',height:H+'px',borderRadius:r+'px',boxShadow:r?'0 0 0 9px #000,0 24px 70px rgba(0,0,0,.6)':'none'});}

/* ---------- panell ---------- */
const dz=document.createElement('aside');dz.id='dz';dz.setAttribute('aria-label','Editor de disseny');
dz.innerHTML=`<button class="toggle" id="dzToggle" aria-label="Amaga o mostra el panell">⇆</button>
<header><h1>Castaween <i>Disseny</i></h1><p class="sub">Canvia l'aspecte del joc. Els menús es queden al seu lloc i amb la seva mida.</p>
<div class="screens" id="dzScreens"></div>
<div class="seg screens" id="dzView" style="margin-top:6px"><button data-v="mobil" aria-pressed="true">📱 Mòbil</button><button data-v="pc" aria-pressed="false">🖥 Ordinador</button></div></header>
<nav role="tablist"><button data-tab="colors" aria-selected="true">Colors</button><button data-tab="lletres" aria-selected="false">Lletres</button><button data-tab="textos" aria-selected="false">Textos</button><button data-tab="imatges" aria-selected="false">Imatges</button><button data-tab="entrega" aria-selected="false">Entrega</button></nav>
<main id="dzMain"></main>`;
document.body.appendChild(dz);
const toastEl=document.createElement('div');toastEl.id='dztoast';document.body.appendChild(toastEl);
let toastT=0;function toast(t){toastEl.textContent=t;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),3200);}

let screen='inici';
const scr=$('#dzScreens');SCREENS.forEach(([id,name])=>{const b=document.createElement('button');b.textContent=name;b.dataset.s=id;b.addEventListener('click',()=>go(id));scr.appendChild(b);});
function go(id){if(!API||(screen===id&&id!=='partida'))return;screen=id;[...scr.children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===id));API.show(id);}
$('#dzView').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;view=b.dataset.v;[...$('#dzView').children].forEach(x=>x.setAttribute('aria-pressed',x===b));layout();});
$('#dzToggle').addEventListener('click',()=>{dz.classList.toggle('closed');setTimeout(layout,30);});
addEventListener('resize',layout);

let tab='colors';
dz.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;[...dz.querySelectorAll('nav button')].forEach(x=>x.setAttribute('aria-selected',x===b));render();});

/* ---------- aplicar al joc ---------- */
function tema(){const t={colors:{},tipografies:{},cantonades:st.cantonades};for(const k in st.colors)t.colors[k]=st.colors[k];for(const k in st.tipografies)if(st.tipografies[k])t.tipografies[k]=st.tipografies[k];return t;}
function apply(){if(!API)return;API.applyTheme(tema());API.applyTexts(st.textos);API.applyImages(st.imgs);save();}

/* colors amb transparència: es guarden com a rgba() */
const toHex=v=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle='#000';c.fillStyle=v;const f=c.fillStyle;if(f.startsWith('#'))return{hex:f,a:1};const m=f.match(/rgba?\(([^)]+)\)/);if(!m)return{hex:'#000000',a:1};const p=m[1].split(',').map(Number);return{hex:'#'+p.slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join(''),a:p[3]??1};};
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return a>=1?hex:`rgba(${n>>16&255},${n>>8&255},${n&255},${+a.toFixed(2)})`;};

function render(){const m=$('#dzMain');m.innerHTML='';m.scrollTop=0;({colors:renderColors,lletres:renderFonts,textos:renderTexts,imatges:renderImgs,entrega:renderEntrega})[tab](m);}

function renderColors(m){
  m.insertAdjacentHTML('beforeend','<p class="help" style="margin:0 0 6px">Tria els colors de la interfície. Comprova que el text es llegeix bé sobre els fons.</p>');
  for(const [k,name,help,alpha] of COLORS){const cur=st.colors[k]||API.THEME_DEFAULT.colors[k],{hex,a}=toHex(cur);
    const row=document.createElement('div');row.className='row';
    row.innerHTML=`<div class="lab"><b>${name}</b><small>${help}</small></div>${alpha?`<input class="alpha" type="range" min="0" max="1" step="0.02" value="${a}" title="Transparència">`:''}<input type="color" value="${hex}" aria-label="${name}"><button class="mini" title="Torna al color original">↺</button>`;
    const col=row.querySelector('input[type=color]'),al=row.querySelector('.alpha');
    const set=()=>{st.colors[k]=alpha?rgba(col.value,+al.value):col.value;apply();};
    col.addEventListener('input',set);if(al)al.addEventListener('input',set);
    row.querySelector('.mini').addEventListener('click',()=>{delete st.colors[k];apply();render();});m.appendChild(row);}
  const r=document.createElement('button');r.className='btn ghost';r.textContent='Torna a tots els colors originals';r.addEventListener('click',()=>{st.colors={};apply();render();});m.appendChild(r);}

function fontField(m,key,label,list,help){const cur=st.tipografies[key]||API.THEME_DEFAULT.tipografies[key];const f=document.createElement('div');f.className='field';
  f.innerHTML=`<label>${label}</label><select>${list.map(n=>`<option ${n===cur?'selected':''}>${esc(n)}</option>`).join('')}${list.includes(cur)?'':`<option selected>${esc(cur)}</option>`}<option value="__altra">Una altra de Google Fonts…</option></select><input type="text" placeholder="Nom exacte, p. ex. Pacifico" hidden><p class="help">${help}</p>`;
  const sel=f.querySelector('select'),inp=f.querySelector('input');
  sel.addEventListener('change',()=>{if(sel.value==='__altra'){inp.hidden=false;inp.focus();return;}inp.hidden=true;st.tipografies[key]=sel.value;apply();});
  inp.addEventListener('change',()=>{const v=inp.value.trim();if(!/^[A-Za-z0-9 ]{2,40}$/.test(v)){toast('Escriu només el nom de la font, tal com surt a fonts.google.com');return;}st.tipografies[key]=v;apply();toast('Font carregada: '+v);});
  m.appendChild(f);}
function renderFonts(m){
  fontField(m,'titols','Lletra dels títols i botons',FONTS_T,'Es fa servir al títol, als botons, al rellotge i als números.');
  fontField(m,'text','Lletra del text',FONTS_B,'Per a les explicacions i els textos llargs. Tria\'n una de fàcil de llegir al mòbil.');
  const f=document.createElement('div');f.className='field';f.innerHTML=`<label>Cantonades</label><input type="range" min="0" max="2" step="0.25" value="${st.cantonades??1}"><div style="display:flex;justify-content:space-between" class="help"><span>Rectes</span><span>Com ara</span><span>Molt rodones</span></div>`;
  f.querySelector('input').addEventListener('input',e=>{st.cantonades=+e.target.value;apply();});m.appendChild(f);
  m.insertAdjacentHTML('beforeend','<p class="help">Si una lletra fa els textos massa llargs i no hi caben, tria\'n una de més estreta: la mida dels menús no canvia.</p>');}

const autosize=t=>{t.style.height='auto';t.style.height=Math.min(220,t.scrollHeight+2)+'px';};
function renderTexts(m){
  m.insertAdjacentHTML('beforeend',`<input type="text" id="dzFind" placeholder="Cerca un text…" style="margin-bottom:6px"><p class="help" style="margin:0 0 4px">Pots posar <b>&lt;b&gt;negreta&lt;/b&gt;</b> i <code>&lt;br&gt;</code> per saltar de línia. Si el text és massa llarg potser no hi cabrà.</p><div id="dzTexts"></div>`);
  const box=$('#dzTexts');const groups={};
  for(const k of Object.keys(base)){const g=k.split('.')[0];(groups[g]=groups[g]||[]).push(k);}
  const order=['inici','menu','entrada','codi','personatge','com-es-juga','opcions','partida','espectador','pausa','resultats'];
  for(const g of order.concat(Object.keys(groups).filter(x=>!order.includes(x)))){if(!groups[g])continue;
    const h=document.createElement('div');h.className='grp';h.innerHTML=`<span>${GROUP_NAME[g]||g}</span><button class="mini">Mostra la pantalla</button>`;h.querySelector('button').addEventListener('click',()=>go(GROUP_SCREEN[g]||'inici'));box.appendChild(h);
    for(const k of groups[g]){const v=st.textos[k]??base[k];const d=document.createElement('div');d.className='txt'+(k in st.textos?' changed':'');d.dataset.k=k;d.dataset.search=(base[k]+' '+v).toLowerCase();
      d.innerHTML=`<div class="k"><span>${esc(base[k].replace(/<[^>]*>/g,'').slice(0,46))}${base[k].length>46?'…':''}</span><button class="mini" title="Torna al text original">↺</button></div><textarea rows="1" spellcheck="true"></textarea>`;
      const ta=d.querySelector('textarea');ta.value=v;
      ta.addEventListener('focus',()=>{const s=GROUP_SCREEN[g];if(s&&s!==screen)go(s);});
      ta.addEventListener('input',()=>{autosize(ta);if(ta.value===base[k])delete st.textos[k];else st.textos[k]=ta.value;d.classList.toggle('changed',k in st.textos);apply();});
      d.querySelector('.mini').addEventListener('click',()=>{delete st.textos[k];ta.value=base[k];autosize(ta);d.classList.remove('changed');apply();});
      box.appendChild(d);requestAnimationFrame(()=>autosize(ta));}}
  $('#dzFind').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();box.querySelectorAll('.txt').forEach(d=>d.hidden=q&&!d.dataset.search.includes(q));});}

function renderImgs(m){
  for(const [k,name,help,accept,maxKB,spec] of IMGS){const d=document.createElement('div');d.className='img';const cur=st.imgs[k];
    const isVid=cur&&/^data:video/.test(cur);
    d.innerHTML=`<b>${name}</b><p class="help">${help}</p><div class="pv">${cur?(isVid?`<video src="${cur}" muted autoplay loop playsinline></video>`:`<img src="${cur}" alt="">`):'<span>Encara no n\'hi ha cap</span>'}</div><p class="help">${spec}</p><input type="file" accept="${accept}" hidden><button class="btn ghost" data-a="pick">${cur?'Canvia la imatge':'Tria una imatge'}</button>${cur?'<button class="btn ghost" data-a="del">Treu-la</button>':''}<p class="err" hidden></p>`;
    const inp=d.querySelector('input'),err=d.querySelector('.err');
    d.querySelector('[data-a=pick]').addEventListener('click',()=>inp.click());
    const del=d.querySelector('[data-a=del]');if(del)del.addEventListener('click',()=>{delete st.imgs[k];apply();render();});
    inp.addEventListener('change',()=>{const f=inp.files[0];if(!f)return;const vid=f.type.startsWith('video/'),lim=(vid?3000:maxKB)*1024;
      if(!accept.split(',').includes(f.type)){err.hidden=false;err.textContent='Aquest format no val. Mira quins formats s\'accepten.';return;}
      if(f.size>lim){err.hidden=false;err.textContent=`Massa gran: ${Math.round(f.size/1024)} KB. El màxim és ${Math.round(lim/1024)} KB. Redueix-la o comprimeix-la.`;return;}
      const r=new FileReader();r.onload=()=>{st.imgs[k]=r.result;apply();render();if(k!=='icona_llanca'&&screen!=='inici')go('inici');if(k==='icona_llanca')go('partida');};r.readAsDataURL(f);});
    m.appendChild(d);}}

function slug(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);}
function renderEntrega(m){
  m.innerHTML=`<ol class="steps"><li>Escriu el teu nom (o el del grup).</li><li>Prem «Descarrega el ZIP».</li><li>Entrega el ZIP al professor sense descomprimir-lo.</li></ol>
  <div class="field"><label for="dzNom">Nom o grup</label><input type="text" id="dzNom" maxlength="40" placeholder="Ex.: Marta i Pol" value="${esc(st.nom||'')}"></div>
  <button class="btn" id="dzZip">Descarrega el ZIP</button><p class="err" id="dzZipErr" hidden></p>
  <div class="grp" style="margin-top:22px"><span>Continuar o començar</span></div>
  <p class="help">El teu disseny es desa sol en aquest navegador. Si canvies d'ordinador, obre el ZIP que vas descarregar per continuar.</p>
  <input type="file" id="dzOpen" accept=".zip,application/zip" hidden><button class="btn ghost" id="dzOpenB">Obre un ZIP per continuar</button><button class="btn ghost" id="dzReset">Comença de nou</button>`;
  $('#dzNom').addEventListener('input',e=>{st.nom=e.target.value;save();});
  $('#dzZip').addEventListener('click',download);
  $('#dzOpenB').addEventListener('click',()=>$('#dzOpen').click());
  $('#dzOpen').addEventListener('change',e=>{const f=e.target.files[0];if(f)openZip(f);});
  $('#dzReset').addEventListener('click',()=>{if(!confirmReset())return;st={nom:st.nom,colors:{},tipografies:{},cantonades:1,textos:{},imgs:{}};apply();render();toast('Tot torna a ser com al principi');});}
let resetArm=0;function confirmReset(){const b=$('#dzReset');if(Date.now()-resetArm<4000){resetArm=0;b.textContent='Comença de nou';return true;}resetArm=Date.now();b.textContent='Segur? Torna a prémer per esborrar-ho tot';setTimeout(()=>{if(b.isConnected)b.textContent='Comença de nou';},4000);return false;}

let zipLib=null;
function JSZipLib(){if(window.JSZip)return Promise.resolve(window.JSZip);if(zipLib)return zipLib;
  zipLib=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';s.onload=()=>res(window.JSZip);s.onerror=()=>{zipLib=null;rej(new Error('No es pot carregar l\'eina de ZIP. Comprova la connexió.'));};document.head.appendChild(s);});return zipLib;}
const EXT={'image/png':'png','image/svg+xml':'svg','image/webp':'webp','image/jpeg':'jpg','video/mp4':'mp4','video/webm':'webm'};
const NAMES={logo:'logo',fons:'fons',icona_llanca:'icona-llanca'};
async function download(){const err=$('#dzZipErr');err.hidden=true;const nom=(st.nom||'').trim();
  if(!nom){err.hidden=false;err.textContent='Escriu el teu nom abans de descarregar.';$('#dzNom').focus();return;}
  try{const JSZip=await JSZipLib(),zip=new JSZip(),folder='disseny-'+(slug(nom)||'alumne'),z=zip.folder(folder);
    const t=tema();t._autor=nom;t._data=new Date().toISOString().slice(0,10);t.imatges={};
    for(const k in st.imgs){const m=String(st.imgs[k]).match(/^data:([^;]+);base64,(.*)$/);if(!m)continue;const file=NAMES[k]+'.'+(EXT[m[1]]||'png');z.file(file,m[2],{base64:true});t.imatges[k]=file;}
    z.file('tema.json',JSON.stringify(t,null,2));z.file('textos.json',JSON.stringify(st.textos,null,2));
    z.file('LLEGEIX-ME.txt',`Disseny de Castaween de ${nom}\n\nPer al professor:\n1. Copia la carpeta ${folder} dins de assets/ui/ del joc.\n2. Per provar-la: obre el joc amb ?ui=ui/${folder}\n3. Per fer-la servir sempre: a assets/assets.json posa  "ui": { "carpeta": "ui/${folder}" }\n`);
    const blob=await zip.generateAsync({type:'blob'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=folder+'.zip';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);
    toast('ZIP descarregat: '+folder+'.zip');}catch(e){err.hidden=false;err.textContent=e.message;}}
async function openZip(f){try{const JSZip=await JSZipLib(),zip=await JSZip.loadAsync(f);const find=n=>Object.values(zip.files).find(x=>!x.dir&&x.name.split('/').pop()===n);
    const tf=find('tema.json'),xf=find('textos.json');if(!tf&&!xf)throw new Error('Aquest ZIP no és un disseny de Castaween.');
    const t=tf?JSON.parse(await tf.async('string')):{},x=xf?JSON.parse(await xf.async('string')):{};
    const ns={nom:t._autor||st.nom,colors:t.colors||{},tipografies:t.tipografies||{},cantonades:t.cantonades??1,textos:{},imgs:{}};
    for(const k in x)if(k in base&&typeof x[k]==='string')ns.textos[k]=x[k];
    const mime=n=>Object.keys(EXT).find(m=>n.endsWith('.'+EXT[m]))||'image/png';
    for(const k in (t.imatges||{})){const zf=find(t.imatges[k]);if(zf)ns.imgs[k]=`data:${mime(t.imatges[k])};base64,`+await zf.async('base64');}
    st=ns;apply();render();toast('Disseny obert. Pots continuar!');}catch(e){toast(e.message||'No s\'ha pogut obrir el ZIP');}}

/* ---------- inici: espera que el joc del marc estigui a punt ---------- */
layout();$('#dzMain').innerHTML='<p class="help">Carregant el joc…</p>';
frame.addEventListener('load',()=>{let n=0;const wait=()=>{const A=frame.contentWindow&&frame.contentWindow.CastaweenUI;if(!A){if(++n<100)return setTimeout(wait,100);$('#dzMain').innerHTML='<p class="err">No s\'ha pogut carregar el joc. Obre aquesta pàgina des del servidor del joc (no fent doble clic al fitxer).</p>';return;}
  API=A;A.ready.then(()=>{base=A.base();screen='';apply();render();go('inici');});};wait();});
})();
