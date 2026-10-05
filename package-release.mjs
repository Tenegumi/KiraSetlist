import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));const folder=path.join(root,'dist/KiraSetlist-Integrated-1.2.0');
fs.mkdirSync(folder,{recursive:true});
for(const file of ['설치하기.exe','install.ps1','install.mjs','install.cmd','README.md'])fs.copyFileSync(path.join(root,file),path.join(folder,file));
fs.cpSync(path.join(root,'docs'),path.join(folder,'docs'),{recursive:true});
const template=JSON.parse(fs.readFileSync(path.join(root,'obs-template.json'),'utf8'));delete template.browser.settings.local_file;
fs.writeFileSync(path.join(folder,'obs-template.json'),JSON.stringify(template,null,2));
const app=path.join(folder,'app');fs.mkdirSync(app,{recursive:true});
for(const file of ['lib','public','runtime','server.mjs','package.json','kira-unified.lua','dock-launcher.html','overlay-launcher.html'])fs.cpSync(path.join(root,'app',file),path.join(app,file),{recursive:true});
fs.mkdirSync(path.join(app,'data'),{recursive:true});for(const file of ['songbook.raw.json','artwork.json'])fs.copyFileSync(path.join(root,'app/data',file),path.join(app,'data',file));
// Include only the catalog: personal queue, OBS settings and credentials are not release files.
if(fs.existsSync(path.join(app,'data/state.json')))throw Error('Personal state must not be packaged');
const files=[];function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(item.name!=='SHA256SUMS.txt')files.push(p);}}walk(folder);
fs.writeFileSync(path.join(folder,'SHA256SUMS.txt'),files.map(p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')+'  '+path.relative(folder,p).replaceAll('\\','/')).join('\n')+'\n');
console.log(JSON.stringify({folder,files:files.length,bytes:files.reduce((n,p)=>n+fs.statSync(p).size,0)}));
