import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {freshState,applyAction} from '../lib/state.mjs';
import {loadSongs} from '../lib/catalog.mjs';
import {sessionWindow} from '../public/session-view.js';
import {displayPreset,nextSongCount,overlayLayout} from '../public/overlay-layout.js';
import {createApp} from '../server.mjs';

test('표시 곡 수 변경은 현재 곡이나 대기 순서를 바꾸지 않는다',()=>{
 const songs=loadSongs();let state=freshState();
 for(const song of songs.slice(0,7))state=applyAction(state,{type:'add',songId:song.id},songs);
 state=applyAction(state,{type:'start',id:state.queue[0].id},songs);
 state=applyAction(state,{type:'complete'},songs);
 const before=structuredClone(state.queue),current=state.currentId;
 for(const [previous,count,preset] of [[false,0,'current'],[false,2,'next'],[true,2,'full'],[true,5,'custom']]){
  state=applyAction(state,{type:'settings',settings:{showPrevious:previous,nextSongs:count}},songs);
  assert.equal(displayPreset(state.settings),preset);
  assert.equal(sessionWindow(state,nextSongCount(state.settings)).next.length,count);
  assert.deepEqual(state.queue,before);assert.equal(state.currentId,current);
 }
 state=applyAction(state,{type:'settings',settings:{nextSongs:99,panelScale:0,panelRight:-4,panelTop:2000}},songs);
 assert.equal(state.settings.nextSongs,5);assert.equal(state.settings.panelScale,50);
 assert.equal(state.settings.panelRight,0);assert.equal(state.settings.panelTop,1000);
});

test('긴 제목과 최대 곡 수에서도 패널 위치가 방송 화면 안에 남는다',()=>{
 for(const height of [380,820,1900])for(const panelScale of [50,75,120]){
  const layout=overlayLayout({panelScale,panelRight:1700,panelTop:1000},height);
  assert.ok(layout.right+500*layout.scale<=1920);
  assert.ok(layout.top+height*layout.scale<=1080);
  assert.ok(layout.right>=0&&layout.top>=0);
 }
 assert.equal(overlayLayout({},400).scale,.75);
 const tallDefault=overlayLayout({},1900);assert.ok(tallDefault.top+1900*tallDefault.scale<=1080);
 assert.equal(nextSongCount({nextSongs:0}),0);assert.equal(nextSongCount({nextSongs:NaN}),2);
});

test('기존 저장 파일에 새 크기 기본값을 적용하고 표시 설정을 재실행 후 복원한다',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kira-layout-test-'));fs.mkdirSync(path.join(root,'data'));
 const old=freshState();delete old.settings.panelScale;delete old.settings.nextSongs;delete old.settings.showPrevious;
 old.settings.opacity=42;fs.writeFileSync(path.join(root,'data','state.json'),JSON.stringify(old));
 let app=createApp({root});
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');return `http://127.0.0.1:${app.server.address().port}`;};
 try{
  let url=await start(),state=await(await fetch(url+'/api/state')).json();
  assert.equal(state.settings.panelScale,75);assert.equal(state.settings.nextSongs,2);assert.equal(state.settings.opacity,42);
  const response=await fetch(url+'/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'settings',settings:{showPrevious:false,nextSongs:0,panelScale:60,panelRight:90,panelTop:200,captionScale:65}})});
  assert.equal(response.status,200);await new Promise(r=>app.server.close(r));app=createApp({root});url=await start();state=await(await fetch(url+'/api/state')).json();
  assert.equal(displayPreset(state.settings),'current');assert.equal(state.settings.panelScale,60);
  assert.equal(state.settings.panelRight,90);assert.equal(state.settings.panelTop,200);assert.equal(state.settings.captionScale,65);
 }finally{await new Promise(r=>app.server.close(r));fs.rmSync(root,{recursive:true,force:true});}
});
