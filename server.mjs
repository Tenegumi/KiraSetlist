import http from 'node:http';import fs from 'node:fs';import fsp from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {randomUUID} from 'node:crypto';
import {loadSongs} from './lib/catalog.mjs';import {freshState,applyAction} from './lib/state.mjs';
export function createApp({root=path.dirname(fileURLToPath(import.meta.url)),port=4317}={}){
 const dir=path.join(root,'data'),publicDir=path.join(root,'public');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(publicDir,'artwork'),{recursive:true});const songs=loadSongs(root);const statePath=path.join(dir,'state.json');let state=freshState();
 try{state={...state,...JSON.parse(fs.readFileSync(statePath,'utf8'))};state.settings={...freshState().settings,...state.settings};}catch(e){if(e.code!=='ENOENT'){try{state=JSON.parse(fs.readFileSync(statePath+'.bak','utf8'));console.warn('상태 백업을 복구했습니다.');}catch{throw Error('저장 파일을 읽을 수 없습니다. data/state.json을 확인해 주세요.');}}}
 const clients=new Set();let serial=Promise.resolve();let artwork={};let artMtime=0;
 function refreshArtwork(){try{const p=path.join(dir,'artwork.json'),mtime=fs.statSync(p).mtimeMs;if(mtime!==artMtime){artwork=JSON.parse(fs.readFileSync(p,'utf8'));artMtime=mtime;return true;}}catch{}return false;}
 function allSongs(){return [...songs,...(state.customSongs||[])];}
 function payload(){refreshArtwork();return {...state,customSongs:undefined,history:undefined,canUndo:state.history.length>0,songs:allSongs().map(s=>({...s,artwork:artwork[s.id]||{status:'missing',image:null,candidates:[]}}))};}
 function broadcast(){const data=`data: ${JSON.stringify(payload())}\n\n`;for(const res of clients)res.write(data);}
 function save(){const tmp=statePath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(state,null,2));if(fs.existsSync(statePath))fs.copyFileSync(statePath,statePath+'.bak');fs.renameSync(tmp,statePath);}
 function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
 async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>6*1024*1024)throw Error('파일은 4MB 이하로 등록해 주세요.');}return JSON.parse(text||'{}');}
 async function route(req,res){
  const host=req.headers.host;if(!host||!/^127\.0\.0\.1:\d+$/.test(host)&&!/^localhost:\d+$/.test(host))return json(res,403,{error:'로컬 주소로 접속해 주세요.'});
  const u=new URL(req.url,`http://${host}`);
  if(req.method==='GET'&&u.pathname==='/api/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});return res.end('{"app":"kira-setlist","ready":true}');}
  if(req.method==='POST'&&(req.headers.origin&&req.headers.origin!==`http://${host}`||!req.headers['content-type']?.startsWith('application/json')))return json(res,403,{error:'허용되지 않는 요청입니다.'});
  if(req.method==='GET'&&u.pathname==='/api/state')return json(res,200,payload());
  if(req.method==='GET'&&u.pathname==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(`data: ${JSON.stringify(payload())}\n\n`);clients.add(res);req.on('close',()=>clients.delete(res));return;}
  if(req.method==='POST'&&u.pathname==='/api/action'){const action=await body(req);state=applyAction(state,action,songs);save();broadcast();return json(res,200,payload());}
  if(req.method==='POST'&&u.pathname==='/api/artwork'){
   const data=await body(req),song=allSongs().find(s=>s.id===data.songId);if(!song)throw Error('등록되지 않은 곡입니다.');refreshArtwork();let record;
   if(data.dataUrl){const m=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(data.dataUrl);if(!m)throw Error('PNG, JPG, WebP 이미지만 등록할 수 있습니다.');const bytes=Buffer.from(m[2],'base64');if(bytes.length>4*1024*1024)throw Error('파일은 4MB 이하로 등록해 주세요.');const valid=m[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):m[1]==='jpeg'?bytes[0]===255&&bytes[1]===216:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!valid)throw Error('이미지 파일 형식이 올바르지 않습니다.');const file=`${song.id}-${randomUUID()}.${m[1]==='jpeg'?'jpg':m[1]}`;await fsp.writeFile(path.join(publicDir,'artwork',file),bytes);record={status:'manual',image:'/artwork/'+file,source:song.sourceUrl,candidates:artwork[song.id]?.candidates||[]};}
   else{const candidate=artwork[song.id]?.candidates?.find(c=>c.trackId===data.trackId);if(!candidate)throw Error('등록된 앨범 후보를 선택해 주세요.');record={status:'manual',image:candidate.image,source:candidate.source,candidates:artwork[song.id].candidates};}
   refreshArtwork();artwork[song.id]=record;const artTmp=path.join(dir,'artwork.manual.tmp');fs.writeFileSync(artTmp,JSON.stringify(artwork,null,2));fs.renameSync(artTmp,path.join(dir,'artwork.json'));artMtime=0;broadcast();return json(res,200,payload());
  }
  if(req.method==='GET'&&u.pathname==='/api/export'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="kira-setlist-backup.json"'});return res.end(JSON.stringify({state,artwork,songs},null,2));}
  if(req.method!=='GET')return json(res,404,{error:'페이지를 찾을 수 없습니다.'});
  const names={'/':'control.html','/control':'control.html','/overlay':'overlay.html','/guide':'guide.html'};const rel=names[u.pathname]||decodeURIComponent(u.pathname.slice(1));const file=path.resolve(publicDir,rel);if(!file.startsWith(publicDir+path.sep))return json(res,403,{error:'허용되지 않는 경로입니다.'});
  const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
  try{const content=await fsp.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://*.mzstatic.com data:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'"});res.end(content);}catch{return json(res,404,{error:'페이지를 찾을 수 없습니다.'});}
 }
 const server=http.createServer((req,res)=>{if(req.method==='POST'){serial=serial.then(()=>route(req,res)).catch(e=>{if(!res.headersSent)json(res,400,{error:e.message});else res.end();});}else route(req,res).catch(e=>{if(!res.headersSent)json(res,500,{error:e.message});});});
 const timer=setInterval(()=>{if(refreshArtwork())broadcast();for(const res of clients)res.write(': heartbeat\n\n');},3000);timer.unref();server.on('close',()=>{clearInterval(timer);for(const res of clients)res.end();});return {server,getState:payload};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.KIRA_PORT||4317);const {server}=createApp({port});
 server.listen(port,'127.0.0.1',()=>console.log(`KIRA SETLIST\nOBS 조작 패널 http://127.0.0.1:${port}/control?dock=1\nOBS 화면 http://127.0.0.1:${port}/overlay`));
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'이미 실행 중이거나 4317 포트를 사용 중입니다.':e.message);process.exitCode=1;});
 const ownerIndex=process.argv.indexOf('--owner-pid');const ownerPid=ownerIndex>=0?Number(process.argv[ownerIndex+1]):0;
 if(ownerPid>0){const ownerTimer=setInterval(()=>{try{process.kill(ownerPid,0);}catch{clearInterval(ownerTimer);server.close(()=>process.exit(0));server.closeAllConnections();}},2000);ownerTimer.unref();server.on('close',()=>clearInterval(ownerTimer));}
}
