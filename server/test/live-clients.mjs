// Extra real sockets for classroom queue QA. Run while one browser hosts the room.
// Usage: node server/test/live-clients.mjs 1234 8
import readline from 'node:readline';
const code=process.argv[2], count=Number(process.argv[3]||8), clients=[];
if(!/^\d{4}$/.test(code)||count>50)throw Error('Provide room code and <=50 test clients');
for(let i=0;i<count;i++){
  const ws=new WebSocket(`wss://castaween-relay.carrotrevoltstudio.workers.dev/room/${code}`);
  const client={ws,id:null,meta:null,states:0,full:0,deltas:0,events:0};clients.push(client);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No hello')),10000);
    ws.onerror=reject;ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.t==='hello'){client.id=m.id;ws.send(JSON.stringify({t:'join',curs:0,nom:`Prova ${i+1}`,look:{}}));clearTimeout(timer);resolve();}
      if(m.t==='estat'){client.meta=m.meta;client.states++;if(m.full)client.full++;else client.deltas++;client.events+=(m.events||[]).length;}
      if(m.t==='error')reject(Error(m.error));};});
}
console.log(`${count} real WebSockets joined room ${code}; commands: status, input, close`);
readline.createInterface({input:process.stdin}).on('line',line=>{
  if(line==='status')console.log(JSON.stringify(clients.map(c=>({id:c.id,states:c.states,full:c.full,deltas:c.deltas,events:c.events,phase:c.meta?.phase,queue:c.meta?.queues[0]}))));
  if(line==='input'){const ws=clients[0].ws;ws.send(JSON.stringify({t:'input',mx:1,mz:0,tir:true}));setTimeout(()=>ws.send(JSON.stringify({t:'input',mx:0,mz:0,tir:false})),1000);}
  if(line==='close'){for(const c of clients)c.ws.close();process.exit(0);}
});
