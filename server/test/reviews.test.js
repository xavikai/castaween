import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ReviewStore} from '../review-store.js';
import {MODEL_RULES,validateGLB} from '../model-validation.js';
import {UPLOAD_PAGE,REVIEW_PAGE,VIEWER_JS} from '../model-pages.js';
const origin='https://review.example',password='test-only-password-not-a-production-secret';
const buffer=file=>{const b=fs.readFileSync(new URL('../../'+file,import.meta.url));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const glb=()=>buffer('server/test/fixtures/carabassa-paleta.glb');
class MemoryStorage {
  constructor(){this.data=new Map();this.serial=Promise.resolve();}
  async get(k){return structuredClone(this.data.get(k));}
  async put(k,v){if(typeof k==='object'){for(const [key,value]of Object.entries(k))this.data.set(key,structuredClone(value));}else this.data.set(k,structuredClone(v));}
  async list({prefix='',limit=1000}={}){return new Map([...this.data].filter(([k])=>k.startsWith(prefix)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)]));}
  async transaction(fn){const run=this.serial.then(async()=>{const old=structuredClone(this.data);try{return await fn(this);}catch(e){this.data=old;throw e;}});this.serial=run.catch(()=>{});return run;}
}
function fixture(){const storage=new MemoryStorage(),store=new ReviewStore({storage},{MODEL_REVIEW_PASSWORD:password});let cookie='';
  const request=async(path,{body,method=body===undefined?'GET':'POST',auth=false,headers={}}={})=>{const h={'Origin':origin,'CF-Connecting-IP':'127.0.0.1',...headers};if(auth)h.Cookie=cookie;let data=body;if(body!==undefined&&!(body instanceof FormData)){h['Content-Type']='application/json';data=JSON.stringify(body);}return store.fetch(new Request(origin+'/api/models/'+path,{method,headers:h,body:data}));};
  const login=async()=>{const response=await request('login',{body:{password}});assert.equal(response.status,200);cookie=response.headers.get('Set-Cookie').split(';')[0];return cookie;};
  return {storage,store,request,login};
}
function submission(code,bytes=glb()){const f=new FormData();for(const [k,v]of Object.entries({name:'Alumna <test>',title:'La dentuda',course:'3D i videojocs',kind:'carabassa',code,palette:'official'}))f.set(k,v);f.set('file',new Blob([bytes],{type:'model/gltf-binary'}),'marta.glb');return f;}
function mutateGLB(fn){const original=glb(),v=new DataView(original),size=v.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(original.slice(20,20+size))),bin=original.slice(28+size);fn(json);let text=new TextEncoder().encode(JSON.stringify(json));const padded=new Uint8Array(Math.ceil(text.length/4)*4);padded.fill(32);padded.set(text);const out=new Uint8Array(28+padded.length+bin.byteLength),d=new DataView(out.buffer);d.setUint32(0,0x46546c67,true);d.setUint32(4,2,true);d.setUint32(8,out.length,true);d.setUint32(12,padded.length,true);d.setUint32(16,0x4e4f534a,true);out.set(padded,20);d.setUint32(20+padded.length,bin.byteLength,true);d.setUint32(24+padded.length,0x004e4942,true);out.set(new Uint8Array(bin),28+padded.length);return out.buffer;}

test('the official palette is mandatory; untextured references and other textures are rejected',async()=>{
  for(const kind of Object.keys(MODEL_RULES))if(kind!=='castanyera')await assert.rejects(validateGLB(buffer('assets/referencies/'+kind+'-referencia.glb'),kind),/paleta|material/,kind);
  assert.equal((await validateGLB(buffer('assets/castanyeres/castanyera-nova.glb'),'castanyera')).triangles,1450);
  assert.equal((await validateGLB(buffer('assets/plantilles/plantilla-castanyera.glb'),'castanyera')).palette,'oficial');
  const ok=await validateGLB(glb(),'carabassa');assert.equal(ok.palette,'oficial');
  assert.equal((await validateGLB(buffer('server/test/fixtures/carabassa-paleta-antiga.glb'),'carabassa')).palette,'antiga');
  // Same size, different pixels: a repainted palette is not accepted.
  await assert.rejects(validateGLB(buffer('server/test/fixtures/carabassa-paleta-modificada.glb'),'carabassa'),/píxels modificats/);
  // One channel, one pixel, outside all former sample points: still rejected.
  await assert.rejects(validateGLB(buffer('server/test/fixtures/carabassa-paleta-pixel.glb'),'carabassa'),/píxels modificats/);
  await assert.rejects(validateGLB(mutateGLB(json=>{json.images[0].bufferView=json.bufferViews.push({buffer:0,byteOffset:0,byteLength:8})-1;}),'carabassa'),/paleta/);
  await assert.rejects(validateGLB(mutateGLB(json=>{delete json.materials[0].pbrMetallicRoughness.baseColorTexture;}),'carabassa'),/paleta/);
  await assert.rejects(validateGLB(mutateGLB(json=>{json.images.push({...json.images[0]});json.textures.push({source:1});}),'carabassa'),/paleta/);
});
test('reject malformed GLB, external resources, oversized accessors and cyclic nodes',async()=>{
  await assert.rejects(validateGLB(new ArrayBuffer(40),'carabassa'));
  for(const mutate of [j=>j.buffers[0].uri='https://attacker.invalid/track',j=>j.accessors[0].count=1e9,j=>j.nodes[0].children=[0],j=>j.bufferViews[0].byteLength=9e9])await assert.rejects(validateGLB(mutateGLB(mutate),'carabassa'));
  await assert.rejects(validateGLB(buffer('assets/plantilles/castanyera-actual-referencia.glb'),'castanyera'),/triangles/);
});
test('login is private, sessions expire, CSRF and unauthenticated review are rejected',async()=>{
  const f=fixture();assert.equal((await f.request('review')).status,401);
  assert.equal((await f.request('login',{body:{password:'incorrect'}})).status,401);
  assert.equal((await f.request('login',{body:{password},headers:{Origin:'https://other.invalid'}})).status,403);
  const cookie=await f.login();assert.match(cookie,/castaween_review=/);assert.equal((await f.request('review',{auth:true})).status,200);
  const value='1.'+crypto.randomUUID(),token=value+'.'+await f.store.sign(value);
  assert.equal((await f.request('review',{headers:{Cookie:'castaween_review='+token}})).status,401);
});
test('delivery code gates uploads, pending bytes are private, approval publishes and rejection withdraws',async()=>{
  const f=fixture();await f.login();assert.equal((await f.request('submit',{body:submission('123456')})).status,403);
  const opened=await (await f.request('intake',{auth:true,body:{open:true}})).json();
  assert.equal((await f.request('submit',{body:submission('000000')})).status,403);
  const response=await f.request('submit',{body:submission(opened.code)});assert.equal(response.status,201);const {id}=await response.json();
  assert.deepEqual((await (await f.request('approved')).json()).monstres,{});
  assert.equal((await f.request('files/'+id)).status,404);assert.equal((await f.request('preview/'+id)).status,404);
  assert.equal((await f.request('preview/'+id,{auth:true})).status,200);
  assert.equal((await f.request('review/'+id,{body:{status:'approved'}})).status,401);
  assert.equal((await f.request('review/'+id,{auth:true,body:{status:'approved'}})).status,200);
  const approved=await (await f.request('approved')).json();assert.equal(approved.monstres.carabassa.length,1);assert.equal(approved.monstres.carabassa[0].autor,'Alumna <test>');
  const file=await f.request('files/'+id);assert.equal(file.status,200);assert.equal(file.headers.get('Access-Control-Allow-Origin'),'*');assert.deepEqual(await file.arrayBuffer(),glb());
  await f.request('review/'+id,{auth:true,body:{status:'rejected',reason:'Revisa la paleta'}});
  assert.equal((await f.request('files/'+id)).status,404);assert.deepEqual((await (await f.request('approved')).json()).monstres,{});
  assert.equal((await f.request('preview/'+id,{auth:true})).status,200,'rejection is recoverable');
});
test('closed intake, per-kind file limits, quota and storage caps reject without persisting files',async()=>{
  const f=fixture();await f.login();const intake=await (await f.request('intake',{auth:true,body:{open:true}})).json();
  assert.equal((await f.request('submit',{body:submission(intake.code,new ArrayBuffer(260*1024))})).status,413);
  await f.storage.put('stats',{count:500,bytes:0});assert.equal((await f.request('submit',{body:submission(intake.code)})).status,409);assert.equal((await f.storage.list({prefix:'file:'})).size,0);
  await f.request('intake',{auth:true,body:{open:false}});assert.equal((await f.request('submit',{body:submission(intake.code)})).status,403);
});
test('portal scripts parse and never inject student metadata as HTML',()=>{
  new Function(VIEWER_JS);for(const page of [UPLOAD_PAGE,REVIEW_PAGE])for(const s of page.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(s[1]);
  assert.ok(REVIEW_PAGE.includes('name.textContent=m.title'));assert.ok(REVIEW_PAGE.includes('info.textContent=m.name'));assert.ok(!REVIEW_PAGE.includes('innerHTML='));
});
