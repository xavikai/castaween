// Local QA only: serves the game and adds explicit test controls with ?qa=1.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const proposals=process.argv.includes('--proposals');
function proposalManifest(){const man=JSON.parse(fs.readFileSync(path.join(root,'assets/assets.json'))),entry=(kind,id,file)=>({id,nom:id,autor:'Prova local',fitxer:'referencies/'+(file||kind)+'-referencia.glb'});
  man.monstres={carabassa:[entry('carabassa','alumna-a'),entry('carabassa','alumne-b','carabassot')],fantasma:'referencies/fantasma-referencia.glb',carabassot:[entry('carabassot','boss-a'),entry('carabassot','boss-b')]};
  man.escenari={};for(const k of ['castanyer','pi','portal','paradeta','torradora','panellet','llenya','caixa'])man.escenari[k]=[entry(k,k+'-a'),entry(k,k+'-b'),entry(k,k+'-c')];return man;}
const qa=`
const proposalsReport=document.createElement('pre');proposalsReport.id='qaProposals';proposalsReport.style='position:fixed;bottom:0;left:0;background:#151522;color:white;z-index:99999;font:10px monospace;max-width:390px;max-height:20vh;overflow:auto';document.body.appendChild(proposalsReport);
setInterval(()=>{proposalsReport.textContent=JSON.stringify({loaded:ASSETS.loaded,errors:ASSETS.errors,round:S.round,static:Object.fromEntries(Object.entries(PROPS).filter(([k,p])=>p.applied).map(([k,p])=>[k,[...new Set(p.applied.map(o=>o.userData.assetId))]])),monsters:S.mons.map(m=>m.mesh.g.userData.assetId||''),objects:[...S.crates,...S.pans,...S.logs].map(o=>o.g?.userData.assetId||'')});},1000);
const qa=document.createElement('details');qa.id='qa';qa.style='position:fixed;top:0;left:0;z-index:99999;background:#151522;color:white;font:11px monospace;max-height:35vh;overflow:auto;max-width:100vw';qa.innerHTML='<summary>QA local</summary><button id="qaMove">Mou 1 segon</button><button id="qaFire">Llança</button><button id="qaDown">Cau primera persona</button><button id="qaTurn">Final de torn</button><button id="qaEnd">Final de ronda</button><pre id="qaReport"></pre>';document.body.appendChild(qa);
$('#qaMove').onclick=()=>{S.keys.KeyD=true;setTimeout(()=>S.keys.KeyD=false,1000);};
$('#qaFire').onclick=()=>tryPlayerThrow();
$('#qaDown').onclick=()=>{const m=S.cast.find(c=>c.peer&&c.state==='active');const killer=S.cast.find(c=>c.peer&&c!==m);if(m)downCast(m,killer?who(killer):'prova local');};
$('#qaTurn').onclick=()=>{const m=S.cast.find(c=>c.peer&&c.state==='active'&&c.team.queue.length);if(m)m.turn=89.99;};
$('#qaEnd').onclick=()=>S.time=.01;
const variantsButton=document.createElement('button');variantsButton.id='qaVariants';variantsButton.textContent='Mostra propostes';qa.appendChild(variantsButton);variantsButton.onclick=()=>{for(let i=0;i<3;i++){spawnMonster('pumpkin');dropLog(i,0);spawnPanellet(false);spawnCrate('fire',i,2);}spawnMonster('ghost');TEAMS[0].stock=100;for(let i=0;i<3;i++)buildTower(TEAMS[0],null);};
setInterval(()=>{$('#qaReport').textContent=JSON.stringify({role:NET.role,code:S.code,phase:S.phase,seq:NET.received,peers:NET.peers.size,replicas:NET.replicas.size,player:S.player&&{name:S.player.name,state:S.player.state,x:+S.player.pos.x.toFixed(2),z:+S.player.pos.z.toFixed(2),hp:S.player.hp,look:S.player.look},teams:TEAMS.map(t=>({active:(t.active||[]).length,human:(t.active||[]).filter(c=>c.human).length,bots:(t.members||[]).filter(c=>!c.human).length,queue:(t.queue||[]).map(c=>c.name)})),people:S.cast.filter(c=>c.peer).map(c=>({id:c.peer,name:c.name,state:c.state,x:+c.pos.x.toFixed(2),z:+c.pos.z.toFixed(2),turn:+c.turn.toFixed(2)})),projectiles:[...NET.replicas.values()].filter(e=>e.netData.k==='p').length},null,1);},100);
`;
http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),rel=decodeURIComponent(url.pathname).slice(1)||'index.html';
  if(proposals&&rel==='assets/assets.json'){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify(proposalManifest()));}
  if(rel==='mobile'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><html><head><title>Castaween · mòbil 390 × 844</title></head><body style="margin:0;background:#111;display:flex;justify-content:center"><iframe title="Mòbil 390 × 844" src="'+(url.searchParams.has('clean')?'/':'/?qa=1')+'" width="390" height="844" style="border:0"></iframe></body></html>');}
  if(!(rel==='index.html'||rel==='cifog-logo.png'||rel.startsWith('assets/'))){res.writeHead(404);return res.end();}
  const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png','.css':'text/css','.js':'text/javascript','.mp3':'audio/mpeg','.wav':'audio/wav','.glb':'model/gltf-binary'})[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
    if(rel==='index.html'&&url.searchParams.has('qa'))data=Buffer.from(data.toString().replace('\n})();','\n'+qa+'\n})();'));res.end(data);
  });
}).listen(53781,'127.0.0.1',()=>console.log('QA: http://127.0.0.1:53781/?qa=1'));
