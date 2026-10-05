import test from 'node:test';
import assert from 'node:assert/strict';
import {eventFrames,notification,validateConnection} from '../assets/direct-events.js';

test('subscription frames survive split UTF-8 chunks and preserve titles containing commas',async()=>{
 const channel='kira:v1:events:a',state={revision:3,title:'방해쟁이 / おじゃま虫, ♥'};
 const bytes=new TextEncoder().encode(`data: subscribe,${channel},1\n\ndata: message,${channel},${JSON.stringify(state)}\n\n`);
 let pos=0;const reader={async read(){if(pos>=bytes.length)return {done:true};const value=bytes.slice(pos,pos+=3);return {value,done:false};}};
 const frames=[];for await(const data of eventFrames(reader))frames.push(data);
 assert.equal(frames.length,2);assert.equal(notification(frames[0],channel),null);
 assert.deepEqual(notification(frames[1],channel),state);
 assert.equal(notification(frames[1],'another-room'),null);
 assert.throws(()=>notification(`message,${channel},broken`,channel));
 assert.throws(()=>notification('NOPERM this user has no permissions',channel),error=>error.terminal===true);
});
test('direct subscriptions only accept HTTPS Upstash endpoints with the exact channel path',()=>{
 const connection={url:'https://test.upstash.io/subscribe/kira%3Av1%3Aevents%3Aa',channel:'kira:v1:events:a',token:'scoped'};
 assert.equal(validateConnection(connection),connection);
 for(const url of ['http://test.upstash.io/subscribe/kira%3Av1%3Aevents%3Aa','https://evil.test/subscribe/kira%3Av1%3Aevents%3Aa','https://test.upstash.io.evil.test/subscribe/kira%3Av1%3Aevents%3Aa','https://test.upstash.io/get/private','https://test.upstash.io/subscribe/another','https://user:pass@test.upstash.io/subscribe/kira%3Av1%3Aevents%3Aa'])assert.throws(()=>validateConnection({...connection,url}));
});
