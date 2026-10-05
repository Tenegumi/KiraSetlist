import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {fileURLToPath,pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url)),src=path.join(root,'docs/tutorial-motion'),out=path.join(root,'dist/KiraSetlist-Integrated-Guide'),stills=process.argv.includes('--stills-only');
for(const dir of ['images','motion-frames'])fs.mkdirSync(path.join(out,dir),{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.KIRA_PLAYWRIGHT_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href),browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));const fps=8,length=6;let count=0;const srt=t=>new Date(t*1000).toISOString().slice(11,23).replace('.',',');
try{
 await page.goto(pathToFileURL(path.join(src,'index.html')).href+'?export=1');count=await page.evaluate(()=>window.TUTORIAL_SCENES.length);
 for(let n=0;n<count;n++){
  for(const [i,time] of [.5,2.4,3.75,5.2].entries()){
   await page.evaluate(t=>window.renderTime(t),n*length+time);
   const check=await page.evaluate(()=>{const v=document.getElementById('visual'),title=document.querySelector('h1'),notes=[...document.querySelectorAll('#notes p')],rect=v.getBoundingClientRect();return {loaded:[...document.images].every(i=>i.complete&&i.naturalWidth),fits:v.scrollHeight<=v.clientHeight+2&&v.scrollWidth<=v.clientWidth+2,notesFit:notes.every(p=>{const r=p.getBoundingClientRect();return r.bottom<=rect.bottom-5&&r.right<=rect.right-5}),titleFit:title.scrollHeight<90,title:title.textContent};});
   if(!check.loaded||!check.fits||!check.notesFit||!check.titleFit)throw Error(JSON.stringify({n,...check}));
   await page.screenshot({path:path.join(out,'images',`${String(n+1).padStart(2,'0')}-${i+1}.png`)});
   if(i===2&&[0,3,5,8,10,11,13,21,25,28].includes(n))await page.screenshot({path:path.join(src,'examples',`${String(n+1).padStart(2,'0')}.png`)});
  }
 }
 console.log(JSON.stringify({stills:count*4,scenes:count,layoutChecked:true,errors}));
 if(!stills){
  for(let i=0;i<count*length*fps;i++){
   await page.evaluate(t=>window.renderTime(t),i/fps);await page.screenshot({path:path.join(out,'motion-frames',`${String(i).padStart(5,'0')}.jpg`),type:'jpeg',quality:90});
   if(i%(length*fps)===0)console.log(`Export ${Math.floor(i/(length*fps))+1}/${count}`);
  }
  const scenes=await page.evaluate(()=>window.TUTORIAL_SCENES);fs.writeFileSync(path.join(out,'subtitles.srt'),scenes.map((s,i)=>`${i+1}\n${srt(i*length)} --> ${srt((i+1)*length)}\n${s.line}\n`).join('\n'));
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
if(!stills){
 const run=args=>{const r=spawnSync('ffmpeg',args,{shell:false,stdio:'pipe'});if(r.status!==0)throw Error(r.stderr.toString());};
 run(['-y','-framerate','8','-i',path.join(out,'motion-frames/%05d.jpg'),'-t',String(count*length),'-c:v','libx264','-preset','fast','-crf','19','-r','24','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'kira-integrated-tutorial.mp4')]);
 run(['-y','-ss','48','-t','6','-i',path.join(out,'kira-integrated-tutorial.mp4'),'-vf','fps=8,scale=768:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse','-loop','0',path.join(src,'examples/movement.gif')]);
 fs.cpSync(src,path.join(out,'viewer'),{recursive:true});fs.copyFileSync(path.join(src,'narration.txt'),path.join(out,'narration.txt'));
 fs.writeFileSync(path.join(out,'README.txt'),`키라 통합 셋리스트 v1.2.1 영상 가이드\n\n수동 연결을 먼저 안내하고 자동 설치는 끝부분의 선택 사항입니다.\n${count}장면 / ${count*length}초 / 1920×1080 / 무음\n캐릭터 움직임: 초당 8컷 / 영상 파일: 24fps\nimages: 안내 이미지 ${count*4}장\nsubtitles.srt: 자막 / narration.txt: 내레이션 대사\nviewer/index.html: 단계 선택·이전·다음·일시정지\n\n실제 OBS 출력과 별도 예시 데이터의 앱 캡처를 사용합니다.\n설치 창은 실제 프로그램 컨트롤을 화면에 렌더링했습니다.\n입력값 안내 카드와 파일 다운로드·압축 해제 장면은 실제 OBS 캡처가 아닌 따라 하기 안내입니다.\n`);
 console.log(JSON.stringify({video:path.join(out,'kira-integrated-tutorial.mp4'),seconds:count*length,images:count*4,errors}));
}
