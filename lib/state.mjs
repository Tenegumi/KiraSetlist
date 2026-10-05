import {randomUUID} from 'node:crypto';
export const defaultSettings=()=>({theme:'dark',opacity:70,caption:true,rotate:true,rotationSeconds:28,plaid:false,title:'LIVE SESSION',panelScale:75,panelRight:60,panelTop:55,captionScale:85,showPrevious:true,nextSongs:2});
export const freshState=()=>({version:1,revision:0,queue:[],currentId:null,history:[],customSongs:[],settings:defaultSettings()});
export function applyAction(state,action,songs){
 const s=structuredClone(state);s.customSongs??=[];const known=new Set([...songs,...s.customSongs].map(x=>x.id));
 const remember=()=>{s.history.push({queue:structuredClone(s.queue),currentId:s.currentId});s.history=s.history.slice(-40);};
 const entry=id=>{const e=s.queue.find(q=>q.id===id);if(!e)throw Error('목록에서 곡을 찾을 수 없습니다.');return e;};
 switch(action.type){
  case 'add':if(!known.has(action.songId))throw Error('노래책에 없는 곡입니다.');remember();s.queue.push({id:randomUUID(),songId:action.songId,status:'waiting'});break;
  case 'custom-add':{
   const title=typeof action.title==='string'?action.title.trim().normalize('NFC'):'';
   const artist=typeof action.artist==='string'?action.artist.trim().normalize('NFC'):'';
   if(!title||title.length>160)throw Error('곡명을 1–160자로 입력해 주세요.');
   if(artist.length>120)throw Error('가수명은 120자 이하로 입력해 주세요.');
   const song={id:`custom-${randomUUID()}`,title,artist,notes:[],genres:['직접 등록'],sourceUrl:null,custom:true,inSongbook:action.saveToBook===true};
   remember();s.customSongs.push(song);s.queue.push({id:randomUUID(),songId:song.id,status:'waiting'});break;
  }
  case 'start':{const e=entry(action.id);if(e.status==='done')throw Error('완료한 곡은 되돌린 후 선택해 주세요.');remember();s.queue.forEach(q=>{if(q.status==='current')q.status='waiting';});e.status='current';s.currentId=e.id;break;}
  case 'complete':{if(!s.currentId)throw Error('현재 부르는 곡을 먼저 지정해 주세요.');remember();const finished=entry(s.currentId);finished.status='done';finished.completedAt=s.revision+1;const next=s.queue.find(q=>q.status==='waiting');s.currentId=next?.id||null;if(next)next.status='current';break;}
  case 'remove':entry(action.id);remember();s.queue=s.queue.filter(q=>q.id!==action.id);if(s.currentId===action.id)s.currentId=null;break;
  case 'move':{const e=entry(action.id),from=s.queue.indexOf(e),to=Number(action.to);if(!Number.isInteger(to)||to<0||to>=s.queue.length)throw Error('이동 위치가 올바르지 않습니다.');remember();s.queue.splice(from,1);s.queue.splice(to,0,e);break;}
  case 'undo':{const previous=s.history.pop();if(!previous)throw Error('되돌릴 변경이 없습니다.');s.queue=previous.queue;s.currentId=previous.currentId;break;}
  case 'clear':remember();s.queue=[];s.currentId=null;break;
  case 'settings':{const a=action.settings||{};if(['dark','light'].includes(a.theme))s.settings.theme=a.theme;for(const key of ['caption','rotate','plaid','showPrevious'])if(typeof a[key]==='boolean')s.settings[key]=a[key];if(Number.isFinite(a.opacity))s.settings.opacity=Math.min(100,Math.max(0,Math.round(a.opacity)));if(Number.isFinite(a.rotationSeconds))s.settings.rotationSeconds=Math.min(60,Math.max(15,a.rotationSeconds));if(typeof a.title==='string')s.settings.title=a.title.trim().slice(0,48)||'LIVE SESSION';for(const [key,min,max] of [['panelScale',50,120],['panelRight',0,1700],['panelTop',0,1000],['captionScale',50,120],['nextSongs',0,5]])if(Number.isFinite(a[key]))s.settings[key]=Math.min(max,Math.max(min,Math.round(a[key])));break;}
  default:throw Error('지원하지 않는 동작입니다.');
 }
 s.revision++;return s;
}
