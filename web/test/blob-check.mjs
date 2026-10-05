import {put,get,head,del} from '@vercel/blob';
process.loadEnvFile('.env.local');
const name=`checks/${Date.now()}.json`;
const written=await put(name,JSON.stringify({test:1,text:'x'.repeat(5000)}),{access:'private',contentType:'application/json'});
const read=await get(name,{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});
console.log({writeEtag:written.etag,readEtag:read.blob.etag,headEtag:(await head(name)).etag});
try{const next=await put(name,'{"test":2}',{access:'private',contentType:'application/json',allowOverwrite:true,ifMatch:read.blob.etag});console.log('Conditional update succeeded',next.etag);}catch(e){console.log('Conditional update failed',e.name,e.message);}
await del(name);
