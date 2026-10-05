import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {once} from 'node:events';import {spawnSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';import {createApp} from './app/server.mjs';import {loadSongs} from './app/lib/catalog.mjs';import {freshState,applyAction} from './app/lib/state.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),output=path.join(root,'dist'),fps=60,seconds=8;
const {chromium}=await import(pathToFileURL(process.env.KIRA_PLAYWRIGHT_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const edition of ['original','amp']){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kira-motion-sample-'));fs.cpSync(path.join(root,'app/data'),path.join(temp,'data'),{recursive:true});fs.symlinkSync(path.join(root,'app/public'),path.join(temp,'public'),'junction');const songs=loadSongs(temp);
 let state=freshState();for(const title of ['Amazing kiss','ANGELUS','Bad Apple','Calc'])state=applyAction(state,{type:'add',songId:songs.find(s=>s.title.includes(title)).id},songs);
 state=applyAction(state,{type:'start',id:state.queue[0].id},songs);state=applyAction(state,{type:'complete'},songs);state=applyAction(state,{type:'edition',edition},songs);state=applyAction(state,{type:'settings',settings:{showPrevious:true,nextSongs:2,caption:true,rotate:true,opacity:82}},songs);fs.writeFileSync(path.join(temp,'data/state.json'),JSON.stringify(state));
 const {server}=createApp({root:temp,port:0});server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${server.address().port}`,page=await browser.newPage({viewport:{width:3840,height:2160}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const frames=path.join(temp,'frames');fs.mkdirSync(frames);let moves=0;
 try{
  await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
  await page.goto(origin+'/overlay?preview=1');const frame=page.frames().find(f=>f.url().includes('/editions/'))||await new Promise(async resolve=>{for(let i=0;i<60;i++){const f=page.frames().find(f=>f.url().includes('/editions/'));if(f)return resolve(f);await new Promise(r=>setTimeout(r,50));}});
  if(!frame)throw Error('Renderer did not load');await frame.waitForLoadState();await frame.evaluate(()=>document.fonts.ready);
  const payload=await fetch(origin+'/api/state').then(r=>r.json());const urls=payload.queue.map(q=>payload.songs.find(s=>s.id===q.songId).artwork.image).filter(Boolean);
  await frame.evaluate(urls=>Promise.all(urls.map(src=>new Promise(resolve=>{const img=new Image();img.onload=img.onerror=resolve;img.src=src;}))),urls);
  await page.clock.runFor(100);await frame.evaluate(()=>{window.captureAnimations=new Map();});
  for(let i=0;i<seconds*fps;i++){
   if(i===90||i===270){await fetch(origin+'/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'complete'})});await new Promise(r=>setTimeout(r,80));}
   await page.clock.runFor(1000/fps);
   const info=await frame.evaluate(t=>{for(const a of document.getAnimations()){if(!window.captureAnimations.has(a))window.captureAnimations.set(a,t);a.pause();a.currentTime=(t-window.captureAnimations.get(a))*1000;}const el=document.querySelector('.record-sleeve');return {title:document.getElementById('song-title').textContent,animation:!!document.querySelector('.change-in'),recoil:el?getComputedStyle(el).translate:'none'};},i/fps);
   if(edition==='amp'&&info.animation&&info.recoil!=='none'&&info.recoil!=='0px')moves++;
   await page.screenshot({path:path.join(frames,`${String(i).padStart(4,'0')}.jpg`),type:'jpeg',quality:93});
   if(i%120===0)console.log(`${edition}: ${i}/${seconds*fps} · ${info.title}`);
  }
  assert.equal(errors.length,0);assert.ok((await frame.locator('#song-title').textContent()).includes('Calc'));if(edition==='amp')assert.ok(moves>10,'LP recoil must be present');
  const name=edition==='amp'?'KiraSetlist-DLC-Motion-60fps.mp4':'KiraSetlist-Original-Motion-60fps.mp4';
  const encode=spawnSync('ffmpeg',['-y','-framerate','60','-i',path.join(frames,'%04d.jpg'),'-vf','scale=1920:1080:flags=lanczos','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,name)],{shell:false,stdio:'pipe'});if(encode.status!==0)throw Error(encode.stderr.toString());
  console.log(JSON.stringify({edition,video:path.join(output,name),source4K:true,output:'1920x1080',fps,seconds,frames:seconds*fps,moves,errors}));
 }finally{await page.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
}}finally{await browser.close();}
