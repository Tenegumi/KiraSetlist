import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
test('OBS documents and transport modules share a policy-dependent release',async()=>{
 const hash=createHash('sha256');
 for(const file of ['vercel.json','assets/cloud-transport.js','assets/direct-events.js'])hash.update(await fs.readFile(new URL(file,root)));
 const release=hash.digest('hex').slice(0,12);
 for(const file of ['index.html','control.html','overlay.html','editions/amp/overlay.html','editions/original/overlay.html']){
  const html=await fs.readFile(new URL('public/'+file,root),'utf8');
  assert.ok(html.includes(`<meta name="kira-release" content="${release}">`),file);
 }
 for(const file of ['control.js','overlay.js','editions/amp/overlay.js','editions/original/overlay.js']){
  const js=await fs.readFile(new URL('public/'+file,root),'utf8');
  assert.ok(js.includes(`import '/cloud-transport.js?v=${release}'`),file);
 }
 const transport=await fs.readFile(new URL('public/cloud-transport.js',root),'utf8');
 assert.ok(transport.includes(`'./direct-events.js?v=${release}'`));
});

test('OBS HTML is not stored while the scoped subscription policy remains enabled',async()=>{
 const config=JSON.parse(await fs.readFile(new URL('vercel.json',root),'utf8'));
 for(const source of ['/control','/overlay','/:file.html','/editions/:edition/overlay.html']){
  assert.ok(config.headers.some(rule=>rule.source===source&&rule.headers.some(h=>h.key==='Cache-Control'&&h.value==='no-store')),source);
 }
 const policies=config.headers.flatMap(rule=>rule.headers).filter(h=>h.key==='Content-Security-Policy');
 assert.ok(policies.some(h=>h.value.includes("connect-src 'self' https://*.upstash.io")));
});
