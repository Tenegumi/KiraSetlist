// Capture the real application UI with disposable data and a headless browser.
// Never connects to the running OBS service or moves the desktop pointer.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createApp} from '../server.mjs';
import {loadSongs} from '../lib/catalog.mjs';
import {freshState,applyAction} from '../lib/state.mjs';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modulePath=process.env.KIRA_PLAYWRIGHT_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(modulePath).href);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'kira-guide-capture-'));
const output=path.join(project,'public','guide-assets');
fs.mkdirSync(output,{recursive:true});
let browser,app;
try {
 fs.cpSync(path.join(project,'public'),path.join(root,'public'),{recursive:true});
 fs.mkdirSync(path.join(root,'data'));
 fs.copyFileSync(path.join(project,'data','artwork.json'),path.join(root,'data','artwork.json'));
 const songs=loadSongs();
 const demo=['HAPPY','방해쟁이','Calc','로미오와 신데렐라','한 페이지가 될 수 있게'].map(title=>songs.find(s=>s.title.includes(title))).filter(Boolean);
 if(demo.length<4)throw Error('Demo songs missing');
 let state=freshState();
 for(const song of demo)state=applyAction(state,{type:'add',songId:song.id},songs);
 state=applyAction(state,{type:'start',id:state.queue[0].id},songs);
 state=applyAction(state,{type:'complete'},songs);
 state=applyAction(state,{type:'complete'},songs);
 state.settings.plaid=true;
 fs.writeFileSync(path.join(root,'data','state.json'),JSON.stringify(state));
 app=createApp({root});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
 const base=`http://127.0.0.1:${app.server.address().port}`;
 browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 const dock=await browser.newPage({viewport:{width:400,height:900},deviceScaleFactor:1.5});
 dock.on('pageerror',e=>errors.push(e.message));
 await dock.goto(base+'/control?dock=1');
 await dock.locator('#connection').filter({hasText:'연결됨'}).waitFor();
 await dock.waitForFunction(()=>[...document.querySelectorAll('.lineup-section img')].every(img=>img.complete),null,{timeout:8000}).catch(()=>{});
 const shot=async name=>{await dock.evaluate(()=>window.scrollTo(0,0));await dock.screenshot({path:path.join(output,name),fullPage:true});};
 await shot('dock-list.png');
 await dock.getByRole('button',{name:'노래책',exact:true}).click();
 await dock.locator('#search').fill('데이식스');
 await shot('songbook-search.png');
 await dock.getByRole('button',{name:'리스트',exact:true}).click();
 await dock.getByRole('button',{name:'+ 직접 추가',exact:true}).click();
 await dock.locator('#custom-title').fill('오늘의 신청곡');
 await dock.locator('#custom-artist').fill('신청한 아티스트');
 await dock.locator('#custom-save').check();
 await dock.locator('#custom-dialog').screenshot({path:path.join(output,'custom-song.png')});
 await dock.getByRole('button',{name:'곡 추가 닫기',exact:true}).click();
 await dock.getByRole('button',{name:'화면 설정',exact:true}).click();
 await shot('display-settings.png');
 await dock.locator('.settings-grid').screenshot({path:path.join(output,'settings-full.png')});
 await dock.getByRole('button',{name:'설치·사용 안내',exact:true}).click();
 await dock.frameLocator('#help-dialog iframe').getByRole('heading',{name:'압축을 풀고 install.cmd 실행',exact:true}).waitFor();
 await dock.locator('#help-dialog').screenshot({path:path.join(output,'in-dock-guide.png')});
 await dock.getByRole('button',{name:'설치 안내 닫기',exact:true}).click();
 const overlay=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 overlay.on('pageerror',e=>errors.push(e.message));
 await overlay.goto(base+'/overlay');
 await overlay.locator('#song-title').filter({hasText:'Calc'}).waitFor();
 await overlay.evaluate(()=>document.documentElement.style.background='#25202f');
 await overlay.locator('.setlist').screenshot({path:path.join(output,'panel-full.png')});
 await dock.locator('#display-preset').selectOption('current');
 await overlay.waitForFunction(()=>document.getElementById('previous-section').hidden&&document.getElementById('next-section').hidden);
 await overlay.locator('.setlist').screenshot({path:path.join(output,'panel-current.png')});
 if(errors.length)throw Error(errors.join('\n'));
 console.log(`Saved actual app screenshots to ${output}`);
} finally {
 if(browser)await browser.close();
 if(app){app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
 fs.rmSync(root,{recursive:true,force:true});
}
