// Deterministic HTML animation capture in headless Edge; never controls the desktop.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';
const root=process.cwd(),src=path.join(root,'docs/tutorial-motion'),out=path.join(root,'dist/KiraSetlist-Pixel-Guide');
fs.mkdirSync(out,{recursive:true});for(const f of ['motion-frames','keyframes'])fs.mkdirSync(path.join(out,f),{recursive:true});
const {chromium}=await import(pathToFileURL(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href);
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});let errors=[];page.on('pageerror',e=>errors.push(e.message));
const fps=8,duration=192,preview=Number(process.env.KIRA_MOTION_PREVIEW||0),seconds=preview||duration;
const srt=t=>new Date(t*1000).toISOString().slice(11,23).replace('.',',');let subtitles=[],shots=[];
try{
 await page.goto(pathToFileURL(path.join(src,'index.html')).href+'?export=1');
 for(let i=0;i<seconds*fps;i++){
  const t=i/fps;await page.evaluate(t=>window.renderTime(t),t);await page.waitForFunction(()=>window.frameReady===true);
  if(i%64===0){const check=await page.evaluate(()=>{let v=document.getElementById('visual');return {loaded:[...document.images].every(i=>i.complete&&i.naturalWidth),fits:v.scrollHeight<=v.clientHeight+2,title:document.getElementById('title').textContent,line:document.getElementById('line').textContent};});if(!check.loaded||!check.fits)throw Error(JSON.stringify(check));subtitles.push(`${subtitles.length+1}\n${srt(t)} --> ${srt(t+8)}\n${check.line}\n`);console.log(`${Math.floor(t/8)+1}/24 ${check.title}`);}
  await page.screenshot({path:path.join(out,'motion-frames',`${String(i).padStart(5,'0')}.jpg`),type:'jpeg',quality:91});
  if([4,24,36,50].includes(i%64)){const n=Math.floor(i/64)+1,name=`${String(n).padStart(2,'0')}-${String(i%64).padStart(2,'0')}.png`;await page.setViewportSize({width:1920,height:1080});await page.evaluate(t=>window.renderTime(t),t);await page.screenshot({path:path.join(out,'keyframes',name)});await page.setViewportSize({width:1280,height:720});shots.push(name);}
 }
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(out,'subtitles.srt'),subtitles.join('\n'));fs.writeFileSync(path.join(out,'keyframes.json'),JSON.stringify(shots,null,2));
}finally{await browser.close();}
const name=preview?'preview.mp4':'namgungwoo-tutorial.mp4';
const encoded=spawnSync('ffmpeg',['-y','-framerate',String(fps),'-i',path.join(out,'motion-frames/%05d.jpg'),'-t',String(seconds),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,name)],{stdio:'pipe',shell:false});
if(encoded.status!==0)throw Error(encoded.stderr.toString());
if(preview){const gif=spawnSync('ffmpeg',['-y','-i',path.join(out,name),'-vf','fps=8,scale=768:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse','-loop','0',path.join(out,'preview.gif')],{stdio:'pipe',shell:false});if(gif.status!==0)throw Error(gif.stderr.toString());}
console.log(JSON.stringify({seconds,fps,motionFrames:seconds*fps,keyframes:shots.length,errors,video:path.join(out,name)}));
