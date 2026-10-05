import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),version=JSON.parse(fs.readFileSync(path.join(root,'app/package.json'),'utf8')).version;
const installer=path.join(root,`dist/KiraSetlist-Integrated-${version}`),manual=path.join(root,`dist/KiraSetlist-Manual-${version}`);
fs.mkdirSync(installer,{recursive:true});fs.mkdirSync(manual,{recursive:true});
for(const name of ['설치하기.exe','install.ps1','install.mjs','obs-config.mjs','install.cmd','README.md'])fs.copyFileSync(path.join(root,name),path.join(installer,name));
fs.cpSync(path.join(root,'docs'),path.join(installer,'docs'),{recursive:true});
const template=JSON.parse(fs.readFileSync(path.join(root,'obs-template.json'),'utf8'));delete template.browser.settings.local_file;fs.writeFileSync(path.join(installer,'obs-template.json'),JSON.stringify(template,null,2));
function copyApp(dest){
 fs.mkdirSync(dest,{recursive:true});for(const name of ['lib','public','runtime','server.mjs','package.json','kira-unified.lua','dock-launcher.html','overlay-launcher.html'])fs.cpSync(path.join(root,'app',name),path.join(dest,name),{recursive:true});
 fs.mkdirSync(path.join(dest,'data'),{recursive:true});for(const name of ['songbook.raw.json','artwork.json'])fs.copyFileSync(path.join(root,'app/data',name),path.join(dest,'data',name));
 if(fs.existsSync(path.join(dest,'data/state.json')))throw Error('Personal state must not be packaged');
 const artwork=fs.readdirSync(path.join(dest,'public/artwork'));if(artwork.some(name=>name!=='.gitkeep'))throw Error('Personal artwork must not be packaged');
}
copyApp(path.join(installer,'app'));copyApp(manual);
fs.cpSync(path.join(root,'docs'),path.join(manual,'docs'),{recursive:true});
// README's screenshot references use app/public; the standalone manual app is at ZIP root.
for(const name of fs.readdirSync(path.join(manual,'docs'))){if(name.endsWith('.md')){const file=path.join(manual,'docs',name);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('../app/public/','../public/'));}}
fs.writeFileSync(path.join(manual,'처음 읽기.txt'),'설치 프로그램이 없는 수동 연결판입니다.\r\n먼저 처음 시작.html을 열어 안내를 확인해 주세요.\r\nOBS 도구 > 스크립트에서 kira-unified.lua를 등록합니다.\r\n독 URL: http://127.0.0.1:4320/control?dock=1\r\n방송 URL: http://127.0.0.1:4320/overlay (3840 x 2160 / 60fps)\r\n압축을 푼 폴더는 옮기거나 삭제하지 마세요.\r\n');
fs.writeFileSync(path.join(manual,'OBS-setup.txt'),fs.readFileSync(path.join(manual,'처음 읽기.txt')));
fs.copyFileSync(path.join(root,'manual-start.html'),path.join(manual,'처음 시작.html'));
for(const folder of [installer,manual]){
 const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else if(e.name!=='SHA256SUMS.txt')files.push(file);}}walk(folder);
 fs.writeFileSync(path.join(folder,'SHA256SUMS.txt'),files.map(file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex')+'  '+path.relative(folder,file).replaceAll('\\','/')).join('\n')+'\n');
 console.log(JSON.stringify({folder,files:files.length,bytes:files.reduce((total,file)=>total+fs.statSync(file).size,0)}));
}
