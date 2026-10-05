import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {browserRelease} from './lib/browser-release.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
// A policy/transport change must also change document ETags. OBS can retain an
// old document policy while loading newer JavaScript from its browser cache.
const original=path.resolve(dir,'../app'),app=path.join(dir,'source');
try{
 await fs.access(original);
 for(const name of ['public','lib','data'])await fs.cp(path.join(original,name),path.join(app,name),{recursive:true,filter:p=>!/[\\/](guide-assets|artwork|runtime)(?:[\\/]|$)/.test(p)&&!/[\\/]state\.json/.test(p)&&!p.endsWith('.tmp')});
}catch(e){if(e.code!=='ENOENT')throw e;}
const release=await browserRelease(dir);
await fs.mkdir(path.join(dir,'public'),{recursive:true});
await fs.cp(path.join(app,'public'),path.join(dir,'public'),{recursive:true,filter:p=>!/[\\/](guide-assets|artwork)(?:[\\/]|$)/.test(p)});
await fs.cp(path.join(app,'lib'),path.join(dir,'lib'),{recursive:true});
await fs.mkdir(path.join(dir,'data'),{recursive:true});
for(const name of ['songbook.raw.json','artwork.json'])await fs.copyFile(path.join(app,'data',name),path.join(dir,'data',name));
await fs.cp(path.join(dir,'assets'),path.join(dir,'public'),{recursive:true});
const raw=JSON.parse(await fs.readFile(path.join(dir,'data/songbook.raw.json'),'utf8'));
const artworks=JSON.parse(await fs.readFile(path.join(dir,'data/artwork.json'),'utf8'));
const genres=['J-pop','K-pop','애니메이션','보컬로이드','기타'];
const songs=raw.map(([id,g,title,artist='',...notes])=>({id,title,artist,notes,genres:g.split(',').map(n=>genres[Number(n)]),sourceUrl:`https://app.notion.com/p/${id}`,artwork:artworks[id]||{status:'missing',image:null,candidates:[]}}));
await fs.writeFile(path.join(dir,'public/catalog.json'),JSON.stringify(songs));
for(const rel of ['control.js','overlay.js','editions/amp/overlay.js','editions/original/overlay.js']){
 const file=path.join(dir,'public',rel);
 let js=await fs.readFile(file,'utf8');
 js=`import '/cloud-transport.js?v=${release}';\n`+js;
 if(rel==='overlay.js')js=js.replace("${preview?'?preview=1':''}`",`?v=${release}\${preview?'&preview=1':''}\${location.hash}\``);
 if(rel==='control.js')js=js.replaceAll('`${location.origin}/overlay`','window.kiraCloud.overlayUrl');
 await fs.writeFile(file,js);
}
let html=await fs.readFile(path.join(dir,'public/control.html'),'utf8');
html=html.replace('KIRA / ORIGINAL + AMPLIFIER DLC','KIRA / WEB · ORIGINAL + AMPLIFIER DLC').replace('키라 통합 셋리스트</h1>','키라 웹 셋리스트</h1>');
html=html.replace('<button id="copy-overlay"','<button id="copy-dock" class="quiet" type="button">독 주소 복사</button><button id="copy-overlay"');
await fs.writeFile(path.join(dir,'public/control.html'),html);
await fs.appendFile(path.join(dir,'public/control.css'),'\n.dock #copy-overlay{display:inline-block}.header-actions{flex-wrap:wrap}\n');
for(const rel of ['index.html','control.html','overlay.html','editions/amp/overlay.html','editions/original/overlay.html']){
 const file=path.join(dir,'public',rel),html=await fs.readFile(file,'utf8');
 const versioned=html.replace('<head>',`<head><meta name="kira-release" content="${release}">`).replace(/((?:src|href)=["'])([^"']+\.(?:js|css))(?:\?[^"']*)?(["'])/g,(_,prefix,url,quote)=>`${prefix}${url}?v=${release}${quote}`);
 await fs.writeFile(file,versioned);
}
async function versionModules(rel=''){
 for(const entry of await fs.readdir(path.join(dir,'public',rel),{withFileTypes:true})){
  const next=path.join(rel,entry.name);
  if(entry.isDirectory())await versionModules(next);
  else if(entry.name.endsWith('.js')){
   const file=path.join(dir,'public',next),js=await fs.readFile(file,'utf8');
   await fs.writeFile(file,js.replaceAll('__KIRA_RELEASE__',release).replace(/((?:from\s*|import\s*)['"])(\.{1,2}\/[^'"]+\.js)(['"])/g,(_,prefix,url,quote)=>`${prefix}${url}?v=${release}${quote}`));
  }
 }
}
await versionModules();
console.log(`Built web edition: ${songs.length} songs. Personal state and local runtime excluded.`);
