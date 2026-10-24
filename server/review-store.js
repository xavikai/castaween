import {MODEL_RULES,COURSES,ModelError,cleanText,validateGLB} from './model-validation.js';
const COOKIE='castaween_review',MAX_BYTES=100*1024*1024,MAX_ITEMS=500;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const digest=s=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(hex);
async function key(secret){return crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export class ReviewStore {
  constructor(state,env){this.storage=state.storage;this.env=env;}
  async sign(value){return hex(await crypto.subtle.sign('HMAC',await key(this.env.MODEL_REVIEW_PASSWORD),new TextEncoder().encode(value)));}
  async authenticated(request){const token=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';const [expiry,nonce,sig]=token.split('.');if(!/^\d+$/.test(expiry)||+expiry<Date.now()||+expiry>Date.now()+9*3600000||!nonce||!/^[a-f0-9]{64}$/.test(sig||''))return false;
    const bytes=Uint8Array.from(sig.match(/../g),h=>parseInt(h,16));return crypto.subtle.verify('HMAC',await key(this.env.MODEL_REVIEW_PASSWORD),bytes,new TextEncoder().encode(expiry+'.'+nonce));}
  async throttle(request,scope,max,ms){const ip=request.headers.get('CF-Connecting-IP')||'local',bucket=Math.floor(Date.now()/ms),name='rate:'+scope+':'+(await this.sign(ip)).slice(0,24);await this.storage.transaction(async tx=>{const old=await tx.get(name),n=old?.bucket===bucket?old.count+1:1;if(n>max)throw new ModelError('Massa intents. Torna-ho a provar més tard.',429);await tx.put(name,{bucket,count:n});});}
  async metadata(){return [...(await this.storage.list({prefix:'meta:',limit:MAX_ITEMS})).values()];}
  async fetch(request){
    try{return await this.handle(request);}catch(e){if(e instanceof ModelError)return json({error:e.message},e.status);console.error('Model review error:',e.name);return json({error:'No s’ha pogut completar l’operació. Torna-ho a provar.'},500);}
  }
  async handle(request){const url=new URL(request.url),path=url.pathname;
    if(!this.env.MODEL_REVIEW_PASSWORD)return json({error:'El professor encara no ha configurat les entregues.'},503);
    if(!['GET','POST'].includes(request.method))return json({error:'Mètode no admès'},405);
    if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Origen no admès'},403);
    if(request.method==='POST'&&+(request.headers.get('Content-Length')||0)>550*1024)return json({error:'Fitxer massa gran'},413);
    if(request.method==='POST'){
      const reader=request.body?.getReader(),chunks=[];let size=0;const limit=path==='/api/models/submit'?550*1024:4096;
      if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new ModelError('Petició massa gran',413);}chunks.push(value);}
      const body=new Uint8Array(size);let at=0;for(const chunk of chunks){body.set(chunk,at);at+=chunk.length;}request=new Request(request,{body});
    }
    if(path==='/api/models/config'&&request.method==='GET'){const intake=await this.storage.get('intake');return json({rules:MODEL_RULES,courses:COURSES,open:!!intake?.open&&intake.expires>Date.now()});}
    if(path==='/api/models/login'&&request.method==='POST'){
      await this.throttle(request,'login',6,15*60000);const data=await request.json();if(typeof data.password!=='string'||data.password.length>200||await digest(data.password)!==await digest(this.env.MODEL_REVIEW_PASSWORD))return json({error:'Contrasenya incorrecta'},401);
      const value=(Date.now()+8*3600000)+'.'+crypto.randomUUID(),token=value+'.'+await this.sign(value),secure=url.protocol==='https:'?'; Secure':'';
      const res=json({ok:true});res.headers.set('Set-Cookie',COOKIE+'='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800'+secure);return res;
    }
    if(path==='/api/models/logout'&&request.method==='POST'){const r=json({ok:true});r.headers.set('Set-Cookie',COOKIE+'=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+(url.protocol==='https:'?'; Secure':''));return r;}
    if(path==='/api/models/approved'&&request.method==='GET'){
      const result={castanyeres:[],monstres:{},escenari:{}};
      for(const m of await this.metadata())if(m.status==='approved'){const row={id:'online-'+m.id,nom:m.title,autor:m.name,curs:m.course,fitxer:url.origin+'/api/models/files/'+m.id};
        if(m.kind==='castanyera')result.castanyeres.push(row);else{const group=['carabassa','fantasma','carabassot'].includes(m.kind)?result.monstres:result.escenari;(group[m.kind]||=[]).push(row);}}
      const response=json(result);response.headers.set('Access-Control-Allow-Origin','*');return response;
    }
    if(path==='/api/models/submit'&&request.method==='POST'){
      await this.throttle(request,'submit',180,3600000);
      const form=await request.formData(),intake=await this.storage.get('intake');
      if(!intake?.open||intake.expires<Date.now())throw new ModelError('Les entregues estan tancades. Demana al professor que les obri.',403);
      if(form.get('code')!==intake.code)throw new ModelError('El codi d’entrega no és correcte.',403);
      if(form.get('palette')!=='official')throw new ModelError('Descarrega la paleta oficial i confirma que l’has utilitzat sense modificar-la.');
      const name=cleanText(form.get('name'),2,60,'el nom'),title=cleanText(form.get('title'),2,60,'el nom del model'),course=cleanText(form.get('course'),1,40,'el curs'),kind=form.get('kind'),file=form.get('file');
      if(!COURSES.includes(course)||!MODEL_RULES[kind])throw new ModelError('Curs o tipus de model incorrecte');
      if(!file||typeof file.arrayBuffer!=='function'||!file.name.toLowerCase().endsWith('.glb'))throw new ModelError('Selecciona un fitxer .glb');
      if(file.size>MODEL_RULES[kind].kb*1024)throw new ModelError('El fitxer supera el pes permès per a aquest tipus',413);
      const buffer=await file.arrayBuffer(),checks=await validateGLB(buffer,kind),id=crypto.randomUUID(),now=Date.now();
      const meta={id,name,title,course,kind,filename:file.name.replace(/[^a-zA-Z0-9._-]/g,'-').slice(0,100),created:now,status:'pending',checks,reason:''};
      await this.storage.transaction(async tx=>{const stats=await tx.get('stats')||{count:0,bytes:0},day=Math.floor(now/86400000),quota=await tx.get('daily')||{day,count:0};
        if(stats.count>=MAX_ITEMS||stats.bytes+buffer.byteLength>MAX_BYTES)throw new ModelError('L’espai d’entregues és ple. Contacta amb el professor.',409);
        if(quota.day===day&&quota.count>=200)throw new ModelError('S’ha arribat al límit d’entregues d’avui.',429);
        await tx.put({['meta:'+id]:meta,['file:'+id]:buffer,stats:{count:stats.count+1,bytes:stats.bytes+buffer.byteLength},daily:{day,count:quota.day===day?quota.count+1:1}});
      });return json({ok:true,id,status:'pending',message:'Model rebut. Queda pendent de revisió i encara no apareix al joc.'},201);
    }
    const fileMatch=/^\/api\/models\/(files|preview)\/([a-f0-9-]{36})$/.exec(path);
    if(fileMatch&&request.method==='GET'){const meta=await this.storage.get('meta:'+fileMatch[2]);if(!meta)return json({error:'Model no disponible'},404);
      const privateFile=fileMatch[1]==='preview';if(privateFile?!await this.authenticated(request):meta.status!=='approved')return json({error:'Model no disponible'},404);
      const buffer=await this.storage.get('file:'+meta.id);if(!buffer)return json({error:'Model no disponible'},404);
      const response=new Response(buffer,{headers:{'Content-Type':'model/gltf-binary','Content-Disposition':`inline; filename="${meta.filename}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});if(!privateFile)response.headers.set('Access-Control-Allow-Origin','*');return response;
    }
    if(!await this.authenticated(request))return json({error:'Inicia sessió com a professor.'},401);
    if(path==='/api/models/review'&&request.method==='GET'){const items=await this.metadata(),intake=await this.storage.get('intake')||{open:false},stats=await this.storage.get('stats')||{count:0,bytes:0};return json({items:items.sort((a,b)=>b.created-a.created),intake:{...intake,open:!!intake.open&&intake.expires>Date.now()},stats,limits:{bytes:MAX_BYTES,items:MAX_ITEMS,approved:100}});}
    if(path==='/api/models/intake'&&request.method==='POST'){const data=await request.json(),intake={open:data.open===true,code:String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000),expires:Date.now()+8*3600000};await this.storage.put('intake',intake);return json(intake);}
    const decision=/^\/api\/models\/review\/([a-f0-9-]{36})$/.exec(path);
    if(decision&&request.method==='POST'){const data=await request.json();if(!['approved','rejected','pending'].includes(data.status))throw new ModelError('Decisió incorrecta');const reason=typeof data.reason==='string'?data.reason.trim().slice(0,500):'';
      await this.storage.transaction(async tx=>{const meta=await tx.get('meta:'+decision[1]);if(!meta)throw new ModelError('Model no trobat',404);
        if(data.status==='approved'&&meta.status!=='approved'){const list=await tx.list({prefix:'meta:',limit:MAX_ITEMS});if([...list.values()].filter(m=>m.status==='approved').length>=100)throw new ModelError('Màxim 100 propostes aprovades. Retira’n alguna abans de publicar-ne més.',409);}
        await tx.put('meta:'+meta.id,{...meta,status:data.status,reason,reviewed:Date.now()});});return json({ok:true});}
    return json({error:'Ruta no disponible'},404);
  }
}
