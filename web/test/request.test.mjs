import test from 'node:test';import assert from 'node:assert/strict';import {Readable} from 'node:stream';import {readBody} from '../lib/request.mjs';
test('parsed bodies obey the same limits as streamed bodies',async()=>{
 await assert.rejects(readBody({body:{value:'x'.repeat(17000)}}),e=>e.status===413);
 const stream=Readable.from([Buffer.from(JSON.stringify({value:'x'.repeat(17000)}))]);
 await assert.rejects(readBody(stream),e=>e.status===413);
 assert.deepEqual(await readBody({body:{type:'add',songId:'a'}}),{type:'add',songId:'a'});
});
test('invalid JSON, arrays and null are rejected without parser details',async()=>{
 for(const body of ['{"bad":', 'null','[]'])await assert.rejects(readBody({body}),e=>e.status===400&&e.message==='입력 형식이 올바르지 않아요.');
 await assert.rejects(readBody({body:null}),e=>e.status===400);
 await assert.rejects(readBody({get body(){throw new SyntaxError('private parser details');}}),e=>e.status===400&&!e.message.includes('private'));
 await assert.rejects(readBody({get body(){throw Error('Invalid JSON');}}),e=>e.status===400);
});
