// Send the local, ignored review password to Cloudflare through stdin only.
// Never put credentials in arguments, tracked files or terminal output.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const server=path.resolve(__dirname,'../server');
const password=/^MODEL_REVIEW_PASSWORD=(.+)$/m.exec(fs.readFileSync(path.join(server,'.dev.vars'),'utf8'))?.[1].trim();
if(!password||password.length<20)throw Error('Cal configurar una contrasenya privada de 20 caràcters o més a server/.dev.vars.');
const win=process.platform==='win32';
const child=spawnSync(win?process.env.ComSpec:'npx',win?['/d','/s','/c','npx.cmd wrangler secret put MODEL_REVIEW_PASSWORD']:['wrangler','secret','put','MODEL_REVIEW_PASSWORD'],{cwd:server,input:password+'\n',encoding:'utf8',windowsHide:true});
for(const output of [child.stdout,child.stderr])if(output)process.stdout.write(output.replaceAll(password,'[redacted]'));
if(child.error)throw child.error;process.exitCode=child.status??1;
