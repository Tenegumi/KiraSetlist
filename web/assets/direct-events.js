// Upstash SSE frames can be split across network chunks. No idle polling timer.
export async function* eventFrames(reader){
 const decoder=new TextDecoder();let pending='';
 while(true){
  const {value,done}=await reader.read();if(done)return;
  pending+=decoder.decode(value,{stream:true});
  let end;
  while((end=pending.indexOf('\n\n'))!==-1){
   const frame=pending.slice(0,end);pending=pending.slice(end+2);
   const data=frame.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
   if(data)yield data;
  }
  if(pending.length>4_000_000)throw Error('변경 알림을 다시 연결하고 있어요.');
 }
}
export function notification(data,channel){
 if(/^(NOPERM|WRONGPASS|NOAUTH)\b/.test(data)){const error=Error('이 실시간 연결 키는 더 이상 사용할 수 없어요. 새 OBS 주소를 사용해 주세요.');error.terminal=true;throw error;}
 if(data.startsWith('ERR '))throw Error('변경 알림을 다시 연결하고 있어요.');
 const prefix=`message,${channel},`;
 if(!data.startsWith(prefix))return null;
 return JSON.parse(data.slice(prefix.length));
}
export function validateConnection(connection){
 const url=new URL(connection.url);
 if(url.protocol!=='https:'||!url.hostname.endsWith('.upstash.io')||url.username||url.password||url.search||url.hash||url.pathname!==`/subscribe/${encodeURIComponent(connection.channel)}`||typeof connection.token!=='string')throw Error('실시간 연결 주소를 확인해 주세요.');
 return connection;
}
