import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {freshState,applyAction} from './state.mjs';
export const digest=token=>createHash('sha256').update(token).digest('hex');
const match=(token,hash)=>{const d=digest(String(token||''));return typeof hash==='string'&&hash.length===d.length&&timingSafeEqual(Buffer.from(d),Buffer.from(hash));};
export function createRoom(){
 const id=randomBytes(18).toString('hex'),owner=randomBytes(32).toString('base64url'),view=randomBytes(24).toString('base64url');
 return {id,owner,view,room:{version:1,ownerHash:digest(owner),viewHash:digest(view),viewKey:view,createdAt:new Date().toISOString(),state:freshState(),artwork:{}}};
}
export function access(room,token){return match(token,room.ownerHash)?'owner':match(token,room.viewHash)?'viewer':null;}
export function payload(room){const s=room.state;return {...s,customSongs:undefined,history:undefined,canUndo:s.history.length>0,songs:(s.customSongs||[]).map(song=>({...song,artwork:room.artwork[song.id]||{status:'missing',image:null,candidates:[]}})),artworkOverrides:room.artwork};}
export function mutate(room,action,songs){
 if(room.state.queue.length>=250&&['add','custom-add'].includes(action.type))throw Error('리스트는 최대 250곡까지 추가할 수 있어요.');
 const next={...room,state:applyAction(room.state,action,songs)};
 if(Buffer.byteLength(JSON.stringify(next))>3_000_000)throw Error('저장 공간이 가득 찼어요. 사용하지 않는 곡이나 이미지를 정리해 주세요.');
 return next;
}
