const params=new URLSearchParams(location.hash.slice(1));
const room=params.get('room'),owner=params.get('owner'),view=params.get('view');
const token=owner||view;
const nativeFetch=window.fetch.bind(window);
const catalog=nativeFetch('/catalog.json').then(r=>{if(!r.ok)throw Error('노래책을 불러오지 못했습니다.');return r.json();});
export const overlayUrl=`${location.origin}/overlay#${new URLSearchParams({room:room||'',view:view||''})}`;
const dockUrl=`${location.origin}/control?dock=1${location.hash}`;
window.kiraCloud={overlayUrl,dockUrl};
function apiUrl(op){return `/api?${new URLSearchParams({op,room:room||''})}`;}
async function merge(state){
 const songs=await catalog,overrides=state.artworkOverrides||{};
 const combined=[...songs,...(state.songs||[])].map(s=>({...s,artwork:overrides[s.id]||s.artwork}));
 return {...state,songs:combined};
}
window.fetch=async function(input,init){
 const url=new URL(typeof input==='string'?input:input.url,location.origin);
 if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,init);
 const op=url.pathname.slice(5),headers=new Headers(init?.headers);headers.set('Authorization',`Bearer ${token||''}`);
 const res=await nativeFetch(apiUrl(op),{...init,headers,cache:'no-store'});
 if(res.ok&&['action','artwork','state'].includes(op)&&res.status!==204){const data=await merge(await res.json());return new Response(JSON.stringify(data),{status:res.status,headers:{'Content-Type':'application/json'}});}
 return res;
};
class CloudEvents{
 constructor(){this.closed=false;this.revision=null;this.delay=1000;setTimeout(()=>this.poll(),0);}
 async poll(){
  if(this.closed)return;
  try{
   if(!room||!token)throw Error('저장한 독 주소로 들어와 주세요.');
   const url=new URL(apiUrl('state'),location.origin);if(this.revision!==null)url.searchParams.set('revision',this.revision);
   const response=await nativeFetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(!response.ok){const error=await response.json();throw Error(error.error||'서버 연결을 확인해 주세요.');}
   if(response.status!==204){const data=await merge(await response.json());this.revision=data.revision;this.onmessage?.({data:JSON.stringify(data)});}
   this.delay=1000;
  }catch(error){this.onerror?.({error});this.delay=Math.min(this.delay*2,15000);const el=document.getElementById('connection');if(el)el.textContent=error.message;}
  if(!this.closed)this.timer=setTimeout(()=>this.poll(),this.delay);
 }
 close(){this.closed=true;clearTimeout(this.timer);}
}
window.EventSource=CloudEvents;
// Both the control preview and selected edition carry only the read-only link.
for(const frame of document.querySelectorAll('iframe'))if(frame.getAttribute('src')?.startsWith('/overlay'))frame.src+=`#${new URLSearchParams({room:room||'',view:view||''})}`;
for(const link of document.querySelectorAll('a[href^="/overlay"]'))link.href+=`#${new URLSearchParams({room:room||'',view:view||''})}`;
const copy=document.getElementById('copy-dock');if(copy)copy.addEventListener('click',async()=>{await navigator.clipboard.writeText(dockUrl);copy.textContent='독 주소 복사됨';setTimeout(()=>copy.textContent='독 주소 복사',1600);});
const backup=document.querySelector('a[href="/api/export"]');if(backup)backup.addEventListener('click',async e=>{e.preventDefault();const res=await window.fetch('/api/export');if(!res.ok)return;const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='kira-web-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
if(!room||!token){const el=document.getElementById('connection');if(el)el.textContent='첫 화면에서 방송 공간을 만들어 주세요.';}
