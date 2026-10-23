// Export the actual procedural castanyera without running the game or WebGL.
// Usage: node tools/export-reference.cjs /path/to/three-r128.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const THREE=process.argv[2]?require(path.resolve(process.argv[2])):require('three');
if(THREE.REVISION!=='128')throw Error('Cal three.js r128, la mateixa versió del joc.');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=html.slice(html.indexOf('function mergeParts('),html.indexOf('function buildAnyRig('));
const context=vm.createContext({THREE});
vm.runInContext(source+'\nglobalThis.reference=buildCastRig({id:0,color:0x3ec7e0},DEFAULT_LOOK);',context);
const {body,arm,rig}=context.reference;rig.updateMatrixWorld(true);
const meshes=[body,arm].map(mesh=>mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));
const box=new THREE.Box3();for(const g of meshes){g.computeBoundingBox();box.union(g.boundingBox);}
const originalHeight=box.max.y-box.min.y,scale=1.8/originalHeight,minY=box.min.y;
for(const g of meshes){g.translate(0,-minY,0);g.scale(scale,scale,scale);g.computeBoundingBox();}
const finalBox=new THREE.Box3();for(const g of meshes)finalBox.union(g.boundingBox);
const size=finalBox.getSize(new THREE.Vector3()),parts=[],views=[],accessors=[],gltfMeshes=[];let length=0;
function attribute(array,type,count,min,max){const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),index=views.length;
  views.push({buffer:0,byteOffset:length,byteLength:bytes.length,target:34962});parts.push(bytes);length+=bytes.length;
  const pad=(4-length%4)%4;if(pad){parts.push(Buffer.alloc(pad));length+=pad;}
  const a={bufferView:index,componentType:5126,count,type};if(min)a.min=min;if(max)a.max=max;accessors.push(a);return accessors.length-1;
}
for(const [i,g]of meshes.entries()){
  const p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color;
  const position=attribute(p.array,'VEC3',p.count,g.boundingBox.min.toArray(),g.boundingBox.max.toArray());
  gltfMeshes.push({name:i?'Brac':'Cos',primitives:[{attributes:{POSITION:position,NORMAL:attribute(n.array,'VEC3',n.count),COLOR_0:attribute(c.array,'VEC3',c.count)},material:0,mode:4}]});
}
const triangles=meshes.reduce((n,g)=>n+g.attributes.position.count/3,0);
const metadata={model:'Castanyera clàssica actual, sense complements opcionals',file:'castanyera-actual-referencia.glb',units:'metres',height_m:1.8,width_m:+size.x.toFixed(6),depth_m:+size.z.toFixed(6),up_gltf:'+Y',front_gltf:'+Z',up_blender:'+Z',front_blender:'-Y',origin:'centre de la base, a terra',triangles,animated:false,source:'index.html: castGeometries + buildCastRig',geometry_source_sha256:crypto.createHash('sha256').update(source).digest('hex'),original_procedural_height:+originalHeight.toFixed(6),applied_scale:+scale.toFixed(9),student_triangle_budget:1500,note:'Referència estàtica de proporcions i escala. No és una entrega optimitzada ni substitueix la plantilla animada amb paleta.'};
const document={asset:{version:'2.0',generator:'Castaween · export-reference.cjs'},scene:0,scenes:[{nodes:[0,1]}],nodes:[{name:'Cos',mesh:0},{name:'Brac',mesh:1}],meshes:gltfMeshes,materials:[{name:'Colors originals de referència',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:1}}],buffers:[{byteLength:length}],bufferViews:views,accessors,extras:metadata};
let json=Buffer.from(JSON.stringify(document));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const binary=Buffer.concat(parts);
const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+8+binary.length,8);
const chunk=(data,type)=>{const h=Buffer.alloc(8);h.writeUInt32LE(data.length,0);h.writeUInt32LE(type,4);return Buffer.concat([h,data]);};
const glb=Buffer.concat([header,chunk(json,0x4e4f534a),chunk(binary,0x004e4942)]),out=path.join(root,'assets','plantilles');
fs.writeFileSync(path.join(out,metadata.file),glb);fs.writeFileSync(path.join(out,'mides-castanyera.json'),JSON.stringify(metadata,null,2)+'\n');
if(Math.abs(size.y-1.8)>1e-6||Math.abs(finalBox.min.y)>1e-6)throw Error('Escala o origen incorrectes');
console.log(JSON.stringify({file:metadata.file,bytes:glb.length,height_m:size.y,width_m:size.x,depth_m:size.z,triangles},null,2));
