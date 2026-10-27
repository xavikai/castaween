import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateGLB} from '../model-validation.js';
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

test('all five teams share the same fire and stall model each round, including original rounds',()=>{
  const c=fixture(),models=[{id:'original',integrat:true},{id:'student-a'},{id:'student-b'}],places=Array.from({length:5},(_,team)=>({team}));
  for(const kind of ['foguera','paradeta'])for(let round=1;round<=6;round++){
    const groups=c.propAssignments(models,places,round,kind);
    assert.equal(groups.size,1,kind+' round '+round);
    const [[model,assigned]]=groups;
    assert.equal(model,models[(round-1)%3]);
    assert.equal(assigned.length,5);assert.ok(places.every(p=>assigned.includes(p)));
  }
  assert.equal(c.propAssignments(models,[],1,'foguera').size,0);
  assert.equal(c.propAssignments(models,places,1,'lapida').size,3,'other scenery still mixes variants');
  const manifest=JSON.parse(fs.readFileSync(new URL('../../assets/assets.json',import.meta.url)));
  for(const kind of ['foguera','paradeta'])for(let round=1;round<=4;round++){
    const [[model,assigned]]=c.propAssignments(manifest.escenari[kind],places,round,kind);
    assert.equal(model.integrat===true,round%2===0,'student model first, then original: '+kind+' round '+round);
    assert.equal(assigned.length,5);
  }
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

test('built-in proposals rotate alongside students and retain the original network fallback', async()=>{
  const calls=[],c=fixture({loadGLB:async(url,kind)=>{calls.push(url);return {kind};}});
  const list=await c.loadProposals([{integrat:true,id:'original'},{id:'student',fitxer:'student.glb'}],'carabassot');
  assert.equal(list.length,2);assert.equal(calls.length,1);
  c.ASSETS.mon.carabassot=list;
  assert.equal(c.nextAsset('mon','carabassot'),null);
  assert.equal(c.nextAsset('mon','carabassot').id,'student');
  assert.equal(c.nextAsset('mon','carabassot',''),null);
  assert.equal(c.nextAsset('mon','carabassot','original'),null);
  assert.equal(c.nextAsset('mon','carabassot'),null);
  const groups=c.propAssignments(list,[{}],2);
  assert.equal([...groups.keys()][0].id,'student');
});

test('all 25 student deliveries pass the actual GLB validator and keep their originals in rotation',async()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('../../assets/assets.json',import.meta.url)));
  const ids=new Set();let count=0;
  for(const group of ['monstres','escenari'])for(const [kind,list]of Object.entries(manifest[group])){
    assert.ok(list.some(a=>a.integrat===true),kind+' must retain original');
    for(const entry of list.filter(a=>a.fitxer?.includes('/alumnat/'))){
      assert.ok(!ids.has(entry.id));ids.add(entry.id);count++;
      assert.ok(entry.autor);const bytes=fs.readFileSync(new URL('../../assets/'+entry.fitxer,import.meta.url));
      const result=await validateGLB(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),kind);
      assert.equal(result.palette,'oficial',entry.fitxer);
    }
  }
  assert.equal(count,25);
  assert.ok(!manifest.castanyeres.some(a=>a.fitxer.includes('morticia')||a.autor==='Clara Gamell'));
  const boss=manifest.monstres.carabassot.find(a=>a.autor==='Clara Gamell');
  assert.equal(boss.nomCombat,'la Mortícia');
  assert.equal(manifest.escenari.portal.find(a=>a.autor==='Quim Paneque').altura,0.32);
});
