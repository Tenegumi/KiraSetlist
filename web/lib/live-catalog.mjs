import {readJson,writeJson,StorageUnavailable} from './storage.mjs';
import fs from 'node:fs';
import {fetchNotionSongs,mergeCatalog} from './notion-source.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../public/catalog.json',import.meta.url),'utf8'));
const key='catalog/notion.json';
let cache;
async function read(){
 return readJson(key,{optionalLegacy:true});
}
export async function liveCatalog(){
 if(cache&&Date.now()-cache.time<60000)return cache.value;
 let data;
 try{data=await read();}catch(error){
  if(!(error instanceof StorageUnavailable))throw error;
  const value={...(cache?.value||{songs:base,version:'bundled'}),sync:{...(cache?.value.sync||{}),mode:'manual',status:'degraded',message:'저장소 연결을 복구 중이에요. 마지막 노래책을 표시해요.'}};
  cache={time:Date.now(),value};return value;
 }
 const value={songs:mergeCatalog(base,data?.value.songs||[]).songs,sync:{...(data?.value.sync||{status:'pending'}),mode:'manual'},version:data?.value.version||'bundled'};
 cache={time:Date.now(),value};return value;
}
export async function syncNotion(){
 const before=await read(),incoming=await fetchNotionSongs();
 const merged=mergeCatalog(mergeCatalog(base,before?.value.songs||[]).songs,incoming);
 const now=new Date().toISOString();
 const value={version:now,songs:merged.songs.map(({artwork,...song})=>song),sync:{mode:'manual',status:'ok',lastSuccess:now,sourceCount:incoming.length,total:merged.songs.length,added:merged.added,updated:merged.updated,preserved:merged.preserved,deletedSongs:'preserve'}};
 // Only a complete successful fetch replaces the saved catalog. Failed fetches keep it intact.
 await writeJson(key,value,before?.etag);
 cache=undefined;return value.sync;
}
