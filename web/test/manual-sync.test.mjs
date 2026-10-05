import assert from 'node:assert/strict';
import test from 'node:test';
import {authorizeNotionSync} from '../lib/manual-sync.mjs';

const secret='test-operator-secret';
const request=(method='POST',authorization=`Bearer ${secret}`,body={})=>({method,headers:{authorization,'content-type':'application/json',host:'kira.example'},body});
test('old scheduled GET cannot refresh even with valid operator credentials',async()=>{
 for(const method of ['GET','HEAD','PUT'])await assert.rejects(authorizeNotionSync(request(method),secret),{status:405});
});
test('manual sync requires operator credentials rather than a room key',async()=>{
 for(const authorization of ['',`Bearer ${'a'.repeat(43)}`,'Bearer test-operator-secreu'])await assert.rejects(authorizeNotionSync(request('POST',authorization),secret),{status:401});
 await assert.rejects(authorizeNotionSync(request(),''),{status:401});
 await authorizeNotionSync(request(),secret);
});
test('authorized manual sync still enforces origin, JSON and body limits',async()=>{
 const crossOrigin=request();crossOrigin.headers.origin='https://other.example';
 await assert.rejects(authorizeNotionSync(crossOrigin,secret),{status:403});
 const wrongType=request();wrongType.headers['content-type']='text/plain';
 await assert.rejects(authorizeNotionSync(wrongType,secret),{status:415});
 for(const body of [null,[], '{"bad":'])await assert.rejects(authorizeNotionSync(request('POST',`Bearer ${secret}`,body),secret),{status:400});
 await assert.rejects(authorizeNotionSync(request('POST',`Bearer ${secret}`,{text:'x'.repeat(17000)}),secret),{status:413});
 const sameOrigin=request();sameOrigin.headers.origin='https://kira.example';await authorizeNotionSync(sameOrigin,secret);
});
