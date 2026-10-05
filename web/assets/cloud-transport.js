import {eventFrames,notification,validateConnection} from './direct-events.js';
const params=new URLSearchParams(location.hash.slice(1));
const room=params.get('room'),owner=params.get('owner'),view=params.get('view');
const token=owner||view;
const nativeFetch=window.fetch.bind(window);
let catalogValue,catalogTime=0,catalogRequest,hub;
async function responseError(response){
 let data;try{data=await response.json();}catch{}
 const error=Error(data?.error||(response.status===429?'요청이 잠시 몰렸어요. 1분 후 다시 눌러 주세요.':'서버 연결을 확인해 주세요.'));
 error.retryAfter=Number(data?.retryAfter||response.headers.get('Retry-After'))||0;
 error.terminal=[401,403,404,410].includes(response.status);return error;
}
async function catalog(){
 if(catalogValue&&Date.now()-catalogTime<300000)return catalogValue;
 if(catalogRequest)return catalogRequest;
 catalogRequest=(async()=>{
  const r=await nativeFetch('/api?op=catalog',{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok){if(catalogValue)return catalogValue;throw await responseError(r);}
  const data=await r.json();catalogValue=data;catalogTime=Date.now();return data;
 })().finally(()=>catalogRequest=null);
 return catalogRequest;
}
export const overlayUrl=`${location.origin}/overlay#${new URLSearchParams({room:room||'',view:view||''})}`;
const dockUrl=`${location.origin}/control?dock=1${location.hash}`;
window.kiraCloud={overlayUrl,dockUrl};
function apiUrl(op){return `/api?${new URLSearchParams({op,room:room||''})}`;}
async function merge(state){
 const {songs}=await catalog(),overrides=state.artworkOverrides||{};
 return {...state,songs:[...songs,...(state.songs||[])].map(s=>({...s,artwork:overrides[s.id]||s.artwork}))};
}
class CloudHub{
 constructor(){
  this.listeners=new Set();this.closed=false;this.delay=1000;this.chain=Promise.resolve();
  window.addEventListener('offline',()=>{if(!this.closed)this.abort?.abort();});
  window.addEventListener('online',()=>{
   if(this.closed||!this.listeners.size)return;
   this.reconnectRequested=true;
   if(!this.connecting){clearTimeout(this.timer);this.timer=setTimeout(()=>this.connect(),0);}
  });
 }
 add(listener){
  if(this.terminal){queueMicrotask(()=>listener.onerror?.({error:this.lastError}));return ()=>{};}
  this.listeners.add(listener);if(this.snapshot)queueMicrotask(()=>{if(this.listeners.has(listener))listener.onmessage?.({data:JSON.stringify(this.snapshot)});});
  if(!this.running){this.running=true;this.connect();}
  return ()=>{this.listeners.delete(listener);if(!this.listeners.size){this.closed=true;this.abort?.abort();clearTimeout(this.timer);this.running=false;}};
 }
 accept(raw){
  this.chain=this.chain.catch(()=>{}).then(async()=>{
   if(this.snapshot&&raw.revision<this.snapshot.revision)return;
   const next=await merge(raw);
   if(this.snapshot&&next.revision<this.snapshot.revision)return;
   this.snapshot=next;for(const listener of this.listeners)listener.onmessage?.({data:JSON.stringify(next)});
  });return this.chain;
 }
 async connect(){
  if(this.closed)return;
  this.connecting=true;this.reconnectRequested=false;this.abort=new AbortController();let reader;
  let watchdog=setTimeout(()=>this.abort.abort(),15000);
  try{
   if(!room||!token){const error=Error('저장한 독 주소로 들어와 주세요.');error.terminal=true;throw error;}
   if(!this.connection){
    const handshake=await nativeFetch(apiUrl('connection'),{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:this.abort.signal});
    if(!handshake.ok)throw await responseError(handshake);
    this.connection=validateConnection(await handshake.json());
   }
   const response=await nativeFetch(this.connection.url,{method:'POST',headers:{Authorization:`Bearer ${this.connection.token}`,Accept:'text/event-stream'},cache:'no-store',signal:this.abort.signal});
   if(!response.ok){const error=await responseError(response);if(response.status===400)error.terminal=true;throw error;}
   if(!response.body)throw Error('서버 연결을 확인해 주세요.');
   reader=response.body.getReader();let subscribed=false;
   this.delay=1000;
   for await(const frame of eventFrames(reader)){
    if(this.closed)break;
    if(frame===`subscribe,${this.connection.channel},1`&&!subscribed){
     subscribed=true;
     // Subscribe BEFORE snapshot: any concurrent change is buffered in the stream.
     const current=await nativeFetch(apiUrl('state'),{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:this.abort.signal});
     if(!current.ok)throw await responseError(current);
     await this.accept(await current.json());
     clearTimeout(watchdog);watchdog=null;
    }else{
     const data=notification(frame,this.connection.channel);
     if(data?.type==='room-keys-revoked'){const error=Error('이 OBS 주소는 폐기됐어요. 첫 화면에서 새 링크를 발급해 주세요.');error.terminal=true;throw error;}
     if(data)await this.accept(data);
    }
   }
   this.delay=500+Math.floor(Math.random()*500);
  }catch(error){
   if(!this.closed){
    for(const listener of this.listeners)listener.onerror?.({error});
    const el=document.getElementById('connection');if(el)el.textContent=`${error.message}${this.snapshot?' · 방송 화면은 마지막 곡을 유지해요.':''}`;
    if(error.terminal){this.lastError=error;this.terminal=true;this.closed=true;this.abort?.abort();clearTimeout(this.timer);}
    else this.delay=navigator.onLine===false?5000:Math.max(error.retryAfter*1000||0,Math.min(this.delay*2,60000));
   }
  }finally{clearTimeout(watchdog);await reader?.cancel().catch(()=>{});this.connecting=false;}
  if(!this.closed&&this.listeners.size)this.timer=setTimeout(()=>this.connect(),this.reconnectRequested?0:this.delay);
 }
}
function sharedHub(){if(!hub||(hub.closed&&!hub.terminal))hub=new CloudHub();return hub;}
window.kiraCloud.subscribe=(id,key,listener)=>id===room&&key===view?sharedHub().add(listener):null;
class CloudEvents{
 constructor(){
  this.closed=false;
  queueMicrotask(()=>{
   if(this.closed)return;
   try{if(parent!==window)this.unsubscribe=parent.kiraCloud?.subscribe(room,token,this);}catch{}
   if(!this.unsubscribe)this.unsubscribe=sharedHub().add(this);
  });
  window.addEventListener('pagehide',()=>this.close(),{once:true});
 }
 close(){this.closed=true;this.unsubscribe?.();}
}
window.EventSource=CloudEvents;
window.fetch=async function(input,init){
 const url=new URL(typeof input==='string'?input:input.url,location.origin);
 if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,init);
 const op=url.pathname.slice(5),headers=new Headers(init?.headers);headers.set('Authorization',`Bearer ${token||''}`);
 const res=await nativeFetch(apiUrl(op),{...init,headers,cache:'no-store',signal:init?.signal||AbortSignal.timeout(15000)});
 if(res.ok&&['action','artwork','state'].includes(op)&&res.status!==204){
  const raw=await res.json();if(hub)await hub.accept(raw);const data=await merge(raw);
  return new Response(JSON.stringify(data),{status:res.status,headers:{'Content-Type':'application/json'}});
 }
 return res;
};
for(const frame of document.querySelectorAll('iframe'))if(frame.getAttribute('src')?.startsWith('/overlay'))frame.src+=`#${new URLSearchParams({room:room||'',view:view||''})}`;
for(const link of document.querySelectorAll('a[href^="/overlay"]'))link.href+=`#${new URLSearchParams({room:room||'',view:view||''})}`;
const copy=document.getElementById('copy-dock');if(copy)copy.addEventListener('click',async()=>{await navigator.clipboard.writeText(dockUrl);copy.textContent='독 주소 복사됨';setTimeout(()=>copy.textContent='독 주소 복사',1600);});
const backup=document.querySelector('a[href="/api/export"]');if(backup)backup.addEventListener('click',async e=>{e.preventDefault();const res=await window.fetch('/api/export');if(!res.ok)return;const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='kira-web-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
if(!room||!token){const el=document.getElementById('connection');if(el)el.textContent='첫 화면에서 방송 공간을 만들어 주세요.';}
