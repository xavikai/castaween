// Local QA only: serves the game and adds explicit test controls with ?qa=1.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const qa=`
const qa=document.createElement('details');qa.id='qa';qa.style='position:fixed;top:0;left:0;z-index:99999;background:#151522;color:white;font:11px monospace;max-height:35vh;overflow:auto;max-width:100vw';qa.innerHTML='<summary>QA local</summary><button id="qaMove">Mou 1 segon</button><button id="qaFire">Llança</button><button id="qaDown">Cau primera persona</button><button id="qaTurn">Final de torn</button><button id="qaEnd">Final de ronda</button><pre id="qaReport"></pre>';document.body.appendChild(qa);
$('#qaMove').onclick=()=>{S.keys.KeyD=true;setTimeout(()=>S.keys.KeyD=false,1000);};
$('#qaFire').onclick=()=>tryPlayerThrow();
$('#qaDown').onclick=()=>{const m=S.cast.find(c=>c.peer&&c.state==='active');if(m)downCast(m,'prova local');};
$('#qaTurn').onclick=()=>{const m=S.cast.find(c=>c.peer&&c.state==='active'&&c.team.queue.length);if(m)m.turn=89.99;};
$('#qaEnd').onclick=()=>S.time=.01;
setInterval(()=>{$('#qaReport').textContent=JSON.stringify({role:NET.role,code:S.code,phase:S.phase,seq:NET.received,peers:NET.peers.size,replicas:NET.replicas.size,player:S.player&&{name:S.player.name,state:S.player.state,x:+S.player.pos.x.toFixed(2),z:+S.player.pos.z.toFixed(2),hp:S.player.hp,look:S.player.look},teams:TEAMS.map(t=>({active:(t.active||[]).length,human:(t.active||[]).filter(c=>c.human).length,bots:(t.members||[]).filter(c=>!c.human).length,queue:(t.queue||[]).map(c=>c.name)})),people:S.cast.filter(c=>c.peer).map(c=>({id:c.peer,name:c.name,state:c.state,x:+c.pos.x.toFixed(2),z:+c.pos.z.toFixed(2),turn:+c.turn.toFixed(2)})),projectiles:[...NET.replicas.values()].filter(e=>e.netData.k==='p').length},null,1);},100);
`;
http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),rel=decodeURIComponent(url.pathname).slice(1)||'index.html';
  if(rel==='mobile'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><html><head><title>Castaween · mòbil 390 × 844</title></head><body style="margin:0;background:#111;display:flex;justify-content:center"><iframe title="Mòbil 390 × 844" src="/?qa=1" width="390" height="844" style="border:0"></iframe></body></html>');}
  if(!(rel==='index.html'||rel==='cifog-logo.png'||rel.startsWith('assets/'))){res.writeHead(404);return res.end();}
  const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png','.css':'text/css','.js':'text/javascript','.mp3':'audio/mpeg','.wav':'audio/wav','.glb':'model/gltf-binary'})[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
    if(rel==='index.html'&&url.searchParams.has('qa'))data=Buffer.from(data.toString().replace('\n})();','\n'+qa+'\n})();'));res.end(data);
  });
}).listen(53781,'127.0.0.1',()=>console.log('QA: http://127.0.0.1:53781/?qa=1'));
