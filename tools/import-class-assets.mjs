// Copies deliveries without touching the source folder; Blender optimizes only marked copies.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const source = process.argv[2];
if (!source) throw Error('Usage: node tools/import-class-assets.mjs <folder>');
const authors = {
  khliebnikova: 'Mariia Khliebnikova', esteve: 'Alba Esteve', feliu: 'Axel Feliu', fullana: 'Bernat Fullana', gamell: 'Clara Gamell',
  liang: 'Yuheng Liang', oliveras: 'Anna Oliveras', paneque: 'Quim Paneque', rodriguez: 'Lissy Rodríguez', torres: 'Alejandro Torres'
};
const labels = { carabassa: 'Carabassa', fantasma: 'Fantasma', carabassot: 'Carabassot', pi: 'Pi del bosc', 'arbre-sec': 'Arbre sec', panellet: 'Panet', caixa: "Caixa d’armes", casa: 'Casa', cripta: 'Cripta', lapida: 'Làpida', paradeta: 'Paradeta de castanyes', portal: 'Portal', foguera: 'Foguera' };
const limits = { carabassa: 800, fantasma: 800, carabassot: 2000, pi: 200, 'arbre-sec': 300, panellet: 200, caixa: 200, casa: 800, cripta: 800, lapida: 150, paradeta: 1500, portal: 1500, foguera: 800 };
const manifestPath = 'assets/assets.json', manifest = JSON.parse(fs.readFileSync(manifestPath)), plan = [];
for (const sourceName of fs.readdirSync(source).filter(s => /\.glb$/i.test(s)).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))) {
  const lower = sourceName.toLowerCase(), surname = Object.keys(authors).find(s => lower.includes(s));
  const kind = /castanyera|carabassot/.test(lower) ? 'carabassot' : /car[ab]*assa/.test(lower) ? 'carabassa' : /fantasma/.test(lower) ? 'fantasma' : /pi(?:-del-bosc)?\.glb$/.test(lower) ? 'pi' : /arbre-sec/.test(lower) ? 'arbre-sec' : /panet/.test(lower) ? 'panellet' : /caixadarmes/.test(lower) ? 'caixa' : /casa/.test(lower) ? 'casa' : /cripta/.test(lower) ? 'cripta' : /lapida/.test(lower) ? 'lapida' : /paradeta/.test(lower) ? 'paradeta' : /portal/.test(lower) ? 'portal' : /foguera/.test(lower) ? 'foguera' : null;
  if (!kind || !surname) throw Error('Unmapped delivery: ' + sourceName);
  const group = ['carabassa', 'fantasma', 'carabassot'].includes(kind) ? 'monstres' : 'escenari';
  const name = lower.replace(/_/g, '-').replace(/^1gs-/, '1gs-').replace(/castanyera/, 'morticia');
  const file = group + '/alumnat/' + name, destination = path.join('assets', file);
  const bytes = fs.readFileSync(path.join(source, sourceName)), doc = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8').trim());
  const triangles = doc.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((n, p) => n + doc.accessors[p.indices ?? p.attributes.POSITION].count / 3, 0), 0);
  const entry = { id: 'alumnat-' + surname + '-' + kind, nom: surname === 'gamell' ? 'Mortícia' : labels[kind] + ' · ' + authors[surname].split(' ')[0], autor: authors[surname], curs: lower.startsWith('1gs-') ? '1GS' : '3D i videojocs', fitxer: file };
  if (surname === 'gamell') entry.nomCombat = 'la Mortícia';
  // A flat portal and a bread roll must fit their footprint, not be stretched to a tall prop's height.
  if (kind === 'portal') entry.altura = 0.32;
  if (kind === 'panellet') entry.altura = 0.24;
  const existing = manifest[group][kind] || [{ id: 'integrat-' + kind, nom: 'Original de Castaween', integrat: true }];
  const list = Array.isArray(existing) ? existing : [existing];
  manifest[group][kind] = list.filter(e => e.id !== entry.id).concat(entry);
  if (kind === 'foguera' || kind === 'paradeta') manifest[group][kind].sort((a, b) => Number(!!a.integrat) - Number(!!b.integrat));
  fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(path.join(source, sourceName), destination);
  plan.push({ source: path.resolve(source, sourceName), sourceName, destination: path.resolve(destination), kind, author: authors[surname], title: entry.nom, triangles, limit: limits[kind], meshes: doc.meshes.length,
    optimize: triangles > limits[kind] || doc.meshes.length > 1, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
fs.mkdirSync('output/assets-alumnat', { recursive: true });
fs.writeFileSync('output/assets-alumnat/import-plan.json', JSON.stringify(plan, null, 2));
console.log(JSON.stringify({ models: plan.length, optimize: plan.filter(p => p.optimize).map(p => p.sourceName), bytes: plan.reduce((sum, p) => sum + fs.statSync(p.destination).size, 0) }, null, 2));
