import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const base='https://kira-setlist-web.vercel.app';
const create=async()=>{const r=await fetch(base+'/api?op=rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,201);return r.json();};
const a=await create(),b=await create();
async function request(op,{token=a.owner,data,raw,origin,room=a.room,extra={}}={}){
 const r=await fetch(base+'/api?'+new URLSearchParams({op,room,...extra}),{...(data!==undefined||raw!==undefined?{method:'POST',body:raw??JSON.stringify(data)}:{}),headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(data!==undefined||raw!==undefined?{'Content-Type':'application/json'}:{}),...(origin?{Origin:origin}:{})}});
 return {status:r.status,body:await r.text()};
}
assert.equal((await request('state',{token:null})).status,403);
assert.equal((await request('state',{token:b.owner})).status,403);
for(const op of ['action','artwork'])assert.equal((await request(op,{token:a.view,data:{type:'clear'}})).status,403);
assert.equal((await request('export',{token:a.view})).status,403);
assert.equal((await request('action',{data:{type:'clear'},origin:'https://evil.example'})).status,403);
for(const raw of ['null','[]','{"bad":']){const r=await request('action',{raw});assert.equal(r.status,400,`body=${raw}, response=${r.body}`);assert.ok(!r.body.includes('SyntaxError'));}
assert.equal((await request('action',{data:{type:'settings',unused:'x'.repeat(17000)}})).status,413);
assert.equal((await request('image',{extra:{image:'../../.env.local'}})).status,400);
assert.equal((await fetch(base+'/api/sync-notion')).status,405);
assert.equal((await fetch(base+'/api/sync-notion',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
for(const file of ['/.env.local','/.vercel/project.json','/source/data/state.json','/data/state.json'])assert.equal((await fetch(base+file)).status,404);
for(const path of ['/','/control','/overlay','/guide','/editions/amp/overlay.html']){const r=await fetch(base+path);assert.ok(r.headers.get('content-security-policy')?.includes("script-src 'self'"),path);assert.equal(r.headers.get('referrer-policy'),'no-referrer');}
const title='<img src=x onerror="window.__securityXss=1">',artist='<svg onload="window.__securityXss=1">';
const added=await request('action',{data:{type:'custom-add',title,artist,saveToBook:true}});assert.equal(added.status,200);const state=JSON.parse(added.body);
assert.equal((await request('action',{data:{type:'start',id:state.queue[0].id}})).status,200);
const {chromium}=await import(pathToFileURL('C:/Users/legen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const control=await browser.newPage(),overlay=await browser.newPage(),violations=[];
 await control.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>console.error('CSP violation '+e.violatedDirective)));
 control.on('console',m=>{if(m.type()==='error'&&m.text().includes('CSP violation'))violations.push(m.text());});
 await control.goto(base+'/control?dock=1#'+new URLSearchParams({room:a.room,owner:a.owner,view:a.view}));
 await control.locator('#queue-count').filter({hasText:'1'}).waitFor();assert.equal(await control.locator('#queue .song-name').innerText(),title);assert.equal(await control.locator('#queue svg').count(),0);assert.equal(await control.locator('#queue img[src=x]').count(),0);assert.equal(await control.evaluate(()=>window.__securityXss||0),0);
 await overlay.goto(base+'/overlay#'+new URLSearchParams({room:a.room,view:a.view}));
 const frame=overlay.frameLocator('#edition-frame');await frame.locator('#song-title').filter({hasText:title}).waitFor();assert.equal(await frame.locator('#song-title').innerText(),title);assert.equal(await overlay.frames()[1].evaluate(()=>window.__securityXss||0),0);
 assert.deepEqual(violations,[]);
}finally{await browser.close();}
console.log('PASS: tenant isolation, viewer write/export denial, CSRF, malformed/oversized bodies, path traversal, manual sync authentication, private file exposure, live CSP, literal HTML rendering without script execution.');
