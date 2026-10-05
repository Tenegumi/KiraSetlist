import fs from 'node:fs/promises';
import {loadSongs,artistQuery,candidateScore,names} from '../lib/catalog.mjs';
const root=new URL('../',import.meta.url),path=new URL('data/artwork.json',root),cachePath=new URL('data/artwork-progress.json',root);
let saved={};try{saved=JSON.parse(await fs.readFile(path,'utf8'));}catch{}
let cache={};try{cache=JSON.parse(await fs.readFile(cachePath,'utf8'));}catch{}
const songs=loadSongs();const groups=new Map();
for(const song of songs){const artist=artistQuery(song),country=song.genres.includes('K-pop')?'KR':'JP',key=`${country}:${artist}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(song);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let lastQuery=0;
async function lookup(key,term,country,attribute){
 if(cache[key])return cache[key];
 await sleep(Math.max(0,3200-(Date.now()-lastQuery)));lastQuery=Date.now();
 const u=new URL('https://itunes.apple.com/search');u.search=new URLSearchParams({term,country,media:'music',entity:'song',limit:'200',lang:country==='JP'?'ja_jp':'en_us',...(attribute?{attribute}:{})});
 const res=await fetch(u,{signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error(`HTTP ${res.status}`);
 cache[key]=(await res.json()).results||[];await fs.writeFile(cachePath,JSON.stringify(cache));return cache[key];
}
function assign(song,tracks){
 if(saved[song.id]?.status==='manual')return;
 const ranked=tracks.map(t=>({t,score:candidateScore(song,t)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score),unique=new Map();
 for(const {t,score} of ranked){const c={trackId:t.trackId,title:t.trackName,artist:t.artistName,album:t.collectionName,image:t.artworkUrl100?.replace(/100x100bb/,'600x600bb'),source:t.trackViewUrl,score};if(c.image&&!unique.has(t.collectionId))unique.set(t.collectionId,c);}
 const candidates=[...unique.values()].slice(0,8),best=candidates[0];saved[song.id]={status:best?.score>=.99?'auto':'missing',image:best?.score>=.99?best.image:null,source:best?.score>=.99?best.source:null,candidates};
}
async function save(){
 try{const latest=JSON.parse(await fs.readFile(path,'utf8'));for(const [id,record] of Object.entries(latest))if(record.status==='manual')saved[id]=record;}catch{}
 await fs.writeFile(new URL('data/artwork.json.tmp',root),JSON.stringify(saved,null,2));await fs.rename(new URL('data/artwork.json.tmp',root),path);
}
for(const [key,value] of Object.entries(cache))if(key.startsWith('KR:')&&!value.length)delete cache[key];
for(const [key,ss] of groups){
 if(!cache[key]){await sleep(Math.max(0,3200-(Date.now()-lastQuery)));lastQuery=Date.now();const country=key.startsWith('KR:')?'US':'JP',query=key.slice(3);try{const u=new URL('https://itunes.apple.com/search');u.search=new URLSearchParams({term:query,country,media:'music',entity:'song',limit:'200',lang:country==='JP'?'ja_jp':'en_us'});const res=await fetch(u,{signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error(`HTTP ${res.status}`);cache[key]=(await res.json()).results||[];await fs.writeFile(cachePath,JSON.stringify(cache));}catch(e){console.log(JSON.stringify({artist:query,error:e.message}));continue;}}
 for(const song of ss){if(saved[song.id]?.status==='manual')continue;const ranked=cache[key].map(t=>({t,score:candidateScore(song,t)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);const unique=new Map();for(const {t,score} of ranked){const c={trackId:t.trackId,title:t.trackName,artist:t.artistName,album:t.collectionName,image:t.artworkUrl100?.replace(/100x100bb/,'600x600bb'),source:t.trackViewUrl,score};if(c.image&&!unique.has(t.collectionId))unique.set(t.collectionId,c);}const candidates=[...unique.values()].slice(0,8),best=candidates[0];saved[song.id]={status:best?.score>=.99?'auto':'missing',image:best?.score>=.99?best.image:null,source:best?.score>=.99?best.source:null,candidates};}
 try{const latest=JSON.parse(await fs.readFile(path,'utf8'));for(const [id,record] of Object.entries(latest))if(record.status==='manual')saved[id]=record;}catch{}
 await fs.writeFile(new URL('data/artwork.json.tmp',root),JSON.stringify(saved,null,2));await fs.rename(new URL('data/artwork.json.tmp',root),path);console.log(JSON.stringify({artist:key,processed:Object.keys(saved).length,artwork:Object.values(saved).filter(a=>a.image).length,total:songs.length}));
}
console.log(JSON.stringify({done:true,total:songs.length,artwork:Object.values(saved).filter(a=>a.image).length}));
// Artist name searches can be crowded by unrelated songs named after the artist.
// Re-rank all already fetched metadata, then search unresolved titles explicitly.
const pool=Object.values(cache).flat();for(const song of songs)assign(song,pool);await save();
for(const song of songs.filter(s=>!saved[s.id]?.image)){
 const ns=names(song),term=ns.find(n=>n!==song.title&&!/[가-힣]/.test(n)&&n.length>1)||song.title.replace(/\([^)]*\)/g,'').trim(),country=song.genres.includes('K-pop')?'US':'JP';
 try{const tracks=await lookup(`TITLE:${country}:${term}`,term,country,'songTerm');assign(song,[...pool,...tracks]);await save();console.log(JSON.stringify({title:song.title,artwork:Object.values(saved).filter(a=>a.image).length,total:songs.length}));}catch(e){console.log(JSON.stringify({title:song.title,error:e.message}));}
}
console.log(JSON.stringify({done:true,total:songs.length,artwork:Object.values(saved).filter(a=>a.image).length}));
