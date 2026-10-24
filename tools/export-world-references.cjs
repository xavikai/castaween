// Extract real procedural models, using the same three.js r128 as the game.
// node tools/export-world-references.cjs /path/to/three-r128.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const THREE=require(path.resolve(process.argv[2]));
if(THREE.REVISION!=='128')throw Error('Cal three.js r128');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function section(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);if(a<0||b<a)throw Error('No es troba '+start);return html.slice(a,b);}
const source=[section('function addSmoothNormals(','// material cartoon'),section('const rand=','/* ---------- Three ---------- */'),section('const M=','/* ---------- efectes gràfics ---------- */'),section('const crateGeo=','function spawnCrate('),section('const BUDGET=','const MON_KEY='),section('Object.assign(BUDGET,','for(const k in BUDGET)')].join('\n');
let seed=20261023;const seeded=Object.create(Math);seeded.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
// The only canvas in this geometry section is the stall's lettering. Keep its
// sign geometry, but do not export the generated lettering texture.
const context=vm.createContext({THREE,Math:seeded,document:{createElement(){return {getContext(){return {fillRect(){},strokeRect(){},fillText(){}};}};}}});
vm.runInContext(`const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
const ASSETS={mon:{},prop:{}},MON_KEY={pumpkin:'carabassa',ghost:'fantasma',boss:'carabassot'};
function markShadows(){}function nextAsset(){return null;}\n${source}\n`+`
globalThis.models={PROPS,BUDGET,scene,makeMonster,makeTowerMesh,makePanellet,logBodyGeo,castMat,crateGeo,crateM,bandGeo,crateBand,TEAMS};`,context);
const R=context.models;R.scene.updateMatrixWorld(true);
const out=path.join(root,'assets','referencies');fs.mkdirSync(out,{recursive:true});
const hash=crypto.createHash('sha256').update(source).digest('hex');
const notes={castanyer:'Exemplar determinista amb copa i eriçons del peu; els arbres del joc varien.',pi:'Exemplar determinista de dues copes; els pins del joc varien.',marge:'Un segment del marge: alçada 1,10 m i llargada X 1,20 m; ajust independent de X per encaixar la repetició.',foguera:'Olla, vora, franja i troncs. Les flames i guspires són efectes del joc i no formen part del model substituïble.',paradeta:'Inclou taulell, tendal, sacs i productes. El rètol conserva la geometria però no la textura de text.',caixa:'Caixa base amb franja de foc. La icona flotant, el text i els halos els afegeix el joc.',panellet:'Panellet normal, sense halo, contorn lluminós ni feix de llum.',llenya:'Tronc recollible actual, sense halo ni contorn lluminós.'};
function nearest(places,x,z){let best=0,d=Infinity;places.forEach((p,i)=>{const n=(x-p.x)**2+(z-p.z)**2;if(n<d){best=i;d=n;}});return best;}
function collect(o,matrix,list,instanceColor){
  if(!o.isMesh||o.userData.noShadow||o.material.isShaderMaterial)return;
  // Baking transforms keeps Blender's imported dimensions independent of parents.
  let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(matrix);
  if(!g.attributes.normal)g.computeVertexNormals();
  const count=g.attributes.position.count,colors=new Float32Array(count*3),original=g.attributes.color;
  const material=Array.isArray(o.material)?o.material[0]:o.material;
  for(let i=0;i<count;i++){
    const c=material.map?new THREE.Color(0x5a3a22):material.color.clone();
    if(instanceColor)c.multiply(instanceColor);
    if(original&&material.vertexColors)c.multiply(new THREE.Color(original.getX(i),original.getY(i),original.getZ(i)));
    colors.set([c.r,c.g,c.b],i*3);
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  list.push({g,opacity:material.transparent?material.opacity:1,doubleSide:material.side===THREE.DoubleSide});
}
function groupMeshes(group){group.updateMatrixWorld(true);const list=[];group.traverse(o=>collect(o,o.matrixWorld,list));return list;}
function propMeshes(kind){const P=R.PROPS[kind],pl=P.places[0],list=[];
  const local=new THREE.Matrix4().compose(new THREE.Vector3(pl.x,pl.y||0,pl.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),pl.ry||0),new THREE.Vector3(pl.s||1,pl.s||1,pl.s||1)).invert();
  for(const o of P.objs){
    if(o.isInstancedMesh){for(let i=0;i<o.count;i++){const im=new THREE.Matrix4();o.getMatrixAt(i,im);const world=o.matrixWorld.clone().multiply(im),p=new THREE.Vector3().setFromMatrixPosition(world);
      if(nearest(P.places,p.x,p.z)!==0)continue;
      let color;if(o.instanceColor){color=new THREE.Color();o.getColorAt(i,color);}collect(o,local.clone().multiply(world),list,color);
    }}else{
      const p=new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
      if(nearest(P.places,p.x,p.z)!==0)continue;
      o.traverse(child=>collect(child,local.clone().multiply(child.matrixWorld),list));
    }
  }
  return list;
}
function encode(meshes,meta){const chunks=[],views=[],accessors=[],materials=[],materialKeys=new Map();let length=0;
  function attribute(a,type,min,max){const data=Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength);views.push({buffer:0,byteOffset:length,byteLength:data.length,target:34962});chunks.push(data);length+=data.length;
    const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}
    const v={bufferView:views.length-1,componentType:5126,count:a.count,type};if(min)v.min=min;if(max)v.max=max;accessors.push(v);return accessors.length-1;}
  const gltfMeshes=meshes.map(({g,opacity,doubleSide},i)=>{const key=opacity+'|'+doubleSide;let material=materialKeys.get(key);
    if(material===undefined){material=materials.length;materialKeys.set(key,material);materials.push({name:'Colors originals',pbrMetallicRoughness:{baseColorFactor:[1,1,1,opacity],metallicFactor:0,roughnessFactor:1},...(opacity<1?{alphaMode:'BLEND'}:{}),...(doubleSide?{doubleSided:true}:{})});}
    return {name:meta.id+'-'+(i+1),primitives:[{attributes:{POSITION:attribute(g.attributes.position,'VEC3',g.boundingBox.min.toArray(),g.boundingBox.max.toArray()),NORMAL:attribute(g.attributes.normal,'VEC3'),COLOR_0:attribute(g.attributes.color,'VEC3')},material,mode:4}]};});
  const doc={asset:{version:'2.0',generator:'Castaween · export-world-references.cjs'},scene:0,scenes:[{nodes:meshes.map((_,i)=>i)}],nodes:meshes.map((_,i)=>({mesh:i,name:meta.id+'-'+(i+1)})),meshes:gltfMeshes,materials,buffers:[{byteLength:length}],bufferViews:views,accessors,extras:meta};
  let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(chunks),h=Buffer.alloc(12);h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+json.length+bin.length,8);
  function chunk(b,type){const h=Buffer.alloc(8);h.writeUInt32LE(b.length);h.writeUInt32LE(type,4);return Buffer.concat([h,b]);}
  return Buffer.concat([h,chunk(json,0x4e4f534a),chunk(bin,0x004e4942)]);
}
const entries=[];
for(const [kind,B]of Object.entries(R.BUDGET)){
  if(kind==='castanyera')continue;
  let meshes;
  if(kind==='carabassa'||kind==='fantasma'||kind==='carabassot')meshes=groupMeshes(R.makeMonster({carabassa:'pumpkin',fantasma:'ghost',carabassot:'boss'}[kind]).rig);
  else if(kind==='torradora')meshes=groupMeshes(R.makeTowerMesh(R.TEAMS[0]).g);
  else if(kind==='panellet'){const g=R.makePanellet(false);g.children.filter(o=>o.userData.noShadow||o.geometry?.type==='RingGeometry').forEach(o=>g.remove(o));meshes=groupMeshes(g);}
  else if(kind==='llenya')meshes=groupMeshes(new THREE.Mesh(R.logBodyGeo,R.castMat));
  else if(kind==='caixa'){const g=new THREE.Group();g.add(new THREE.Mesh(R.crateGeo,R.crateM),new THREE.Mesh(R.bandGeo,R.crateBand.fire));meshes=groupMeshes(g);}
  else meshes=propMeshes(kind);
  if(!meshes.length)throw Error('Model buit: '+kind);
  const box=new THREE.Box3();for(const {g}of meshes){g.computeBoundingBox();box.union(g.boundingBox);}
  const original=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),s=B.h/original.y,sx=kind==='marge'?1.2/original.x:s;
  const final=new THREE.Box3();for(const {g}of meshes){g.translate(-center.x,-box.min.y,-center.z);g.scale(sx,s,s);g.computeBoundingBox();final.union(g.boundingBox);}
  const size=final.getSize(new THREE.Vector3()),triangles=meshes.reduce((n,{g})=>n+g.attributes.position.count/3,0);
  if(Math.abs(size.y-B.h)>1e-5||Math.abs(final.min.y)>1e-5||Math.abs(final.getCenter(new THREE.Vector3()).x)>1e-5||!Number.isFinite(size.x+size.y+size.z))throw Error('Mides incorrectes: '+kind);
  const metadata={id:kind,name:B.label,category:['carabassa','fantasma','carabassot'].includes(kind)?'monstres':['castanyer','pi','arbre-sec'].includes(kind)?'arbres':'objectes',file:kind+'-referencia.glb',units:'metres',height_m:B.h,width_m:+size.x.toFixed(6),depth_m:+size.z.toFixed(6),up_gltf:'+Y',front_gltf:'+Z',up_blender:'+Z',front_blender:'-Y',origin:'centre de la base, a terra',animated:false,triangles,student_triangle_budget:B.tris,student_size_budget_kb:B.kb,source:'index.html: geometria procedural integrada',geometry_source_sha256:hash,seed:20261023,note:notes[kind]||'Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes.'};
  const glb=encode(meshes,metadata);fs.writeFileSync(path.join(out,metadata.file),glb);metadata.bytes=glb.length;entries.push(metadata);
}
fs.writeFileSync(path.join(out,'mides-models.json'),JSON.stringify({units:'metres',blender:{unit_system:'METRIC',scale_length:1,up:'+Z',front:'-Y'},note:'Referències estàtiques, no entregues optimitzades. Mides d’alçada normatives; amplada i fondària orientatives, excepte marge X=1,20 m.',models:entries},null,2)+'\n');
// Keep the visible table in sync with the downloadable measurement manifest.
const fmt=n=>n.toLocaleString('ca-ES',{minimumFractionDigits:3,maximumFractionDigits:3});
const rows=category=>entries.filter(m=>m.category===category).map(m=>`<tr><th scope="row"><a href="referencies/${m.file}" download>${m.name} · GLB</a></th><td>${fmt(m.height_m)}</td><td>${fmt(m.width_m)}</td><td>${fmt(m.depth_m)}</td></tr>`).join('\n');
const catalog=['<section id="resta-models">','<h2>Monstres, arbres i objectes</h2>','<p>Models integrats del joc, ajustats a les alçades de la guia d’entrega. Dimensions en metres a Blender: alçada Z, amplada X i fondària Y. Els arbres i les pedres són exemplars de les variants del joc.</p>','<p><a class="download" href="referencies/castaween-referencies.zip" download>Descarrega totes les referències · ZIP</a></p>','<p><a href="referencies/mides-models.json" download>Mides exactes de tots els models · JSON</a> · <a href="referencies/LLEGEIX-ME.md" download>Instruccions i detalls de cada model</a></p>',...['monstres','arbres','objectes'].map(cat=>`<h3>${{monstres:'Monstres',arbres:'Arbres',objectes:'Objectes i construccions'}[cat]}</h3><div class="model-table"><table><thead><tr><th>Descarrega el model</th><th>Alt</th><th>Ample</th><th>Fons</th></tr></thead><tbody>${rows(cat)}</tbody></table></div>`),'<p class="note">Referències estàtiques amb colors originals per vèrtex, sense esquelets ni animacions. No inclouen halos, ombres, flames ni altres efectes dinàmics. Les entregues han de complir la paleta i els límits de la guia; aquests GLB poden superar-los. El marge té 1,20 m de llarg per poder-se repetir.</p>','</section>'].join('\n');
const page=path.join(root,'assets','index.html'),content=fs.readFileSync(page,'utf8'),start='<!-- WORLD-REFERENCES:START -->',end='<!-- WORLD-REFERENCES:END -->';
if(!content.includes(start)||!content.includes(end))throw Error('Falten marcadors del catàleg');
fs.writeFileSync(page,content.slice(0,content.indexOf(start))+start+'\n'+catalog+'\n'+content.slice(content.indexOf(end)));
const instructions=`# Referències de monstres, arbres i objectes\n\n1 unitat = 1 metre. Blender: Metric, Unit Scale 1.000, Length Meters. Importa GLB sense redimensionar. Eix Z amunt, cara principal cap a −Y, origen al centre de la base a terra. glTF fa servir +Y amunt i +Z davant; Blender converteix els eixos.\n\nEls models són instantànies de la geometria real d’index.html, amb colors per vèrtex, transformacions aplicades i sense esquelet ni animacions. Les alçades són les de la guia d’entrega: el joc no s’ha modificat. L’amplada i fondària ajuden a comparar proporcions; el marge sí que ha de fer 1,20 m de llarg (X).\n\nEl JSON conté les mides exactes i els triangles de cada fitxer. Els models procedurals aleatoris s’exporten amb llavor fixa: són un exemplar, no totes les variants. Exclou-los de l’exportació de la teva entrega. Aplica Ctrl+A → All Transforms i exporta GLB amb +Y Up.\n\nAquests fitxers són referències de mides, no entregues optimitzades. Per entregar-ne una versió, cal texturitzar-la amb la paleta oficial obligatòria (\`assets/paleta-castaween.png\`), que és l’única textura admesa, i comprovar els pressupostos de triangles i les animacions a ASSETS.md i al Taller. Les flames, llums, halos i textos flotants els afegeix el joc.\n\n| Fitxer | Alt Z (m) | Ample X (m) | Fons Y (m) | Triangles / límit | Detalls |\n|---|---:|---:|---:|---:|---|\n${entries.map(m=>`| ${m.file} | ${fmt(m.height_m)} | ${fmt(m.width_m)} | ${fmt(m.depth_m)} | ${m.triangles} / ${m.student_triangle_budget} | ${m.note} |`).join('\n')}\n\nEl ZIP també inclou la castanyera actual i la plantilla animada d’1,80 m, amb la seva guia. Regeneració: node tools/export-world-references.cjs /ruta/a/three-r128.cjs; després node tools/package-references.cjs.\n`;
fs.writeFileSync(path.join(out,'LLEGEIX-ME.md'),instructions);
console.log(entries.map(m=>`${m.id}: ${m.height_m} m, ${m.triangles} triangles, ${m.bytes} bytes`).join('\n'));
