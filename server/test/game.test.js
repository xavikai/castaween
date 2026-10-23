// Exercise the actual inline networking functions without WebGL or a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
function code(from,to){return html.slice(html.indexOf(`function ${from}(`),html.indexOf(`function ${to}(`));}
function run(source,context){vm.createContext(context);vm.runInContext(source,context);return context;}

test('nicknames in the elimination feed are escaped as text',()=>{
  const messages=[];const c=run(code('showElimination','dropLog'),{addFeed:html=>messages.push(html)});
  c.showElimination({cause:'<b>Pau</b>',nom:'Marta & <img>'});
  assert.equal(messages[0],'<b>&lt;b&gt;Pau&lt;/b&gt;</b> elimina <b>Marta &amp; &lt;img&gt;</b>');
});

test('inputs are capped at 10 Hz, sent only on changes, taps include release',()=>{
  const messages=[],NET={role:'client',tap:false,build:false,upgrade:false,lastInput:0,input:''};
  const S={spectator:false,keys:{KeyD:true},joy:{x:0,y:0}};
  const c=run(code('netInputs','step').split('/* ---------- bucle ---------- */')[0],{NET,S,netRound:n=>Math.round(n*100)/100,netSend:m=>{messages.push(m);return true;}});
  c.netInputs(100);c.netInputs(120);c.netInputs(1000);assert.equal(messages.length,1);
  S.keys={};c.netInputs(1100);NET.tap=true;c.netInputs(1150);assert.equal(messages.length,2);
  c.netInputs(1200);c.netInputs(1300);assert.deepEqual(messages.map(m=>m.tir),[false,false,true,false]);
  assert.equal(messages[0].mx,1);assert.equal(messages[1].mx,0);
});
test('deltas contain only changed fields; a joining snapshot preserves broadcast baseline',()=>{
  let rows=new Map([['1',{id:'1',k:'c',x:1.23,z:2,hp:100,name:'A'}]]);const sent=[];
  const NET={role:'host',seq:0,previous:new Map(),events:[]},S={phase:'play',round:1,time:300,night:false};
  const c=run(code('netBroadcast','netDispose'),{NET,S,TEAMS:[{stock:10,wins:0,hitT:0,delivered:0,queue:[]}],netCapture:()=>rows,netRound:n=>n,netId:o=>o.id,netSend:m=>sent.push(m)});
  c.netBroadcast();assert.equal(sent[0].full,true);
  rows=new Map([['1',{id:'1',k:'c',x:1.25,z:2,hp:90,name:'A'}]]);c.netBroadcast('new');assert.equal(sent[1].to,'new');assert.equal(NET.previous.get('1').x,1.23);
  c.netBroadcast();assert.equal(sent[2].full,false);assert.equal(sent[2].up[0].x,1.25);assert.equal(sent[2].up[0].name,undefined);assert.equal(sent[2].events[0].t,'impacte');
  rows=new Map();c.netBroadcast();assert.equal(sent[3].del[0],'1');
});

function roomFixture(){
  const t={id:0,active:[],members:[],queue:[]},S={cast:[],follow:null,player:null},NET={peers:new Map()};
  function add(human,id){const m={team:t,human,peer:id,state:'active',name:id,mesh:{g:{},bar:{g:{}}}};t.members.push(m);t.active.push(m);S.cast.push(m);return m;}
  for(let i=0;i<10;i++)add(false,'bot'+i);
  const c=run(code('netRemove','netLook'),{NET,S,TEAMS:[t],SLOTS:10,scene:{remove(){}},clearNameTag(){},leaveArena:m=>{t.active=t.active.filter(x=>x!==m);},dropCarry(){},spawn:m=>{m.state='active';t.active.push(m);},botLook:()=>({}),netLook:x=>x,netRoster(){},netBroadcast(){},netMember:(team,nom,look,id)=>{const m={team,name:nom,human:!!id,peer:id,state:'queue',mesh:{g:{},bar:{g:{}}}};t.members.push(m);S.cast.push(m);return m;}});
  return {c,t,S,NET};
}
test('ten human slots, FIFO waitlist, disconnect promotes queue then restores bot',()=>{
  const {c,t,NET}=roomFixture();for(let i=0;i<11;i++)c.netHostMessage({t:'join',id:'p'+i,curs:0,nom:'p'+i,look:{}});
  assert.equal(t.active.length,10);assert.equal(t.queue[0].peer,'p10');assert.equal(t.members.filter(m=>!m.human).length,0);
  c.netHostMessage({t:'leave',id:'p0'});assert.equal(t.active.length,10);assert.equal(t.queue.length,0);assert.equal(NET.peers.get('p10').state,'active');
  c.netHostMessage({t:'leave',id:'p1'});assert.equal(t.active.length,10);assert.equal(t.members.filter(m=>!m.human).length,1);
});
test('respawning human keeps their slot when an eleventh person joins',()=>{
  const {c,t,NET}=roomFixture();for(let i=0;i<10;i++)c.netHostMessage({t:'join',id:'p'+i,curs:0,nom:'p'+i,look:{}});
  const p=NET.peers.get('p0');t.active=t.active.filter(x=>x!==p);p.state='respawning';
  c.netHostMessage({t:'join',id:'p10',curs:0,nom:'p10',look:{}});
  assert.equal(t.active.length,9);assert.equal(t.queue[0].peer,'p10');
});
