import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const section=(start,end)=>html.slice(html.indexOf('function '+start+'('),html.indexOf('function '+end+'('));
function fixture(role=null){
  const nodes=new Map(),teams=Array.from({length:5},(_,id)=>({id,name:'Equip '+id,short:'E'+id,css:'#fff',stock:10,wins:0,active:[],members:[],queue:[]}));
  const $=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',innerHTML:'',style:{setProperty(){}}});return nodes.get(id);};
  const S={phase:'play',round:1,scoredRound:0,code:'1234',pTeam:0,spectator:false,cast:[],joy:{on:false},player:{delivered:0}},NET={role,offline:!role,previous:new Map([['old',{}]]),replicas:new Map(),received:0};
  const c={S,NET,TEAMS:teams,MATCH_WINS:2,$,localSessions:{finish(){},start(){}},sfx(){},joyEl:{},projPool:[],SLOTS:15,feedEl:{},hudT:0,banner(){},netTrack(){},spawn(){},resetRound(){for(const t of teams)t.stock=10;}};
  vm.createContext(c);vm.runInContext(section('roundWinner','resetRound')+section('endRound','openPause'),c);
  function end(winner){teams.forEach(t=>t.stock=t.id===winner?30:10);S.phase='play';c.endRound();}
  return{c,S,NET,teams,$,end};
}

test('two wins end the match at 2–0 and repeated results never count twice',()=>{
  const f=fixture();f.end(0);assert.equal(f.teams[0].wins,1);assert.equal(f.$('#nextBtn').hidden,false);
  f.c.endRound();assert.equal(f.teams[0].wins,1);
  f.c.nextRound();assert.equal(f.S.round,2);f.end(0);
  assert.equal(f.c.matchWinner(f.teams),f.teams[0]);
  assert.equal(f.$('#resLabel').textContent,'Equip guanyador de la partida');
  assert.equal(f.$('#nextBtn').hidden,true);assert.equal(f.$('#rematchBtn').hidden,false);
  f.c.nextRound();assert.equal(f.S.round,2);assert.equal(f.S.phase,'results');
});

test('a 2–1 match ends on the third round',()=>{
  const f=fixture();f.end(0);f.c.nextRound();f.end(1);
  assert.equal(f.c.matchWinner(f.teams),null);f.c.nextRound();f.end(0);
  assert.equal(f.S.round,3);assert.equal(f.teams[0].wins,2);assert.equal(f.teams[1].wins,1);
  assert.equal(f.$('#resWinner').textContent,'Equip 0');
});

test('five teams can play extra rounds until one earns a second win',()=>{
  const f=fixture();
  for(let winner=0;winner<5;winner++){
    f.end(winner);assert.equal(f.c.matchWinner(f.teams),null);
    if(f.S.round>=3){assert.equal(f.$('#nextBtn').textContent,'Ronda de desempat');assert.match(f.$('#resSummary').textContent,/ronda de desempat/);}
    f.c.nextRound();
  }
  assert.equal(f.S.round,6);f.end(0);assert.equal(f.c.matchWinner(f.teams),f.teams[0]);
});

test('a tied round awards no wins and does not create a false match champion',()=>{
  const f=fixture();f.end(null);f.c.endRound();
  assert.ok(f.teams.every(t=>t.wins===0));assert.equal(f.$('#resWinner').textContent,'Empat');
  assert.match(f.$('#resSummary').textContent,/cap equip suma/);f.c.nextRound();assert.equal(f.S.round,2);
});

test('a rematch clears scores and starts round one while preserving room and members',()=>{
  const f=fixture('host'),member={name:'Alumne',state:'active'};f.teams[0].members.push(member);
  f.end(0);f.c.nextRound();f.end(0);f.c.restartMatch();
  assert.equal(f.S.round,1);assert.equal(f.S.phase,'play');assert.equal(f.S.scoredRound,0);
  assert.ok(f.teams.every(t=>t.wins===0));assert.equal(f.teams[0].members[0],member);assert.equal(f.S.code,'1234');
  assert.equal(f.NET.previous.size,0);
  f.end(1);assert.equal(f.teams[1].wins,1);
});

test('clients display authoritative wins without awarding points or advancing rounds',()=>{
  const f=fixture('client');f.teams[0].wins=2;f.end(0);
  assert.equal(f.teams[0].wins,2);assert.equal(f.$('#resLabel').textContent,'Equip guanyador de la partida');
  assert.equal(f.$('#nextBtn').hidden,true);assert.equal(f.$('#rematchBtn').hidden,true);
  f.c.nextRound();f.c.restartMatch();assert.equal(f.S.round,1);assert.equal(f.teams[0].wins,2);
});

test('full snapshots and missed round transitions refresh client results and the final winner',()=>{
  const f=fixture('client');f.S.phase='results';f.S.spectator=true;f.S.player.team=f.teams[0];
  Object.assign(f.c,{performance:{now:()=>1},netDispose(){},clearWorld(){},netRoster(){},refreshProps(){}});
  vm.runInContext(section('netReceive','netInterpolate'),f.c);
  const packet=(round,seq,full,wins)=>({seq,full,up:[],del:[],meta:{phase:'results',round,time:0,night:false,queues:f.teams.map(()=>[]),teams:f.teams.map((t,i)=>({stock:10,wins:wins[i]||0}))}});
  f.c.netReceive(packet(3,1,true,[1,1,1]));
  assert.match(f.$('#resSummary').textContent,/ronda de desempat/);
  f.c.netReceive(packet(4,2,false,[1,2,1]));
  assert.equal(f.$('#resWinner').textContent,'Equip 1');assert.equal(f.$('#resLabel').textContent,'Equip guanyador de la partida');
  f.c.netReceive(packet(4,3,true,[1,2,1]));assert.equal(f.teams[1].wins,2);
});
