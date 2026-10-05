import {subscribeRoom,roomChannel,StorageUnavailable} from './storage.mjs';
import {payload,access} from './rooms.mjs';

export function notification(line,id) {
 const prefix=`data: message,${roomChannel(id)},`;
 if(!line.startsWith(prefix))return null;
 try{return JSON.parse(line.slice(prefix.length));}catch{return null;}
}
// Subscribe first, then read the snapshot so a mutation during connection setup
// cannot fall into a gap. Reconnection also repairs a lost notification.
export async function serveEvents(req,res,id,token,readRoom) {
 const abort=new AbortController();
 const close=()=>abort.abort();res.on('close',close);
 const deadline=setTimeout(close,50000),connecting=setTimeout(close,10000);let heartbeat,reader;
 try{
  const stream=await subscribeRoom(id,abort.signal);reader=stream.getReader();
  const first=await reader.read();
  if(first.done)throw new StorageUnavailable();
  clearTimeout(connecting);
  const current=await readRoom(id);
  if(!current||!access(current.room,token)){res.statusCode=403;res.end();return;}
  res.statusCode=200;res.setHeader('Content-Type','text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Accel-Buffering','no');res.flushHeaders?.();
  let revision=current.room.state.revision;
  const send=state=>res.write(`data: ${JSON.stringify(state)}\n\n`);
  send(payload(current.room));
  heartbeat=setInterval(()=>res.write(': keepalive\n\n'),15000);
  const decoder=new TextDecoder();let pending='';
  const consume=chunk=>{
   pending+=decoder.decode(chunk,{stream:true});const lines=pending.split('\n');pending=lines.pop();
   for(const line of lines){
    const state=notification(line.replace(/\r$/,''),id);
    if(state?.type==='room-keys-revoked'){res.write('event: connection-error\ndata: {"error":"이 OBS 주소는 폐기됐어요. 첫 화면에서 새 링크를 발급해 주세요.","terminal":true}\n\n');close();return;}
    if(state&&state.revision>revision){revision=state.revision;send(state);}
   }
  };
  consume(first.value);
  while(!abort.signal.aborted){const {done,value}=await reader.read();if(done)break;consume(value);}
 }catch(error){
  if(!res.headersSent&&!res.destroyed)throw new StorageUnavailable();
  if(res.headersSent&&!abort.signal.aborted)res.write('event: connection-error\ndata: {"error":"연결을 다시 확인하고 있어요."}\n\n');
 }finally{
  clearTimeout(deadline);clearTimeout(connecting);clearInterval(heartbeat);abort.abort();res.off('close',close);
  await reader?.cancel().catch(()=>{});
  if(res.headersSent&&!res.writableEnded)res.end();
 }
}
