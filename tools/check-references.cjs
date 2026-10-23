// Validate exported GLBs with the game's official r128 GLTFLoader.
// node tools/check-references.cjs /path/to/three-r128.cjs /path/to/GLTFLoader.js
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const THREE=require(path.resolve(process.argv[2]));
assert.equal(THREE.REVISION,'128');
vm.runInNewContext(fs.readFileSync(path.resolve(process.argv[3]),'utf8'),{THREE,TextDecoder,console,setTimeout,clearTimeout});
const root=path.resolve(__dirname,'..'),folder=path.join(root,'assets','referencies'),manifest=JSON.parse(fs.readFileSync(path.join(folder,'mides-models.json')));
(async()=>{
  assert.equal(manifest.models.length,19);assert.equal(new Set(manifest.models.map(m=>m.id)).size,19);
  for(const meta of manifest.models){
    const data=fs.readFileSync(path.join(folder,meta.file));assert.equal(data.length,meta.bytes);
    const gltf=await new Promise((resolve,reject)=>new THREE.GLTFLoader().parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'',resolve,reject));
    gltf.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    for(const [actual,expected]of [[size.y,meta.height_m],[size.x,meta.width_m],[size.z,meta.depth_m],[box.min.y,0],[center.x,0],[center.z,0]])assert.ok(Math.abs(actual-expected)<1e-5,`${meta.id}: ${actual} != ${expected}`);
    assert.equal(gltf.animations.length,0);let triangles=0;
    gltf.scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry;triangles+=(g.index?g.index.count:g.attributes.position.count)/3;for(const name of ['position','normal','color']){assert.ok(g.attributes[name],meta.id+': '+name);for(const n of g.attributes[name].array)assert.ok(Number.isFinite(n));}});
    assert.equal(triangles,meta.triangles);if(meta.id==='marge')assert.ok(Math.abs(size.x-1.2)<1e-5);
    console.log(`OK ${meta.id}: ${triangles} triangles, ${size.y.toFixed(3)} m`);
  }
  const page=fs.readFileSync(path.join(root,'assets','index.html'),'utf8');
  for(const [,href]of page.matchAll(/href="([^"]+)"/g))if(!href.startsWith('https:'))assert.ok(fs.existsSync(path.resolve(root,'assets',href.split('#')[0])),'Enllaç inexistent: '+href);
  console.log('19 GLB importats amb GLTFLoader r128; mides, origen, colors i enllaços correctes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
