import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {readJson,writeJson,writeImage,readImage,StorageConflict,StorageUnavailable,storageHealth} from '../lib/storage.mjs';

test('durable Redis records use atomic conflicts, isolate images, and stop retrying a failed provider',async()=>{
 const entries=new Map(),notices=[];let fail=false,calls=0;
 const server=createServer(async(req,res)=>{
  calls++;if(fail){res.writeHead(503);res.end('{}');return;}
  let body='';for await(const chunk of req)body+=chunk;
  const [command,...args]=JSON.parse(body);let result;
  if(command==='GET')result=entries.get(args[0])??null;
  if(command==='SET'){result=entries.has(args[0])?null:'OK';if(result)entries.set(args[0],args[1]);}
  if(command==='PING')result='PONG';
  if(command==='EVAL'){
   const [script,count,key,etag,raw,channel,message]=args;
   assert.equal(count,1);const old=entries.get(key);
   result=old&&JSON.parse(old).etag===etag?1:0;
   if(result){entries.set(key,raw);if(channel)notices.push({channel,message});}
  }
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({result}));
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 process.env.KV_REST_API_URL=`http://127.0.0.1:${server.address().port}`;process.env.KV_REST_API_TOKEN='test-only';delete process.env.BLOB_READ_WRITE_TOKEN;
 try{
  assert.equal(await readJson('missing'),null);
  const a=await writeJson('rooms/a.json',{state:{revision:1}});
  assert.deepEqual((await readJson('rooms/a.json')).value,a.value);
  await assert.rejects(writeJson('rooms/a.json',{state:{revision:2}}),StorageConflict);
  const b=await writeJson('rooms/a.json',{state:{revision:2}},a.etag,{id:'a',state:{revision:2}});
  await assert.rejects(writeJson('rooms/a.json',{state:{revision:3}},a.etag),StorageConflict);
  assert.equal((await readJson('rooms/a.json')).etag,b.etag);
  assert.equal(notices.length,1);assert.equal(notices[0].channel,'kira:v1:events:a');
  assert.deepEqual(JSON.parse(notices[0].message),{revision:2});
  await writeImage('rooms/a/images/sample.png',Buffer.from('image'),'image/png');
  assert.deepEqual(await readImage('rooms/a/images/sample.png'),{bytes:Buffer.from('image'),contentType:'image/png'});
  assert.equal(await readJson('rooms/b.json'),null);
  fail=true;await assert.rejects(readJson('rooms/a.json'),StorageUnavailable);const after=calls;
  await assert.rejects(readJson('rooms/b.json'),StorageUnavailable);assert.equal(calls,after);
  assert.equal((await storageHealth()).ready,false);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
