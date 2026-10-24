import assert from 'node:assert/strict';
import test from 'node:test';
import {createRefreshPreset,refreshQueueSettings} from '../public/queue-refresh.js';
import {freshState,applyAction} from '../lib/state.mjs';
test('refresh overrides saved hidden, paused and differently sized queues using only five display fields',()=>{
 for(const edition of ['amp','original']){
  let state=freshState();state.edition=edition;
  state.settings={...state.appearances[edition],showPrevious:false,previousSongs:5,nextSongs:0,previousSlide:false,nextSlide:false,panelScale:73,panelRight:110,opacity:65};state.appearances[edition]={...state.settings};
  state.queue=[{id:'done',songId:'s',status:'done',completedAt:1},{id:'now',songId:'s',status:'current'}];state.currentId='now';state.customSongs=[{id:'s',title:'기존 직접 등록 곡'}];state.history=[{queue:[],currentId:null}];
  const before=structuredClone(state),patch=createRefreshPreset()(state.settings);assert.deepEqual(patch,refreshQueueSettings);state=applyAction(state,{type:'settings',settings:patch},[]);
  for(const key of ['queue','currentId','customSongs','history','edition'])assert.deepEqual(state[key],before[key]);
  for(const [key,value] of Object.entries(before.settings))if(!(key in patch))assert.deepEqual(state.settings[key],value,key);
  for(const [key,value] of Object.entries(patch))assert.equal(state.settings[key],value);
 }
});
test('live snapshots and reconnects do not reset choices, while a real page reload reapplies the requested preset',()=>{
 const receive=createRefreshPreset(),different={showPrevious:false,previousSongs:3,nextSongs:4,previousSlide:false,nextSlide:false};
 assert.deepEqual(receive(different),refreshQueueSettings);assert.equal(receive(different),null);assert.equal(receive(different),null);
 assert.deepEqual(createRefreshPreset()(different),refreshQueueSettings);
});
test('matching pages make no settings request, even when songs or layout values change',()=>{
 const receive=createRefreshPreset();assert.equal(receive({...refreshQueueSettings,panelScale:75}),null);
 assert.equal(receive({...refreshQueueSettings,panelScale:90}),null);
});
