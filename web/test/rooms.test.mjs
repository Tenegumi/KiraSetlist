import test from 'node:test';import assert from 'node:assert/strict';import {createRoom,access,keysRevoked,mutate,payload} from '../lib/rooms.mjs';
test('viewer links cannot authenticate as owners; other rooms are isolated',()=>{const a=createRoom(),b=createRoom();assert.equal(access(a.room,a.owner),'owner');assert.equal(access(a.room,a.view),'viewer');assert.equal(access(a.room,b.owner),null);assert.equal(access(a.room,''),null);});
test('revoked credentials and restored legacy records cannot authenticate; new rooms remain usable',()=>{
 const a=createRoom(),cutoff='2026-10-06T00:00:00Z';
 assert.equal(keysRevoked({...a.room,createdAt:cutoff},cutoff),true);
 assert.equal(keysRevoked({...a.room,createdAt:undefined},cutoff),true);
 assert.equal(keysRevoked({...a.room,createdAt:'2026-10-06T00:00:01Z'},cutoff),false);
 const previous=process.env.ROOM_KEYS_REVOKED_BEFORE;process.env.ROOM_KEYS_REVOKED_BEFORE=cutoff;
 try{
  const old={...a.room,createdAt:'2026-10-05T23:59:59Z'};
  assert.equal(access(old,a.owner),null);assert.equal(access(old,a.view),null);
  const fresh={...a.room,createdAt:'2026-10-06T00:00:01Z'};
  assert.equal(access(fresh,a.owner),'owner');assert.equal(access(fresh,a.view),'viewer');
  assert.equal(access({...fresh,credentialsRevokedAt:cutoff},a.owner),null);
 }finally{if(previous===undefined)delete process.env.ROOM_KEYS_REVOKED_BEFORE;else process.env.ROOM_KEYS_REVOKED_BEFORE=previous;}
});
test('editions share current song; payload contains neither history nor credentials',()=>{const a=createRoom(),songs=[{id:'a',title:'Test',artist:'Artist',genres:[],notes:[]}];let room=mutate(a.room,{type:'add',songId:'a'},songs);room=mutate(room,{type:'start',id:room.state.queue[0].id},songs);const current=room.state.currentId;room=mutate(room,{type:'edition',edition:'original'},songs);assert.equal(room.state.currentId,current);const data=JSON.stringify(payload(room));for(const key of ['ownerHash','viewHash','viewKey','history'])assert.ok(!data.includes('"'+key+'"'));});
