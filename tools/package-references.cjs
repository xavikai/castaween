// Deterministic, uncompressed ZIP: no external build dependencies.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets','referencies');
const files=fs.readdirSync(out).filter(f=>!f.endsWith('.zip')).sort().map(f=>['assets/referencies/'+f,path.join(out,f)]);
for(const f of ['castanyera-actual-referencia.glb','plantilla-castanyera.glb','mides-castanyera.json','LLEGEIX-ME.md'])files.push(['assets/plantilles/'+f,path.join(root,'assets','plantilles',f)]);
for(const f of ['paleta-castaween.png','paleta-guia.png'])files.push(['assets/'+f,path.join(root,'assets',f)]);
files.push(['ASSETS.md',path.join(root,'ASSETS.md')]);
files.push(['assets/guia-entregues.html',path.join(root,'assets','guia-entregues.html')]);
files.push(['assets/castanyeres/castanyera-nova.glb',path.join(root,'assets','castanyeres','castanyera-nova.glb')]);
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(data){let crc=0xffffffff;for(const b of data)crc=table[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
const chunks=[],directory=[];let offset=0;
for(const [name,file]of files){const data=fs.readFileSync(file),n=Buffer.from(name),crc=crc32(data),local=Buffer.alloc(30),central=Buffer.alloc(46);
  local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(0x5d57,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(n.length,26);
  central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(0x5d57,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(n.length,28);central.writeUInt32LE(offset,42);
  chunks.push(local,n,data);directory.push(central,n);offset+=local.length+n.length+data.length;
}
const cd=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...chunks,cd,end]);fs.writeFileSync(path.join(out,'castaween-referencies.zip'),zip);
console.log(`ZIP: ${files.length} fitxers, ${zip.length} bytes`);
