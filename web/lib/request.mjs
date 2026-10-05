export class ClientError extends Error{constructor(status,message){super(message);this.status=status;}}
export async function readBody(req,maxBytes=16384){
 let value,parsed;
 try{parsed=req.body;}catch(e){if(e instanceof SyntaxError||e.message==='Invalid JSON')throw new ClientError(400,'입력 형식이 올바르지 않아요.');throw e;}
 if(parsed!==undefined&&typeof parsed!=='string'){
  if(Buffer.byteLength(JSON.stringify(parsed))>maxBytes)throw new ClientError(413,'입력 내용이 너무 커요.');
  value=parsed;
 }else{
  let bytes=0;const parts=[];
  if(typeof parsed==='string'){parts.push(Buffer.from(parsed));bytes=Buffer.byteLength(parsed);}
  else for await(const chunk of req){const part=Buffer.from(chunk);bytes+=part.length;if(bytes>maxBytes)throw new ClientError(413,'입력 내용이 너무 커요.');parts.push(part);}
  if(bytes>maxBytes)throw new ClientError(413,'입력 내용이 너무 커요.');
  try{value=JSON.parse(Buffer.concat(parts).toString('utf8')||'{}');}catch{throw new ClientError(400,'입력 형식이 올바르지 않아요.');}
 }
 if(!value||Array.isArray(value)||typeof value!=='object')throw new ClientError(400,'입력 형식이 올바르지 않아요.');
 return value;
}
