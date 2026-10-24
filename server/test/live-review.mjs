// Integration against a real Wrangler/Cloudflare Durable Object. Leaves the test
// model rejected, and restores closed intake if this test opened it.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://127.0.0.1:8787';
const vars=fs.readFileSync(new URL('../.dev.vars',import.meta.url),'utf8');
const password=/^MODEL_REVIEW_PASSWORD=(.+)$/m.exec(vars)?.[1].trim();
if(!password)throw Error('Missing local review password');
let cookie='',testId,opened=false;
async function api(path,body,auth=false){const headers={Origin:origin};if(auth)headers.Cookie=cookie;
  if(body!==undefined&&!(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
  return fetch(origin+'/api/models/'+path,{method:body===undefined?'GET':'POST',headers,body});}
function form(code,filename){const f=new FormData();for(const [key,value]of Object.entries({name:'Prova tècnica',title:'[PROVA] Entrega i revisió',course:'3D i videojocs',kind:'carabassa',code,palette:'official'}))f.set(key,value);f.set('file',new Blob([fs.readFileSync(new URL(filename,import.meta.url))],{type:'model/gltf-binary'}),'prova.glb');return f;}
try{
  assert.equal((await api('review')).status,401);
  const login=await api('login',{password});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
  const state=await (await api('review',undefined,true)).json();let intake=state.intake;
  if(!intake.open){intake=await (await api('intake',{open:true},true)).json();opened=true;}
  const invalid=await api('submit',form(intake.code,'fixtures/carabassa-paleta-modificada.glb'));assert.equal(invalid.status,400);console.log('PASS: altered palette rejected');
  const submitted=await api('submit',form(intake.code,'fixtures/carabassa-paleta.glb'));
  const receipt=await submitted.json();assert.equal(submitted.status,201,JSON.stringify(receipt));testId=receipt.id;
  assert.equal((await api('files/'+testId)).status,404);assert.equal((await api('preview/'+testId)).status,404);
  const preview=await api('preview/'+testId,undefined,true);assert.equal(preview.status,200);assert.ok((await preview.arrayBuffer()).byteLength>1000);console.log('PASS: pending model is private and teacher preview works');
  assert.equal((await api('review/'+testId,{status:'approved'},true)).status,200);
  const approved=await api('approved'),manifest=await approved.json();assert.ok(manifest.monstres.carabassa.some(m=>m.id==='online-'+testId));assert.equal(approved.headers.get('access-control-allow-origin'),'*');
  assert.equal((await api('files/'+testId)).status,200);console.log('PASS: teacher approval publishes the model automatically');
  assert.equal((await api('review/'+testId,{status:'rejected',reason:'Prova tècnica acabada; no és una entrega de l’alumnat.'},true)).status,200);
  assert.equal((await api('files/'+testId)).status,404);console.log('PASS: rejection withdraws public access');
}finally{
  if(testId)await api('review/'+testId,{status:'rejected',reason:'Prova tècnica acabada.'},true);
  if(opened)await api('intake',{open:false},true);
  await api('logout',{},true);
}
