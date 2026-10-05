import fs from 'node:fs';import path from 'node:path';import {randomUUID} from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolveOBSConfig,isLegacyKiraDock} from './obs-config.mjs';
const bundle=path.dirname(fileURLToPath(import.meta.url)),source=path.join(bundle,'app');
const dest=process.argv[2]||path.join(osHome(),'KiraSetlistUnified');
function osHome(){return process.env.USERPROFILE||process.env.HOME;}
const exeIndex=process.argv.indexOf('--obs-exe');
const target=resolveOBSConfig({exe:exeIndex>=0?process.argv[exeIndex+1]:undefined,portable:process.argv.includes('--portable')});
const obs=target.config,iniPath=target.iniPath;
let ini=fs.readFileSync(iniPath,'utf8');
const value=key=>ini.match(new RegExp('^'+key+'=(.*)$','m'))?.[1].trim();
const set=(key,v)=>{const re=new RegExp('^'+key+'=.*$','m');if(!re.test(ini))throw Error('OBS 설정을 찾지 못했습니다: '+key);ini=ini.replace(re,()=>key+'='+v);};
for(const key of ['SceneCollectionFile','SceneCollection','ExtraBrowserDocks'])if(value(key)===undefined)throw Error('OBS 설정 형식을 확인할 수 없어 설치를 멈췄어요. 수동 ZIP 안내를 이용해 주세요.');
const selected=value('SceneCollectionFile');
if(path.basename(selected)!==selected)throw Error('OBS 장면 파일 경로를 확인해 주세요.');
const scenesDir=path.join(obs,'basic/scenes');
const currentPath=[path.join(scenesDir,selected),path.join(scenesDir,selected+'.json')].find(f=>fs.existsSync(f));
if(!currentPath)throw Error('선택한 OBS에서 장면을 한 번 저장하고 다시 설치해 주세요.');
const collectionPath=path.join(scenesDir,'Kira_Setlist_Integrated.json');
const collection=JSON.parse(fs.readFileSync(fs.existsSync(collectionPath)?collectionPath:currentPath,'utf8'));
if(!Array.isArray(collection.sources)||!collection.sources.some(s=>s.id==='scene'))throw Error('OBS에 방송 장면을 하나 만든 뒤 다시 설치해 주세요.');
const oldDocks=JSON.parse(value('ExtraBrowserDocks'));
if(!Array.isArray(oldDocks))throw Error('OBS 독 설정을 확인할 수 없어 설치를 멈췄어요.');
if(path.resolve(dest)===path.resolve(source))throw Error('설치 파일 밖의 폴더를 선택해 주세요.');
if(fs.existsSync(dest)&&!fs.existsSync(path.join(dest,'kira-unified.lua')))throw Error('다른 프로그램의 폴더입니다. 별도 설치 폴더를 선택해 주세요.');
fs.mkdirSync(dest,{recursive:true});
for(const name of ['lib','runtime','server.mjs','package.json','kira-unified.lua','dock-launcher.html','overlay-launcher.html'])fs.cpSync(path.join(source,name),path.join(dest,name),{recursive:true,force:true});
const publicDir=path.join(dest,'public');fs.mkdirSync(publicDir,{recursive:true});
for(const file of fs.readdirSync(path.join(source,'public'),{withFileTypes:true}))if(file.name!=='artwork')fs.cpSync(path.join(source,'public',file.name),path.join(publicDir,file.name),{recursive:true,force:true});
const uploads=path.join(publicDir,'artwork');fs.mkdirSync(uploads,{recursive:true});
for(const file of fs.readdirSync(path.join(source,'public/artwork'))){const target=path.join(uploads,file);if(!fs.existsSync(target))fs.copyFileSync(path.join(source,'public/artwork',file),target);}
const data=path.join(dest,'data');fs.mkdirSync(data,{recursive:true});
const candidates=['KiraSetlistDLC','KiraSetlist'].map(name=>path.join(osHome(),name));
const previous=candidates.find(dir=>fs.existsSync(path.join(dir,'data/state.json')));
for(const name of ['songbook.raw.json','artwork.json'])if(!fs.existsSync(path.join(data,name)))fs.copyFileSync(path.join(previous||source,'data',name),path.join(data,name));
if(!fs.existsSync(path.join(data,'state.json'))&&previous){
 const s=JSON.parse(fs.readFileSync(path.join(previous,'data/state.json'),'utf8'));s.edition=path.basename(previous)==='KiraSetlistDLC'?'amp':'original';
 const old=candidates[1];const original=fs.existsSync(path.join(old,'data/state.json'))?JSON.parse(fs.readFileSync(path.join(old,'data/state.json'),'utf8')).settings:undefined;
 s.appearances={...(original?{original}:{}),[s.edition]:s.settings};fs.writeFileSync(path.join(data,'state.json'),JSON.stringify(s,null,2));
}
if(previous&&fs.existsSync(path.join(previous,'public/artwork'))){for(const file of fs.readdirSync(path.join(previous,'public/artwork'))){const target=path.join(dest,'public/artwork',file);if(!fs.existsSync(target))fs.copyFileSync(path.join(previous,'public/artwork',file),target);}}
const backup=path.join(obs,'kira-install-backups',new Date().toISOString().replaceAll(':','-')+'-'+randomUUID());fs.mkdirSync(backup,{recursive:true});fs.copyFileSync(iniPath,path.join(backup,'user.ini'));fs.copyFileSync(currentPath,path.join(backup,'scenes.json'));
if(fs.existsSync(collectionPath))fs.copyFileSync(collectionPath,path.join(backup,'integrated-scenes.json'));
const template=JSON.parse(fs.readFileSync(path.join(bundle,'obs-template.json'),'utf8'));
const sourceName='키라 통합 셋리스트 오버레이',collectionName='키라 통합 셋리스트 (원본 + DLC)';
let browser=collection.sources.find(s=>s.name===sourceName);
if(!browser){
 const oldNames=['키라 앰프 DLC 오버레이','키라 셋리스트 오버레이'];
 const removed=new Set(collection.sources.filter(s=>oldNames.includes(s.name)).map(s=>s.uuid));
 collection.sources=collection.sources.filter(s=>!removed.has(s.uuid));
 for(const s of [...collection.sources,...(collection.groups||[])])if(s.settings?.items)s.settings.items=s.settings.items.filter(i=>!removed.has(i.source_uuid));
 browser=structuredClone(template.browser);browser.name=sourceName;browser.uuid=randomUUID();browser.hotkeys={};collection.sources.unshift(browser);
 const scene=collection.sources.find(s=>s.name===collection.current_scene&&s.id==='scene')||collection.sources.find(s=>s.id==='scene');
 if(!scene)throw Error('OBS에 방송 장면을 하나 만든 뒤 다시 설치해 주세요.');
 const profile=value('ProfileDir');const profileFile=profile&&path.basename(profile)===profile?path.join(obs,'basic/profiles',profile,'basic.ini'):null;
 const profileINI=profileFile&&fs.existsSync(profileFile)?fs.readFileSync(profileFile,'utf8'):'';
 const cx=Number(profileINI.match(/^BaseCX=(\d+)$/m)?.[1]||1920),cy=Number(profileINI.match(/^BaseCY=(\d+)$/m)?.[1]||1080),scale=Math.min(cx/3840,cy/2160);
 const item=structuredClone(template.item);item.name=sourceName;item.source_uuid=browser.uuid;item.id=++scene.settings.id_counter;item.pos={x:0,y:0};item.pos_rel={x:-cx/cy,y:-1};item.scale={x:scale,y:scale};item.scale_rel={x:scale,y:scale};item.visible=true;item.locked=false;item.crop_left=item.crop_right=item.crop_top=item.crop_bottom=0;scene.settings.items.push(item);
}
browser.settings={is_local_file:false,url:'http://127.0.0.1:4320/overlay',width:3840,height:2160,fps_custom:true,fps:60,shutdown:false,css:''};
// Old example background is repointed only if it belongs to the setlist app.
for(const s of collection.sources)if(s.id==='browser_source'&&s.name==='키라 DLC 예시 배경')s.settings.url='http://127.0.0.1:4320/background.html';
collection.name=collectionName;collection.saved_projectors=[];collection.modules??={};collection.modules['scripts-tool']=[...(collection.modules['scripts-tool']||[]).filter(s=>!/(kira-setlist|kira-amplifier-dlc|kira-unified)\.lua$/.test(s.path)),{path:path.join(dest,'kira-unified.lua').replaceAll('\\','/'),settings:{}}];
fs.writeFileSync(collectionPath,JSON.stringify(collection,null,2));
const docks=oldDocks.filter(d=>!isLegacyKiraDock(d)),title='키라 통합 셋리스트';const hadUnified=docks.some(d=>d.title===title);let dock=docks.find(d=>d.title===title);
if(!dock){dock={title,uuid:randomUUID().replaceAll('-','')};docks.push(dock);}dock.url=pathToFileURL(path.join(dest,'dock-launcher.html')).href;
// OBS's Qt dock state identifies right-hand slots with length-prefixed UTF-16BE.
const dockState=value('DockState');if(dockState&&!hadUnified){const bytes=Buffer.from(dockState,'base64');const be=s=>Buffer.from(s,'utf16le').swap16();for(const oldTitle of oldDocks.filter(isLegacyKiraDock).map(d=>d.title)){
 const old=be(oldTitle+'_extraBrowser'),pos=bytes.indexOf(old);if(pos<4||bytes.readUInt32BE(pos-4)!==old.length)continue;
 const next=be(title+'_extraBrowser'),len=Buffer.alloc(4);len.writeUInt32BE(next.length);set('DockState',Buffer.concat([bytes.subarray(0,pos-4),len,next,bytes.subarray(pos+old.length)]).toString('base64'));break;
}}
set('ExtraBrowserDocks',JSON.stringify(docks));set('SceneCollection',collectionName);set('SceneCollectionFile','Kira_Setlist_Integrated.json');fs.writeFileSync(iniPath,ini);
// Broadcast resolution, FPS, encoders, bitrate, audio and stream keys are untouched.
fs.writeFileSync(path.join(dest,'OBS-setup.txt'),'키라 통합 셋리스트\nOBS 독 위쪽의 원본 / 앰프 DLC 버튼으로 전환하세요.\n노래책과 곡 목록은 공유하고 화면 설정은 버전별로 저장합니다.\n4K 브라우저 소스 / 60fps / 방송 화면은 기존 해상도 유지\n설치 폴더: '+dest+'\n');
console.log('설치와 OBS 연결 완료: '+dest+'\n기존 OBS 설정 백업: '+backup);
