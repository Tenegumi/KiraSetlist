import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {freshState,applyAction} from '../lib/state.mjs';
import {loadSongs} from '../lib/catalog.mjs';
import {createApp} from '../server.mjs';
import {sessionWindow} from '../public/session-view.js';
const songs=loadSongs();

test('직접 등록 곡은 원본 노래책을 수정하지 않고 추가·재추가·되돌리기를 지원한다',()=>{
 let state=freshState();const step=a=>state=applyAction(state,a,songs);
 assert.throws(()=>step({type:'custom-add',title:'   '}));
 assert.throws(()=>step({type:'custom-add',title:'a'.repeat(161)}));
 step({type:'custom-add',title:'  테스트 신청곡  ',artist:'  테스트 가수  ',saveToBook:false});
 const id=state.customSongs[0].id;
 assert.equal(state.customSongs[0].title,'테스트 신청곡');assert.equal(state.customSongs[0].artist,'테스트 가수');
 assert.equal(state.customSongs[0].inSongbook,false);assert.equal(songs.length,211);
 step({type:'start',id:state.queue[0].id});step({type:'complete'});assert.equal(sessionWindow(state).previous.songId,id);
 step({type:'undo'});assert.equal(sessionWindow(state).previous,null);
 step({type:'add',songId:id});assert.equal(state.queue.length,2);
 step({type:'undo'});assert.equal(state.queue.length,1);
 step({type:'custom-add',title:'다시 부를 곡',saveToBook:true});assert.equal(state.customSongs[1].inSongbook,true);
});

test('이전 곡은 완료 순서, 다음 두 곡은 다음 곡 전환 순서와 일치한다',()=>{
 let state=freshState();const step=a=>state=applyAction(state,a,songs);
 for(const song of songs.slice(0,4))step({type:'add',songId:song.id});
 const ids=state.queue.map(q=>q.id);
 step({type:'start',id:ids[2]});step({type:'complete'});
 assert.equal(sessionWindow(state).previous.id,ids[2]);assert.equal(sessionWindow(state).current.id,ids[0]);
 assert.deepEqual(sessionWindow(state).next.map(q=>q.id),[ids[1],ids[3]]);
 step({type:'complete'});assert.equal(sessionWindow(state).previous.id,ids[0]);
 step({type:'move',id:ids[2],to:3});assert.equal(sessionWindow(state).previous.id,ids[0]);
 step({type:'undo'});step({type:'undo'});assert.equal(sessionWindow(state).previous.id,ids[2]);
 step({type:'remove',id:ids[3]});assert.equal(sessionWindow(state).next.length,1);
 step({type:'clear'});assert.deepEqual(sessionWindow(state),{current:null,previous:null,next:[]});
});

test('직접 추가한 곡과 앨범 이미지는 재실행 후 복구된다',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kira-custom-test-'));let app=createApp({root}),url;
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');url=`http://127.0.0.1:${app.server.address().port}`;};
 const post=(route,data)=>fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{
  await start();let r=await post('/api/action',{type:'custom-add',title:'Custom Band Song',artist:'Band',saveToBook:true});assert.equal(r.status,200);
  let result=await r.json();const song=result.songs.find(s=>s.custom);assert.equal(result.songs.length,212);
  const dataUrl='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
  r=await post('/api/artwork',{songId:song.id,dataUrl});assert.equal(r.status,200);result=await r.json();const image=result.songs.find(s=>s.id===song.id).artwork.image;assert.match(image,/^\/artwork\/custom-/);
  await new Promise(r=>app.server.close(r));app=createApp({root});await start();result=await(await fetch(url+'/api/state')).json();
  const restored=result.songs.find(s=>s.id===song.id);assert.equal(restored.title,'Custom Band Song');assert.equal(restored.inSongbook,true);assert.equal(restored.artwork.image,image);
  assert.equal(result.queue[0].songId,song.id);assert.ok(fs.existsSync(path.join(root,'public',image)));
 }finally{await new Promise(r=>app.server.close(r));fs.rmSync(root,{recursive:true,force:true});}
});
