import fs from 'node:fs';
import path from 'node:path';
import { validateGLB } from '../server/model-validation.js';
const folder = process.argv[2];
if (!folder) throw Error('Usage: node tools/audit-class-assets.mjs <folder>');
for (const file of fs.readdirSync(folder).filter(x => /\.glb$/i.test(x)).sort()) {
  const name = file.toLowerCase();
  const kind = /castanyera|carabassot|morticia/.test(name) ? 'carabassot' : /car[ab]*assa/.test(name) ? 'carabassa' : /fantasma/.test(name) ? 'fantasma' : /pi(?:-del-bosc)?\.glb$/.test(name) ? 'pi' : /arbre-sec/.test(name) ? 'arbre-sec' : /panet/.test(name) ? 'panellet' : /caixadarmes/.test(name) ? 'caixa' : /casa/.test(name) ? 'casa' : /cripta/.test(name) ? 'cripta' : /lapida/.test(name) ? 'lapida' : /paradeta/.test(name) ? 'paradeta' : /portal/.test(name) ? 'portal' : /foguera/.test(name) ? 'foguera' : null;
  const bytes = fs.readFileSync(path.join(folder, file)), jsonLength = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim());
  const triangles = (doc.meshes || []).reduce((n, mesh) => n + mesh.primitives.reduce((n, p) => n + doc.accessors[p.indices ?? p.attributes.POSITION].count / 3, 0), 0);
  let check;
  try { check = await validateGLB(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), kind); }
  catch (error) { check = { error: error.message }; }
  console.log(JSON.stringify({ file, kind, triangles, nodes: doc.nodes?.length, meshes: doc.meshes?.length, materials: doc.materials?.length, images: doc.images?.length, skins: doc.skins?.length || 0, animations: doc.animations?.map(a => a.name) || [], check }));
}
