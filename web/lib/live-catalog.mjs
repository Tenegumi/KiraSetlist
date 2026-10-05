import {get,put} from '@vercel/blob';
import fs from 'node:fs';
import {fetchNotionSongs,mergeCatalog} from './notion-source.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../public/catalog.json',import.meta.url),'utf8'));
const key='catalog/notion.json';
let cache;
async function read(){
 const result=await get(key,{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});
 return result?{value:await new Response(result.stream).json(),etag:result.blob.etag}:null;
}
export async function liveCatalog(){
 if(cache&&Date.now()-cache.time<60000)return cache.value;
 const data=await read();
 const value={songs:mergeCatalog(base,data?.value.songs||[]).songs,sync:data?.value.sync||{status:'pending'},version:data?.value.version||'bundled'};
 cache={time:Date.now(),value};return value;
}
export async function syncNotion(){
 const before=await read(),incoming=await fetchNotionSongs();
 const merged=mergeCatalog(mergeCatalog(base,before?.value.songs||[]).songs,incoming);
 const now=new Date().toISOString();
 const value={version:now,songs:merged.songs.map(({artwork,...song})=>song),sync:{status:'ok',lastSuccess:now,sourceCount:incoming.length,total:merged.songs.length,added:merged.added,updated:merged.updated,preserved:merged.preserved,deletedSongs:'preserve'}};
 // Only a complete successful fetch replaces the saved catalog. Failed fetches keep it intact.
 await put(key,JSON.stringify(value),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:!!before,...(before?{ifMatch:before.etag}:{})});
 cache=undefined;return value.sync;
}
