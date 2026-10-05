// Isolated headless browser verification; no desktop mouse or user browser is used.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';import {once} from 'node:events';
import {createApp} from '../server.mjs';import {loadSongs} from '../lib/catalog.mjs';import {freshState,applyAction} from '../lib/state.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modulePath=process.env.KIRA_PLAYWRIGHT_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(modulePath).href);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'kira-browser-test-'));let browser,app;
try{
 fs.cpSync(path.join(project,'public'),path.join(root,'public'),{recursive:true});fs.mkdirSync(path.join(root,'data'));
 const songs=loadSongs();let seed=freshState();
 for(const s of songs.slice(0,7))seed=applyAction(seed,{type:'add',songId:s.id},songs);
 seed=applyAction(seed,{type:'start',id:seed.queue[0].id},songs);seed=applyAction(seed,{type:'complete'},songs);
 fs.writeFileSync(path.join(root,'data','state.json'),JSON.stringify(seed));
 app=createApp({root});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base=`http://127.0.0.1:${app.server.address().port}`;
 browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/overlay');await page.locator('#song-title').filter({hasText:songs[1].title}).waitFor();
 const full=await page.locator('.setlist').boundingBox();assert.equal(Math.round(full.width),375);
 const control=await browser.newPage({viewport:{width:260,height:1100}});control.on('pageerror',e=>errors.push(e.message));
 await control.goto(base+'/control?dock=1');await control.locator('#connection').filter({hasText:'연결됨'}).waitFor();
 await control.getByRole('button',{name:'화면 설정',exact:true}).click();
 await control.locator('#display-preset').selectOption('current');
 await page.waitForFunction(()=>document.getElementById('previous-section').hidden&&document.getElementById('next-section').hidden);
 const compact=await page.locator('.setlist').boundingBox();assert.ok(compact.height<full.height-150);
 assert.equal(await control.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await control.locator('#nextSongs').selectOption('5');await page.waitForFunction(()=>document.querySelectorAll('#next-list>.next-row').length===5);
 await control.locator('#showPrevious').check();await page.locator('#previous-section').waitFor({state:'visible'});
 const fitted=await page.locator('.setlist').boundingBox();assert.ok(fitted.x>=0&&fitted.y>=0&&fitted.x+fitted.width<=1921&&fitted.y+fitted.height<=1081);
 await control.getByRole('button',{name:'설치·사용 안내',exact:true}).click();
 await control.frameLocator('#help-dialog iframe').getByRole('heading',{name:'압축을 풀고 install.cmd 실행',exact:true}).waitFor();
 await control.getByRole('button',{name:'설치 안내 닫기',exact:true}).click();
 await control.locator('#display-preset').selectOption('current');await page.waitForFunction(()=>document.getElementById('next-section').hidden);
 await control.locator('#panelScale').press('Home');await page.waitForFunction(()=>Math.round(document.querySelector('.setlist').getBoundingClientRect().width)===250);
 await control.locator('#panelScale').press('End');await page.waitForFunction(()=>Math.round(document.querySelector('.setlist').getBoundingClientRect().width)===600);
 await control.locator('#panelRight').press('End');await control.locator('#panelTop').press('End');
 await page.waitForFunction(()=>{const r=document.querySelector('.setlist').getBoundingClientRect();return r.x>=0&&r.y>=0&&r.bottom<=1081;});
 await control.locator('#reset-layout').click();await page.waitForFunction(()=>Math.round(document.querySelector('.setlist').getBoundingClientRect().width)===375);
 await control.evaluate(()=>window.scrollTo(0,0));
 const out=path.join(project,'test-results');fs.mkdirSync(out,{recursive:true});
 await page.screenshot({path:path.join(out,'overlay-current.png')});await control.screenshot({path:path.join(out,'dock-settings.png'),fullPage:true});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,fullHeight:full.height,currentOnlyHeight:compact.height,cardWidth:compact.width,narrowDockWidth:260,headlessBrowserErrors:errors}));
}finally{
 if(browser)await browser.close();if(app){app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
 fs.rmSync(root,{recursive:true,force:true});
}
