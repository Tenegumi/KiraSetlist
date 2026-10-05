import {BlobPreconditionFailedError} from '@vercel/blob';
import {Readable} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {createRoom,access,keysRevoked,payload,mutate} from '../lib/rooms.mjs';
import {liveCatalog,syncNotion} from '../lib/live-catalog.mjs';
import {authorizeNotionSync} from '../lib/manual-sync.mjs';
import {readBody,ClientError} from '../lib/request.mjs';
import {readJson,writeJson,readImage,writeImage,removeImage,createSubscription,removeSubscription,subscriptionConnection,redisConfigured,storageConfigured,storageHealth,StorageUnavailable,StorageConflict} from '../lib/storage.mjs';
const roomPath=id=>`rooms/${id}.json`;
const roomCache=new Map(),roomReads=new Map();
async function read(id,cached=false){
 const hit=roomCache.get(id);if(cached&&hit&&Date.now()-hit.time<1000)return hit.data;
 if(cached&&roomReads.has(id))return roomReads.get(id);
 const request=(async()=>{const result=await readJson(roomPath(id));const data=result?{room:result.value,etag:result.etag}:null;
  // Do not let an older concurrent read replace a completed local write.
  const previous=roomCache.get(id);if(data&&(!previous||data.room.state.revision>=previous.data.room.state.revision))roomCache.set(id,{time:Date.now(),data});
  if(roomCache.size>200)roomCache.delete(roomCache.keys().next().value);
  return data;
 })();
 if(cached){roomReads.set(id,request);try{return await request;}finally{roomReads.delete(id);}}return request;
}
async function write(id,room,etag){const result=await writeJson(roomPath(id),room,etag,{id,state:payload(room)});roomCache.set(id,{time:Date.now(),data:{room,etag:result.etag}});return result;}
function json(res,status,value){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));}
export default async function handler(req,res){
 const url=new URL(req.url,'https://kira.invalid'),op=url.searchParams.get('op')||req.url.split('?')[0].replace(/^\/api\/?/,'');
 if(op==='health'){const health=await storageHealth();return json(res,health.ready?200:503,{...health,mode:'web',notionSync:!!(process.env.NOTION_SYNC_SECRET||process.env.CRON_SECRET),notionSyncMode:'manual'});}
 try{
  // Old clients poll with a revision every second. Reject before any storage read.
  if(op==='state'&&req.method==='GET'&&url.searchParams.has('revision'))return json(res,410,{code:'legacy_polling_removed',error:'이전 반복 조회 방식은 종료됐어요. OBS 독과 브라우저 소스를 새로고침해 주세요.'});
  if(op==='events')return json(res,410,{code:'legacy_stream_removed',error:'실시간 연결 방식이 바뀌었어요. OBS 독과 브라우저 소스를 새로고침해 주세요.'});
  if(op==='sync-notion'){
   res.setHeader('Allow','POST');
   await authorizeNotionSync(req);
   return json(res,200,await syncNotion());
  }
  if(op==='catalog'&&req.method==='GET')return json(res,200,await liveCatalog());
  if(!storageConfigured())return json(res,503,{error:'서버 저장소 연결을 준비 중이에요.',code:'storage_unavailable'});
  if(req.method==='POST'){
   const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;
   if(origin&&origin!==`https://${host}`&&origin!==`http://${host}`)return json(res,403,{error:'이 사이트에서 다시 시도해 주세요.'});
   if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON 요청이 필요합니다.'});
  }
  if(op==='rooms'&&req.method==='POST'){
   if(!redisConfigured())return json(res,503,{error:'실시간 저장소 연결을 준비 중이에요.',code:'storage_unavailable',retryAfter:60});
   await readBody(req);const created=createRoom();
   created.room.subscription=await createSubscription(created.id);
   try{await write(created.id,created.room);}catch(error){await removeSubscription(created.id).catch(()=>{});throw error;}
   return json(res,201,{room:created.id,owner:created.owner,view:created.view});
  }
  const id=url.searchParams.get('room');if(!/^[a-f0-9]{36}$/.test(id||''))return json(res,400,{error:'독 주소 또는 방송 화면 주소를 다시 붙여 넣어 주세요.'});
  const token=req.headers.authorization?.replace(/^Bearer /,'')||(op==='image'?url.searchParams.get('key'):null);
  if(!/^(?:[A-Za-z0-9_-]{32}|[A-Za-z0-9_-]{43})$/.test(token||''))return json(res,403,{error:'접근할 수 없는 주소예요. 저장해 둔 OBS 주소를 사용해 주세요.'});
  const data=await read(id,op==='state'&&req.method==='GET');if(!data)return json(res,404,{error:'방송 공간을 찾을 수 없어요.'});
  if(keysRevoked(data.room))return json(res,403,{code:'room_keys_revoked',error:'이 OBS 주소는 폐기됐어요. 첫 화면에서 새 링크를 발급해 주세요.'});
  const role=access(data.room,token);
  if(!role)return json(res,403,{error:'접근할 수 없는 주소예요. 저장해 둔 OBS 주소를 사용해 주세요.'});
  if(op==='connection'&&req.method==='GET')return json(res,200,subscriptionConnection(id,data.room));
  if(op==='image'&&req.method==='GET'){
   const image=url.searchParams.get('image');if(!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(image||''))return json(res,400,{error:'이미지 주소가 올바르지 않아요.'});
   const result=await readImage(`rooms/${id}/images/${image}`);if(!result)return json(res,404,{error:'이미지를 찾을 수 없어요.'});
   res.setHeader('Content-Type',result.contentType);res.setHeader('Cache-Control','private, max-age=3600');if(result.bytes)res.end(result.bytes);else Readable.fromWeb(result.stream).pipe(res);return;
  }
  if(op==='state'&&req.method==='GET'){
   res.setHeader('Cache-Control','no-store');
   return json(res,200,payload(data.room));
  }
  if(role!=='owner')return json(res,403,{error:'방송 화면 주소로는 조작할 수 없어요.'});
  const {songs}=await liveCatalog();
  if(op==='export'&&req.method==='GET'){res.setHeader('Content-Disposition','attachment; filename="kira-web-backup.json"');return json(res,200,{state:data.room.state,artwork:data.room.artwork,songs});}
  if(op==='action'&&req.method==='POST'){
   const action=await readBody(req);
   let next;try{next=mutate(data.room,action,songs);}catch(e){throw new ClientError(400,e.message);}
   await write(id,next,data.etag);return json(res,200,payload(next));
  }
  if(op==='artwork'&&req.method==='POST'){
   const input=await readBody(req,920000),song=[...songs,...data.room.state.customSongs].find(s=>s.id===input.songId);
   if(!song)return json(res,400,{error:'등록되지 않은 곡이에요.'});
   let record,newImagePath;
   if(input.dataUrl){
    if(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.dataUrl)||Buffer.byteLength(input.dataUrl)>900_000)return json(res,400,{error:'웹 버전에서는 650KB 이하 PNG, JPG, WebP 이미지를 사용해 주세요.'});
    const [header,encoded]=input.dataUrl.split(','),ext=header.includes('jpeg')?'jpg':header.includes('png')?'png':'webp',bytes=Buffer.from(encoded,'base64');
    const valid=ext==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):ext==='jpg'?bytes[0]===255&&bytes[1]===216:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
    if(!valid)return json(res,400,{error:'이미지 파일 형식이 올바르지 않아요.'});
    const image=`${randomUUID()}.${ext}`;newImagePath=`rooms/${id}/images/${image}`;
    await writeImage(newImagePath,bytes,`image/${ext==='jpg'?'jpeg':ext}`);
    record={status:'manual',image:`/api?${new URLSearchParams({op:'image',room:id,image,key:data.room.viewKey})}`,candidates:[],source:null};
   }else{
    const catalog=await import('../data/artwork.json',{with:{type:'json'}});
    const candidate=catalog.default[song.id]?.candidates?.find(c=>c.trackId===input.trackId);
    if(!candidate)return json(res,400,{error:'앨범 후보를 다시 골라 주세요.'});
    record={status:'manual',image:candidate.image,source:candidate.source,candidates:catalog.default[song.id].candidates};
   }
   const next={...data.room,artwork:{...data.room.artwork,[song.id]:record},state:{...data.room.state,revision:data.room.state.revision+1}};
   if(Buffer.byteLength(JSON.stringify(next))>3_000_000)return json(res,400,{error:'이미지 저장 공간이 가득 찼어요.'});
   try{await write(id,next,data.etag);}catch(e){if(newImagePath)await removeImage(newImagePath).catch(()=>{});throw e;}return json(res,200,payload(next));
  }
  return json(res,404,{error:'지원하지 않는 요청이에요.'});
 }catch(e){
  if(e instanceof ClientError)return json(res,e.status,{error:e.message});
  if(e instanceof BlobPreconditionFailedError||e instanceof StorageConflict)return json(res,409,{error:'다른 창에서 먼저 변경했어요. 잠시 후 다시 눌러 주세요.'});
  if(e instanceof StorageUnavailable){res.setHeader('Retry-After','60');return json(res,503,{error:e.message,code:e.code,retryAfter:60});}
  console.error('Kira API:',e.name,e.message);
  return json(res,500,{error:'서버에서 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'});
 }
}
