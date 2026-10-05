import {get,put,del,BlobPreconditionFailedError} from '@vercel/blob';
import {randomUUID} from 'node:crypto';

export class StorageUnavailable extends Error {
 constructor(code='storage_unavailable') {
  super(code==='legacy_storage_unavailable'
   ?'이전 주소의 저장소가 일시 정지됐어요. 기존 데이터는 보존돼 있어요. 첫 화면에서 새 OBS 링크를 발급해 사용할 수 있어요.'
   :'저장소에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
  this.code=code;
 }
}
export class StorageConflict extends Error {}
export const redisConfigured=()=>!!((process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL)&&(process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN));
export const storageConfigured=()=>redisConfigured()||!!process.env.BLOB_READ_WRITE_TOKEN;
const prefix='kira:v1:';
// A failed provider is retried at most once a minute per function instance.
const blocked=new Map();
async function provider(name,work) {
 if((blocked.get(name)||0)>Date.now())throw new StorageUnavailable();
 try{return await work();}catch(error){
  if(error instanceof StorageConflict||error instanceof BlobPreconditionFailedError)throw error;
  blocked.set(name,Date.now()+60000);
  console.error('Kira storage unavailable:',name);
  throw new StorageUnavailable();
 }
}
async function redis(command) {
 return provider('redis',async()=>{
  const endpoint=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
  const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Redis request failed');
  const data=await response.json();if(data.error)throw Error('Redis command failed');
  return data.result;
 });
}
async function blobRead(path) {
 return provider('blob',async()=>{
  const result=await get(path,{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});
  return result?{value:await new Response(result.stream).json(),etag:result.blob.etag}:null;
 });
}
export async function readJson(path,{optionalLegacy=false}={}) {
 if(!redisConfigured())return blobRead(path);
 const raw=await redis(['GET',prefix+path]);
 if(raw!==null)return JSON.parse(raw);
 if(!process.env.BLOB_READ_WRITE_TOKEN)return null;
 // Existing links keep their identity. Copy on first successful legacy read;
 // never replace an existing Redis record or delete the old Blob record.
 let old;
 try{old=await blobRead(path);}catch(error){
  if(!(error instanceof StorageUnavailable))throw error;
  if(optionalLegacy)return null;
  throw new StorageUnavailable('legacy_storage_unavailable');
 }
 if(!old)return null;
 try{return await writeJson(path,old.value);}catch(error){
  if(!(error instanceof StorageConflict))throw error;
  return JSON.parse(await redis(['GET',prefix+path]));
 }
}
const compareAndSet=`local old=redis.call('GET',KEYS[1]); if not old or cjson.decode(old).etag~=ARGV[1] then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); if ARGV[3]~='' then redis.call('PUBLISH',ARGV[3],ARGV[4]) end; return 1`;
export const roomChannel=id=>`${prefix}events:${id}`;
export async function writeJson(path,value,etag,notification) {
 if(redisConfigured()){
  const entry={value,etag:randomUUID()},raw=JSON.stringify(entry);
  const result=etag
   ?await redis(['EVAL',compareAndSet,1,prefix+path,etag,raw,notification?roomChannel(notification.id):'',notification?JSON.stringify(notification.state):''])
   :await redis(['SET',prefix+path,raw,'NX']);
  if(result!==1&&result!=='OK')throw new StorageConflict();
  return entry;
 }
 const result=await provider('blob',()=>put(path,JSON.stringify(value),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{})}));
 return {value,etag:result.etag};
}
export async function subscribeRoom(id,signal) {
 if(!redisConfigured())throw new StorageUnavailable();
 const endpoint=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;
 const token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
 const response=await fetch(`${endpoint.replace(/\/$/,'')}/subscribe/${encodeURIComponent(roomChannel(id))}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'text/event-stream'},signal});
 if(!response.ok||!response.body)throw new StorageUnavailable();
 return response.body;
}
export async function writeImage(path,bytes,contentType) {
 if(redisConfigured())return writeJson('images/'+path,{data:bytes.toString('base64'),contentType});
 return provider('blob',()=>put(path,bytes,{access:'private',contentType,addRandomSuffix:false}));
}
export async function readImage(path) {
 if(redisConfigured()){
  const raw=await redis(['GET',prefix+'images/'+path]);
  if(raw!==null){const {value}=JSON.parse(raw);return {bytes:Buffer.from(value.data,'base64'),contentType:value.contentType};}
 }
 return provider('blob',async()=>{
  const result=await get(path,{access:'private'});
  return result?{stream:result.stream,contentType:result.blob.contentType}:null;
 });
}
export async function removeImage(path) {
 if(redisConfigured())await redis(['DEL',prefix+'images/'+path]);
 else await provider('blob',()=>del(path));
}
let health;
export async function storageHealth() {
 if(!storageConfigured())return {ready:false,storage:'unconfigured'};
 if(!redisConfigured())return {ready:false,storage:'legacy-blob',error:'실시간 저장소 연결을 준비하고 있어요.'};
 if(health&&Date.now()-health.time<60000)return health.value;
 let value;
 try{await redis(['PING']);value={ready:true,storage:'redis'};}catch{value={ready:false,storage:'redis',error:'저장소에 연결하지 못했어요.'};}
 health={time:Date.now(),value};return value;
}
