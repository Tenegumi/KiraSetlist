import test from 'node:test';import assert from 'node:assert/strict';import {freshState,applyAction,hydrateState} from '../lib/state.mjs';
const songs=[{id:'a',title:'A',artist:'Artist'}];
test('edition switches keep the same queue, current song and undo history',()=>{
 let s=applyAction(freshState(),{type:'add',songId:'a'},songs);s=applyAction(s,{type:'start',id:s.queue[0].id},songs);const original=structuredClone(s);
 for(const edition of ['original','amp','original'])s=applyAction(s,{type:'edition',edition},songs);
 assert.deepEqual(s.queue,original.queue);assert.equal(s.currentId,original.currentId);assert.deepEqual(s.history,original.history);
});
test('each design saves its appearance across switches and reloads',()=>{
 let s=applyAction(freshState(),{type:'settings',settings:{opacity:42,panelScale:65}},songs);
 s=applyAction(s,{type:'edition',edition:'original'},songs);s=applyAction(s,{type:'settings',settings:{opacity:95,panelScale:88,theme:'light'}},songs);
 s=hydrateState(JSON.parse(JSON.stringify(s)));assert.equal(s.settings.opacity,95);
 s=applyAction(s,{type:'edition',edition:'amp'},songs);assert.equal(s.settings.opacity,42);assert.equal(s.settings.panelScale,65);
 s=applyAction(s,{type:'edition',edition:'original'},songs);assert.equal(s.settings.theme,'light');assert.equal(s.settings.panelScale,88);
});
test('unknown editions are rejected and an older DLC save is migrated',()=>{
 assert.throws(()=>applyAction(freshState(),{type:'edition',edition:'invalid'},songs));
 const migrated=hydrateState({queue:[],history:[],settings:{opacity:77,caption:false}});assert.equal(migrated.edition,'amp');assert.equal(migrated.settings.opacity,77);assert.equal(migrated.settings.caption,false);
});
