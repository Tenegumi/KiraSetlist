import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL('C:/Users/legen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1040,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('https://kira-setlist-web.vercel.app');await page.locator('#create-room').click();await page.locator('dialog').waitFor({state:'visible'});
const dock=await page.locator('#dock-link').inputValue(),overlay=await page.locator('#overlay-link').inputValue();
assert.ok(dock.includes('owner='));assert.ok(overlay.includes('view=')&&!overlay.includes('owner='));assert.ok(!dock.includes('127.0.0.1'));
await page.locator('#open-control').click();await page.locator('#connection').filter({hasText:'연결됨'}).waitFor();assert.equal(await page.locator('#queue-count').textContent(),'0');assert.equal(await page.locator('#copy-overlay').isVisible(),true);
assert.deepEqual(errors,[]);console.log('PASS: anonymous landing → create private room → OBS links → working empty control dock.');await browser.close();
