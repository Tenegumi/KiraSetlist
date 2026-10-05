import test from 'node:test';
import assert from 'node:assert/strict';
import {createSubscription,removeSubscription,subscriptionConnection,subscriberName} from '../lib/storage.mjs';
import {createRoom,payload} from '../lib/rooms.mjs';

test('provision a subscribe-only credential for one exact room channel; never return the admin token',async()=>{
 const saved=globalThis.fetch,commands=[];
 process.env.KV_REST_API_URL='https://test.upstash.io';process.env.KV_REST_API_TOKEN='admin-secret';
 globalThis.fetch=async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer admin-secret');const c=JSON.parse(options.body);commands.push(c);
  return Response.json({result:c[1]==='GENTOKEN'?'scoped-token':c[1]==='DELUSER'?1:'OK'});
 };
 try{
  const {id,room}=createRoom();room.subscription=await createSubscription(id);
  assert.deepEqual(commands,[['ACL','GENTOKEN',subscriberName(id)],['ACL','SETUSER',subscriberName(id),'reset','on','>scoped-token','-@all','resetkeys','resetchannels','&kira:v1:events:'+id,'+subscribe']]);
  assert.deepEqual(subscriptionConnection(id,room),{url:`https://test.upstash.io/subscribe/kira%3Av1%3Aevents%3A${id}`,channel:'kira:v1:events:'+id,token:'scoped-token'});
  assert.equal(JSON.stringify(payload(room)).includes('scoped-token'),false);
  await removeSubscription(id);assert.deepEqual(commands.at(-1),['ACL','DELUSER',subscriberName(id)]);
 }finally{globalThis.fetch=saved;}
});
