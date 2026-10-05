import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/index.mjs';

test('legacy revision polling is rejected before storage and authentication',async()=>{
 const saved=globalThis.fetch;let requests=0;
 globalThis.fetch=async()=>{requests++;throw Error('Storage must not be called');};
 try{
  for(const url of ['/api?op=state&revision=30','/api/state?revision=0','/api?op=events']){
   let result;const res={setHeader(){},end(body){result=JSON.parse(body);}};
   await handler({url,method:'GET',headers:{}},res);
   assert.equal(res.statusCode,410);assert.equal(result.code,url.includes('events')?'legacy_stream_removed':'legacy_polling_removed');
  }
  assert.equal(requests,0);
 }finally{globalThis.fetch=saved;}
});
