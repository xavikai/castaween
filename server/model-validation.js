// Standalone GLB checks: do not trust extensions, filenames or browser verdicts.
import {PALETTE_SIZE,PALETTE_RGBA_SHA256,LEGACY_RGBA_SHA256} from './palette-signature.js';
export const COURSES = ['3D i videojocs','Audiovisuals','Fotografia','Disseny','Gràfica interactiva'];
export const MODEL_RULES = {
  castanyera:{label:'Castanyera',tris:1500,bones:20,kb:400,h:1.8},
  carabassa:{label:'Carabassa',tris:800,bones:12,kb:250,h:1.5},fantasma:{label:'Fantasma',tris:800,bones:12,kb:250,h:1.9},carabassot:{label:'Carabassot',tris:2000,bones:20,kb:500,h:3.3},
  castanyer:{label:'Castanyer',tris:500,kb:150,h:4.3},pi:{label:'Pi del bosc',tris:200,kb:80,h:6},casa:{label:'Casa del poble',tris:800,kb:250,h:4.6},
  roca:{label:'Roca',tris:150,kb:60,h:1.4},marge:{label:'Tram de marge',tris:100,kb:60,h:1.1},lapida:{label:'Làpida',tris:150,kb:60,h:.85},
  'arbre-sec':{label:'Arbre sec',tris:300,kb:100,h:3.2},'carabassa-deco':{label:'Carabassa decorativa',tris:300,kb:100,h:.65},cripta:{label:'Cripta',tris:800,kb:250,h:4},
  portal:{label:'Portal',tris:1500,kb:400,h:1.6},paradeta:{label:'Paradeta',tris:1500,kb:400,h:3.6},foguera:{label:'Foguera',tris:800,kb:250,h:1},
  torradora:{label:'Torradora',tris:600,kb:200,h:1.3},caixa:{label:"Caixa d'armes",tris:200,kb:80,h:.6},panellet:{label:'Panellet',tris:200,kb:80,h:.55},llenya:{label:'Tronc de llenya',tris:80,kb:40,h:.24}
};
export class ModelError extends Error { constructor(message,status=400){super(message);this.status=status;} }
const fail = message => { throw new ModelError(message); };
export function cleanText(value,min,max,label){if(typeof value!=='string')fail('Falta '+label);const s=value.trim();if(s.length<min||s.length>max||/[\x00-\x1f\x7f]/.test(s))fail(label+' no vàlid');return s;}
export async function validateGLB(buffer,kind){
  const rule=MODEL_RULES[kind];if(!rule)fail('Tipus de model desconegut');
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<28)fail('GLB incomplet');
  if(buffer.byteLength>rule.kb*1024)throw new ModelError('El model supera els '+rule.kb+' KB permesos',413);
  const v=new DataView(buffer);if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==buffer.byteLength)fail('Cal un glTF Binary (.glb) 2.0 vàlid');
  let offset=12,doc,bin=null,chunks=0;
  while(offset<buffer.byteLength){if(offset+8>buffer.byteLength)fail('Capçalera GLB truncada');const length=v.getUint32(offset,true),type=v.getUint32(offset+4,true);offset+=8;
    if(length%4||offset+length>buffer.byteLength)fail('Blocs GLB incorrectes');
    if(chunks===0&&type!==0x4e4f534a)fail('Falta el bloc JSON');
    if(type===0x4e4f534a){if(doc)fail('JSON duplicat');try{doc=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer.slice(offset,offset+length)).trim());}catch{fail('JSON GLB incorrecte');}}
    else if(type===0x004e4942){if(bin)fail('BIN duplicat');bin=buffer.slice(offset,offset+length);}
    else fail('Bloc GLB no admès');offset+=length;chunks++;
  }
  if(!doc||doc.asset?.version!=='2.0'||!bin||!Array.isArray(doc.buffers)||doc.buffers.length!==1||doc.buffers[0].uri)fail('Exporta un GLB autocontingut, sense recursos externs');
  const int=n=>Number.isSafeInteger(n)&&n>=0;
  if(!int(doc.buffers[0].byteLength)||doc.buffers[0].byteLength>bin.byteLength)fail('Buffer incorrecte');
  // No remote files, data URIs, compressed or linked assets. Only embedded PNG.
  let visited=0;
  function inspect(node,depth=0){if(typeof node==='number'&&!Number.isFinite(node))fail('Valors no finits');if(!node||typeof node!=='object')return;if(depth>40||++visited>20000)fail('Estructura GLB massa complexa');for(const [k,val]of Object.entries(node)){if(k==='uri'||k==='url')fail('No s’admeten recursos externs ni data URI');if(k==='extensions'&&val&&['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu','EXT_mesh_gpu_instancing'].some(x=>x in val))fail('Exporta sense compressió ni instàncies GPU');inspect(val,depth+1);}}
  inspect(doc);
  if((doc.extensionsRequired||[]).some(x=>!['KHR_materials_unlit','KHR_texture_transform'].includes(x)))fail('El model necessita una extensió no admesa');
  const views=doc.bufferViews||[],accessors=doc.accessors||[];
  if(views.length>500||accessors.length>500||(doc.nodes||[]).length>300||(doc.meshes||[]).length>100)fail('Model massa complex');
  for(const b of views){if(b.buffer!==0||!int(b.byteOffset||0)||!int(b.byteLength)||(b.byteOffset||0)+b.byteLength>doc.buffers[0].byteLength||(b.byteStride!==undefined&&(!int(b.byteStride)||b.byteStride<4||b.byteStride>252)))fail('Vista de buffer fora de límits');}
  const bytes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
  for(const a of accessors){const b=views[a.bufferView],size=bytes[a.componentType]*width[a.type];if(a.sparse||!b||!size||!int(a.count)||a.count>100000||!int(a.byteOffset||0))fail('Accessor no admès');const stride=b.byteStride||size;if(stride<size||(a.byteOffset||0)+(a.count?((a.count-1)*stride+size):0)>b.byteLength)fail('Accessor fora del buffer');}
  let triangles=0;
  if(!Array.isArray(doc.meshes)||!doc.meshes.length)fail('El fitxer no té cap malla');
  for(const mesh of doc.meshes){if(!Array.isArray(mesh.primitives)||!mesh.primitives.length)fail('Malla buida');for(const p of mesh.primitives){if((p.mode??4)!==4||p.targets?.length)fail('Exporta triangles sense shape keys');const pos=accessors[p.attributes?.POSITION],index=p.indices===undefined?null:accessors[p.indices];if(!pos||pos.type!=='VEC3'||pos.componentType!==5126||(p.indices!==undefined&&(!index||index.type!=='SCALAR'||![5121,5123,5125].includes(index.componentType))))fail('Malla incorrecta');const n=(index||pos).count;if(n%3)fail('Triangles incomplets');triangles+=n/3;
    for(const id of Object.values(p.attributes||{}))if(!accessors[id]||accessors[id].count!==pos.count)fail('Atributs de malla incoherents');
  }}
  if(!triangles||triangles>rule.tris)fail('El model té '+triangles+' triangles; el màxim és '+rule.tris);
  if((doc.materials||[]).length>1)fail('Fes servir un sol material');
  const bones=Math.max(0,...(doc.skins||[]).map(s=>(s.joints||[]).length));if(bones>(rule.bones||0))fail('Supera el nombre d’ossos permès');
  // The official palette is mandatory: exactly one embedded PNG, identical to paleta-castaween.png
  // (or the legacy 256 px palette, which the game remaps to the top-left quadrant).
  const PAL_MSG='Cal la paleta oficial (paleta-castaween.png) com a única textura, sense modificar-la';
  if((doc.images||[]).length!==1||(doc.textures||[]).length!==1)fail(PAL_MSG);
  const bv=new DataView(bin),image=doc.images[0],ib=views[image.bufferView],io=ib?.byteOffset||0;
  if(!ib||ib.byteLength<33||image.mimeType!=='image/png'||bv.getUint32(io)!==0x89504e47||bv.getUint32(io+4)!==0x0d0a1a0a)fail(PAL_MSG+' (PNG incrustat)');
  const w=bv.getUint32(io+16),h=bv.getUint32(io+20),legacy=w===256&&h===256;
  if(!(legacy||(w===PALETTE_SIZE&&h===PALETTE_SIZE)))fail(PAL_MSG+': la textura fa '+w+' × '+h+' px');
  const px=await decodePNG(new Uint8Array(bin,io,ib.byteLength)).catch(e=>fail(PAL_MSG+': '+e.message));
  const rgba=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)rgba.set(px(x,y),(y*w+x)*4);
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',rgba))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==(legacy?LEGACY_RGBA_SHA256:PALETTE_RGBA_SHA256))fail(PAL_MSG+': hi ha píxels modificats');
  const usesTexture=(doc.materials||[]).some(m=>m.pbrMetallicRoughness?.baseColorTexture?.index===0);
  if(!usesTexture)fail(PAL_MSG+': el material no fa servir la paleta com a color base');
  for(const mesh of doc.meshes)for(const p of mesh.primitives)if(p.attributes?.TEXCOORD_0===undefined)fail('Hi ha peces sense UV: totes han d’estar mapejades a la paleta');
  // Bound node graph traversal and prohibit cycles before any GLTFLoader sees it.
  const nodes=doc.nodes||[],visiting=new Set(),done=new Set();
  function walk(i,depth){if(!int(i)||!nodes[i]||depth>40||visiting.has(i))fail('Jerarquia de nodes incorrecta');if(done.has(i))return;visiting.add(i);for(const child of nodes[i].children||[])walk(child,depth+1);visiting.delete(i);done.add(i);}
  nodes.forEach((_,i)=>walk(i,0));
  for(const a of accessors)if(a.componentType===5126){const b=views[a.bufferView],stride=b.byteStride||width[a.type]*4;for(let i=0;i<a.count;i++)for(let k=0;k<width[a.type];k++)if(!Number.isFinite(bv.getFloat32((b.byteOffset||0)+(a.byteOffset||0)+i*stride+k*4,true)))fail('Coordenades no finites');}
  return {triangles,bones,materials:(doc.materials||[]).length,bytes:buffer.byteLength,animations:(doc.animations||[]).map(a=>String(a.name||'Sense nom').slice(0,40)),textured:true,palette:legacy?'antiga':'oficial'};
}

// Minimal PNG reader (8-bit, non-interlaced): enough to compare the palette pixels.
async function inflate(data,limit){const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate')).getReader(),chunks=[];let length=0;for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw Error('PNG descomprimit massa gran');}chunks.push(value);}const out=new Uint8Array(length);let at=0;for(const chunk of chunks){out.set(chunk,at);at+=chunk.length;}return out;}
async function decodePNG(u8){
  const v=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);let o=8,w=0,h=0,depth=0,type=-1,interlace=0,plte=null,alpha=null;const idat=[];
  while(o+12<=u8.length){const len=v.getUint32(o),name=String.fromCharCode(...u8.subarray(o+4,o+8));if(o+12+len>u8.length)throw new Error('PNG truncat');const d=u8.subarray(o+8,o+8+len);
    if(name==='IHDR'){if(w||o!==8||len!==13)throw Error('En-tête PNG incorrecte');w=v.getUint32(o+8);h=v.getUint32(o+12);depth=u8[o+16];type=u8[o+17];interlace=u8[o+20];if(w!==h||![256,PALETTE_SIZE].includes(w)||u8[o+18]||u8[o+19])throw Error('Mides o compressió PNG incorrectes');}
    else if(name==='PLTE')plte=d;else if(name==='tRNS')alpha=d;else if(name==='IDAT')idat.push(d);else if(name==='IEND')break;o+=12+len;}
  const ch={0:1,2:3,3:1,4:2,6:4}[type];if(depth!==8||!ch||interlace||(type===3&&!plte))throw new Error('exporta-la com a PNG de 8 bits sense entrellaçat');
  if(alpha&&type!==3)throw Error('No afegeixis transparències a la paleta');
  const total=idat.reduce((a,d)=>a+d.length,0);if(total>4*1024*1024)throw new Error('PNG massa gran');
  const joined=new Uint8Array(total);let k=0;for(const d of idat){joined.set(d,k);k+=d.length;}
  const stride=w*ch,raw=await inflate(joined,(stride+1)*h);if(raw.length!==(stride+1)*h)throw new Error('PNG incomplet');
  const out=new Uint8Array(stride*h);
  for(let y=0;y<h;y++){const f=raw[y*(stride+1)],src=y*(stride+1)+1,row=y*stride;
    for(let x=0;x<stride;x++){const a=x>=ch?out[row+x-ch]:0,b=y?out[row-stride+x]:0,c=x>=ch&&y?out[row-stride+x-ch]:0,r=raw[src+x];let val;
      if(f===0)val=r;else if(f===1)val=r+a;else if(f===2)val=r+b;else if(f===3)val=r+((a+b)>>1);else if(f===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);val=r+(pa<=pb&&pa<=pc?a:pb<=pc?b:c);}else throw new Error('filtre PNG desconegut');
      out[row+x]=val&255;}}
  return (x,y)=>{const i=y*stride+x*ch;if(type===3){const q=out[i]*3;if(q+2>=plte.length)throw Error('Índex PNG incorrecte');return [plte[q],plte[q+1],plte[q+2],alpha?.[out[i]]??255];}if(ch<=2)return [out[i],out[i],out[i],ch===2?out[i+1]:255];return [out[i],out[i+1],out[i+2],ch===4?out[i+3]:255];};
}
