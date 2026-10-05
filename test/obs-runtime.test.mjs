import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createApp} from '../server.mjs';

test('OBS 부트스트랩은 파일 출처에서 준비 상태만 조회할 수 있다',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kira-health-test-'));
 const {server}=createApp({root});
 try {
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const url=`http://127.0.0.1:${server.address().port}`;
  const health=await fetch(url+'/api/health',{headers:{Origin:'null'}});
  assert.equal(health.headers.get('access-control-allow-origin'),'*');
  assert.deepEqual(await health.json(),{app:'kira-setlist',ready:true});
  const state=await fetch(url+'/api/state',{headers:{Origin:'null'}});
  assert.equal(state.headers.get('access-control-allow-origin'),null);
 } finally {await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
});
