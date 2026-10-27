import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const read=file=>fs.readFileSync(new URL('../../'+file,import.meta.url));
const sw=read('sw.js').toString(), pwa=read('assets/pwa.js').toString();
function offlineManifest(){const c={self:{}};vm.createContext(c);vm.runInContext(read('assets/pwa-files.js').toString(),c);return c.self.CASTAWEEN_OFFLINE;}
function workerFixture(){
  const handlers={},stores=new Map(),calls=[];let online=true,body='fresh',claimed=false;
  const scope='https://game.example/castaween/';
  const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return{async put(key,response){map.set(typeof key==='string'?key:key.url,response.clone());},async match(key){return map.get(typeof key==='string'?key:key.url)?.clone();}};},async keys(){return [...stores.keys()];},async delete(key){return stores.delete(key);}};
  const self={registration:{scope},CASTAWEEN_OFFLINE:{version:'test',files:['index.html','assets/config.json']},addEventListener(name,fn){handlers[name]=fn;},clients:{async claim(){claimed=true;}}};
  const c={self,caches,URL,Request,importScripts(){},async fetch(request){if(!online)throw Error('offline');calls.push(typeof request==='string'?request:request.url);return new Response(body);}};
  vm.createContext(c);vm.runInContext(sw,c);
  const event=async name=>{let promise;handlers[name]({waitUntil(p){promise=p;}});await promise;};
  return {c,stores,caches,calls,self,event,scope,online(value){online=value;},body(value){body=value;},claimed:()=>claimed};
}
const request=(url,{method='GET',mode='cors',range=false}={})=>({url,method,mode,headers:new Headers(range?{Range:'bytes=0-10'}:{})});

test('install manifest has stable scope, standalone launch and valid PNG app icons',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.id,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
  assert.ok(!manifest.prefer_related_applications);
  for(const size of [192,512]){
    const icon=manifest.icons.find(i=>i.sizes===size+'x'+size&&i.purpose==='any');assert.ok(icon);
    const bytes=read(icon.src);assert.equal(bytes.readUInt32BE(0),0x89504e47);assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
  }
  assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
  const html=read('index.html').toString();assert.match(html,/rel="manifest" href="manifest.webmanifest"/);assert.match(html,/rel="apple-touch-icon"/);
});

test('offline package covers all game models, sounds and self-hosted scripts, without documents or secrets',()=>{
  const offline=offlineManifest(),files=new Set(offline.files),manifest=JSON.parse(read('assets/assets.json'));
  for(const entry of manifest.castanyeres)assert.ok(files.has('assets/'+entry.fitxer));
  for(const group of ['monstres','escenari'])for(const variants of Object.values(manifest[group]))for(const e of variants)if(e.fitxer)assert.ok(files.has('assets/'+e.fitxer),e.fitxer);
  for(const group of ['efectes','musica'])for(const file of Object.values(manifest.so[group]))assert.ok(files.has('assets/'+file));
  for(const [,src]of read('index.html').toString().matchAll(/<script[^>]+src="([^"]+)"/g)){assert.ok(!src.startsWith('https:'));assert.ok(files.has(src));}
  for(const file of files){assert.ok(!/server|\.dev\.vars|\.zip$|\.pdf$|documentacio/.test(file));assert.ok(read(file).length);}
  const hash=crypto.createHash('sha256');for(const file of [...offline.files,'sw.js']){hash.update(file);const bytes=read(file);hash.update(/\.(?:html|js|json|css|webmanifest)$/.test(file)?bytes.toString().replace(/\r\n/g,'\n'):bytes);}
  assert.equal(offline.version,hash.digest('hex').slice(0,16),'rebuild offline manifest after changes');
  assert.match(read('assets/vendor/three-r128/LICENSE').toString(),/MIT License/);
});

test('service worker prepares the complete static cache before activation',async()=>{
  const f=workerFixture();await f.event('install');
  assert.deepEqual(f.calls.sort(),[f.scope+'assets/config.json',f.scope+'index.html']);
  assert.equal([...f.stores.values()][0].size,2);
});

test('worker excludes private APIs, statistics, other origins, POSTs, ranges and debug pages',()=>{
  const f=workerFixture(),allowed=(path,options)=>f.c.cacheable(request(f.scope+path,options));
  assert.equal(allowed('?app=1',{mode:'navigate'}),true);
  assert.equal(allowed('index.html',{mode:'navigate'}),true);
  assert.equal(allowed('assets/config.json'),true);
  assert.equal(allowed('assets/monstres/alumnat/new.glb'),true);
  assert.equal(allowed('api/estat'),false);assert.equal(allowed('api/local',{method:'POST'}),false);
  assert.equal(allowed('?qa=1',{mode:'navigate'}),false);assert.equal(allowed('?disseny',{mode:'navigate'}),false);
  assert.equal(allowed('revisio',{mode:'navigate'}),false);assert.equal(allowed('assets/config.json',{range:true}),false);
  assert.equal(f.c.cacheable(request('https://worker.example/api/models/approved')),false);
});

test('network-first navigation refreshes cached code and falls back to it offline',async()=>{
  const f=workerFixture();await f.event('install');f.body('new game');
  const nav=request(f.scope+'?app=1',{mode:'navigate'});
  assert.equal(await(await f.c.gameResponse(nav)).text(),'new game');
  f.online(false);assert.equal(await(await f.c.gameResponse(nav)).text(),'new game');
  assert.equal(await(await f.c.gameResponse(request(f.scope+'assets/config.json'))).text(),'fresh');
});

test('activation cleans only this app scope and preserves unrelated browser caches',async()=>{
  const f=workerFixture();await f.event('install');
  f.stores.set('castaween-game-/castaween/-old',new Map());f.stores.set('another-app',new Map());f.stores.set('castaween-game-/other/-v1',new Map());
  await f.event('activate');assert.equal(f.stores.has('castaween-game-/castaween/-old'),false);
  assert.ok(f.stores.has('another-app'));assert.ok(f.stores.has('castaween-game-/other/-v1'));assert.ok(f.claimed());
});

function installFixture({ios=false,installed=false}={}){
  const events={},nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,open:false,textContent:'',listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);};
  const window={self:null,top:null,isSecureContext:true,addEventListener(name,fn){events[name]=fn;}};window.self=window;window.top=window;
  const c={window,URL,URLSearchParams,location:{search:''},matchMedia:()=>({matches:installed}),navigator:{userAgent:ios?'iPhone Safari':'Chrome',platform:ios?'iPhone':'Win32',maxTouchPoints:ios?5:0},document:{currentScript:{src:'https://game.example/castaween/assets/pwa.js'},getElementById:node,readyState:'loading'}};
  vm.createContext(c);vm.runInContext(pwa,c);return {events,node};
}
test('installation uses the native prompt once and retains instructions after a dismissal',async()=>{
  const f=installFixture();let prompted=0,prevented=false;
  f.events.beforeinstallprompt({preventDefault(){prevented=true;},async prompt(){prompted++;},userChoice:Promise.resolve({outcome:'dismissed'})});
  await f.node('installBtn').listeners.click();assert.equal(prompted,1);assert.ok(prevented);assert.equal(f.node('installBtn').hidden,false);
  await f.node('installBtn').listeners.click();assert.ok(f.node('installDialog').open);
  f.events.appinstalled();assert.equal(f.node('installBtn').hidden,true);
});
test('iPhone instructions show Add to Home Screen and installed apps hide the install action',async()=>{
  const f=installFixture({ios:true});await f.node('installBtn').listeners.click();assert.match(f.node('installHelp').textContent,/pantalla d’inici/);
  f.node('installClose').listeners.click();assert.equal(f.node('installDialog').open,false);
  assert.equal(installFixture({installed:true}).node('installBtn').hidden,true);
});
