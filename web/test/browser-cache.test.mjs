import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {browserRelease} from '../lib/browser-release.mjs';
import {fileURLToPath} from 'node:url';
import {obsLinks,recoveryUrl} from '../assets/browser-entry.js';

const root=new URL('../',import.meta.url);
test('OBS documents and transport modules share a policy-dependent release',async()=>{
 const release=await browserRelease(fileURLToPath(root));
 for(const file of ['index.html','control.html','overlay.html','editions/amp/overlay.html','editions/original/overlay.html']){
  const html=await fs.readFile(new URL('public/'+file,root),'utf8');
  assert.ok(html.includes(`<meta name="kira-release" content="${release}">`),file);
  const assets=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)];
  assert.ok(assets.length>0,file);
  for(const [,url] of assets)assert.equal(new URL(url,'https://example.test/'+file).searchParams.get('v'),release);
 }
 for(const file of ['control.js','overlay.js','editions/amp/overlay.js','editions/original/overlay.js']){
  const js=await fs.readFile(new URL('public/'+file,root),'utf8');
  assert.ok(js.includes(`import '/cloud-transport.js?v=${release}'`),file);
 }
 const transport=await fs.readFile(new URL('public/cloud-transport.js',root),'utf8');
 assert.ok(transport.includes(`'./direct-events.js?v=${release}'`));
 const entry=await fs.readFile(new URL('public/browser-entry.js',root),'utf8');
 assert.ok(entry.includes(`browserVersion='${release}'`));
 const wrapper=await fs.readFile(new URL('public/overlay.js',root),'utf8');
 assert.ok(wrapper.includes(`overlay.html?v=${release}`));
});

test('issued links bypass old URLs and keep owner secrets out of the viewer and query',()=>{
 const links=obsLinks({origin:'https://example.test',room:'room',owner:'owner secret',view:'view secret',release:'abc'});
 const dock=new URL(links.dock),overlay=new URL(links.overlay);
 assert.equal(dock.searchParams.get('dock'),'1');
 for(const url of [dock,overlay]){assert.equal(url.searchParams.get('v'),'abc');assert.equal([...url.searchParams.keys()].some(key=>['room','owner','view'].includes(key)),false);assert.equal(new URLSearchParams(url.hash.slice(1)).get('view'),'view secret');}
 assert.equal(new URLSearchParams(dock.hash.slice(1)).get('owner'),'owner secret');
 assert.equal(new URLSearchParams(overlay.hash.slice(1)).has('owner'),false);
});

test('stale documents recover once with their credentials and display flags preserved',()=>{
 const href='https://example.test/control?dock=1&preview=1#room=r&owner=o&view=w';
 const next=recoveryUrl({href,documentRelease:'old',release:'new'}),url=new URL(next);
 assert.equal(url.searchParams.get('dock'),'1');assert.equal(url.searchParams.get('preview'),'1');
 assert.equal(url.hash,new URL(href).hash);assert.equal(url.searchParams.get('v'),'new');
 assert.equal(recoveryUrl({href:next,documentRelease:'old',release:'new'}),null);
 assert.equal(recoveryUrl({href:next,documentRelease:'new',release:'new'}),null);
 assert.ok(recoveryUrl({href,documentRelease:undefined,release:'new'}));
});

test('OBS HTML is not stored while the scoped subscription policy remains enabled',async()=>{
 const config=JSON.parse(await fs.readFile(new URL('vercel.json',root),'utf8'));
 for(const source of ['/control','/overlay','/:file.html','/editions/:edition/overlay.html']){
  assert.ok(config.headers.some(rule=>rule.source===source&&rule.headers.some(h=>h.key==='Cache-Control'&&h.value==='no-store')),source);
 }
 const policies=config.headers.flatMap(rule=>rule.headers).filter(h=>h.key==='Content-Security-Policy');
 assert.ok(policies.some(h=>h.value.includes("connect-src 'self' https://*.upstash.io")));
});
