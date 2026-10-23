import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
function source(a,b){return html.slice(html.indexOf('function '+a+'('),html.indexOf(b,html.indexOf('function '+a+'(')));}
function fixture(extra={}){const c={ASSETS:{mon:{},prop:{},errors:[]},...extra};vm.createContext(c);vm.runInContext(source('assetEntries','// ----- so:'),c);return c;}
test('legacy paths, single proposal and multiple credited proposals coexist',()=>{
  const c=fixture();assert.equal(c.assetEntries('monstres/a.glb')[0].fitxer,'monstres/a.glb');
  const proposal={id:'marta',autor:'Marta',fitxer:'escenari/marta.glb'};
  assert.equal(c.assetEntries(proposal)[0],proposal);
  assert.equal(c.assetEntries([null,{},'',proposal,'monstres/b.glb']).length,2);
});
test('one broken proposal does not prevent valid classmates from loading; duplicate ids are rejected',async()=>{
  const c=fixture({loadGLB:async(url,kind)=>{if(url.includes('broken'))throw Error('404');return {kind};}});
  const list=await c.loadProposals([{id:'a',nom:'A',autor:'Anna',curs:'3D',fitxer:'a.glb'},'broken.glb',{id:'a',fitxer:'copy.glb'},'b.glb'],'fantasma');
  assert.equal(list.length,2);assert.equal(list[0].autor,'Anna');assert.equal(list[0].curs,'3D');assert.equal(list[1].id,'b.glb');assert.equal(c.ASSETS.errors.length,2);
});
test('dynamic proposals rotate fairly per type, while explicit network ids never consume a turn',()=>{
  const c=fixture();c.ASSETS.mon.carabassa=[{id:'a'},{id:'b'},{id:'c'}];c.ASSETS.prop.panellet=[{id:'p'},{id:'q'}];
  const picks=Array.from({length:8},()=>c.nextAsset('mon','carabassa').id);
  assert.deepEqual(picks,['a','b','c','a','b','c','a','b']);
  assert.equal(c.nextAsset('mon','carabassa','a').id,'a');assert.equal(c.nextAsset('mon','carabassa','unknown'),null);assert.equal(c.nextAsset('mon','carabassa',''),null);
  assert.equal(c.nextAsset('mon','carabassa').id,'c');assert.equal(c.nextAsset('prop','panellet').id,'p');assert.equal(c.nextAsset('prop','none'),null);
});
test('scenery distributes models evenly, rotating the next batch each round including a single portal',()=>{
  const c=fixture(),models=Array.from({length:7},(_,i)=>({id:i})),places=Array.from({length:3},(_,i)=>({i}));
  const seen=[];for(let round=1;round<=3;round++){const groups=c.propAssignments(models,places,round);assert.equal([...groups.values()].flat().length,3);seen.push(...[...groups.keys()].map(a=>a.id));}
  assert.deepEqual(seen,[0,1,2,3,4,5,6,0,1]);
  assert.equal([...c.propAssignments(models,[{}],7).keys()][0].id,6);
  const counts=[...c.propAssignments(models,Array.from({length:50},()=>({})),1).values()].map(v=>v.length);assert.equal(Math.max(...counts)-Math.min(...counts),1);
});
test('network snapshots preserve the chosen model for every dynamic asset',()=>{
  const g=id=>({userData:{assetId:id}}),o=(id,extra={})=>({pos:{x:1,y:0,z:2},mesh:{g:g(id)},g:g(id),vel:{x:0,z:0},...extra});
  const c={S:{cast:[],mons:[o('monster',{hp:4,type:'pumpkin'})],logs:[o('log')],pans:[o('sweet')],crates:[o('box')],towers:[o('tower',{team:{id:0},hp:80})],puddles:[]},projPool:[],netId:o=>o.g.userData.assetId,netRound:n=>n};
  vm.createContext(c);vm.runInContext(source('netCapture','function netBroadcast('),c);
  assert.deepEqual([...c.netCapture().values()].map(d=>d.v),['monster','log','sweet','box','tower']);
});
test('replicas use host model ids instead of their local alternation order',()=>{
  class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}}
  const calls=[],S={crates:[],puddles:[]};const mesh=(kind,id)=>{calls.push([kind,id]);return {g:{}};};
  const c={THREE:{Vector3},TEAMS:[{}],S,MON:{pumpkin:{}},makeMonster:(type,id)=>mesh('m',id),makeTowerMesh:(team,id)=>mesh('t',id),makePanellet:(gold,id)=>mesh('a',id),spawnCrate:(type,x,z,id)=>{calls.push(['b',id]);S.crates.push({});},nextAsset:()=>({}),makeLog:id=>{calls.push(['l',id]);return {};}};
  vm.createContext(c);vm.runInContext(source('netReplica','function netReceive('),c);
  for(const k of ['m','t','a','b','l'])c.netReplica({k,type:'pumpkin',v:'proposal-'+k,x:0,y:0,z:0});
  assert.deepEqual(calls,[['m','proposal-m'],['t','proposal-t'],['a','proposal-a'],['b','proposal-b'],['l','proposal-l']]);
});
