// Publish only the game's public files; server credentials and tooling stay local.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public');
fs.mkdirSync(out, { recursive: true });
const entries = [
  'index.html', 'disseny.html', 'cifog-logo.png',
  'assets', 'disseny', 'carpeta-alumnat', 'documentacio-professorat', 'lliurament',
  'ASSETS.md', 'PROJECTE-CICLES.md', 'README.md',
];
for (const entry of entries) {
  fs.cpSync(path.join(root, entry), path.join(out, entry), { recursive: true });
}
console.log(`Public files ready in ${out}`);
