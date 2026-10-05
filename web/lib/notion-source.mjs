export const sourcePage='e9dcf414-7be9-836d-b551-01620d5c7b23';
export const sourceView='496cf414-7be9-8331-98e6-086b6eb81579';
const unwrap=item=>item?.value?.value||item?.value||item;
const text=value=>(value||[]).map(part=>part[0]||'').join('').trim().normalize('NFC');
export async function fetchNotionSongs(fetcher=fetch){
 async function request(endpoint,body){const response=await fetcher(`https://app.notion.com/api/v3/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`노래책 조회 실패 (${response.status})`);return response.json();}
 const page=await request('loadCachedPageChunkV2',{page:{id:sourcePage},cursor:{stack:[]},verticalColumns:false});
 const collection=Object.values(page.recordMap?.collection||{}).map(unwrap).find(c=>c.parent_id===sourcePage);
 if(!collection?.schema||!collection.id)throw Error('공개 노래책의 구조가 바뀌었어요. 기존 목록을 보존합니다.');
 const queried=await request('queryCollection?src=initial_load',{collectionView:{id:sourceView},collectionViewBlock:{id:sourcePage},clientType:'notion_app',userTimeZone:'Asia/Seoul',isFullScreen:true,isMobile:false});
 let ids=[...new Set(queried.allBlockIds||[])];if(!ids.length||ids.length>5000)throw Error('완전한 노래책 목록을 읽지 못했어요.');
 const blocks={...page.recordMap?.block,...queried.recordMap?.block};
 // A board initially returns only 25 records per genre. Ask the same public
 // query to load complete groups, rather than relying on space-level reads.
 if(ids.some(id=>!blocks[id])&&queried.compiledRequest?.loader?.reducers){
  const complete=structuredClone(queried.compiledRequest);
  for(const reducer of Object.values(complete.loader.reducers))if(reducer.blockResults){reducer.blockResults.defaultLimit=5000;reducer.blockResults.groupOverrides={};}
  const data=await request('queryCollection',complete);Object.assign(blocks,data.recordMap?.block||{});
  const groups=data.result?.reducerResults?.board_columns;
  const entries=Object.values(groups?.blockResults||{});
  // allBlockIds also includes blank rows that the public board does not render.
  // Validate every row in fully loaded public groups, including newly added rows.
  if(groups?.hasMore===false&&entries.length&&entries.every(g=>g.hasMore===false))ids=[...new Set(entries.flatMap(g=>g.blockIds||[]))];
 }
 const missing=ids.filter(id=>!blocks[id]);
 for(let i=0;i<missing.length;i+=100){const data=await request('syncRecordValuesSpaceInitial',{requests:missing.slice(i,i+100).map(id=>({pointer:{table:'block',id,spaceId:collection.space_id},version:-1})),spacePointer:{table:'space',id:collection.space_id}});Object.assign(blocks,data.recordMap?.block||{});}
 const retry=ids.filter(id=>!blocks[id]);
 if(retry.length){const data=await request('syncRecordValuesSpaceInitial',{requests:retry.map(id=>({pointer:{table:'block',id,spaceId:collection.space_id},version:-1})),spacePointer:{table:'space',id:collection.space_id}});Object.assign(blocks,data.recordMap?.block||{});}
 if(ids.some(id=>!blocks[id])){console.error('Notion incomplete source', {expected:ids.length,missing:ids.filter(id=>!blocks[id]).length});throw Error('일부 곡을 읽지 못했어요. 기존 목록을 보존합니다.');}
 const find=(name,type)=>Object.entries(collection.schema).find(([,s])=>s.name===name||type&&s.type===type)?.[0];
 const titleKey=find('노래 제목','title'),artistKey=find('가수명'),genreKey=find('Tags'),statusKey=find('상태'),memoKey=find('메모');
 if(!titleKey||!artistKey)throw Error('곡명·가수 항목을 확인하지 못했어요.');
 const songs=ids.map(id=>unwrap(blocks[id])).filter(b=>b.alive!==false&&b.parent_id===collection.id&&b.type==='page').map(b=>{
  const p=b.properties||{},id=b.id.replaceAll('-','');
  const tags=text(p[genreKey]).split(',').map(s=>s.trim()).filter(s=>['J-pop','K-pop','애니메이션','보컬로이드','기타','Pop'].includes(s));
  return {id,title:text(p[titleKey]),artist:text(p[artistKey]),genres:tags.length?tags:['기타'],notes:[text(p[statusKey]),text(p[memoKey])].filter(Boolean),sourceUrl:`https://app.notion.com/p/${id}`};
 }).filter(s=>s.title);
 if(!songs.length)throw Error('노래책이 비어 있어 기존 목록을 보존합니다.');return songs;
}
export function mergeCatalog(existing,incoming){
 const map=new Map(existing.map(s=>[s.id,s]));let added=0,updated=0;
 for(const song of incoming){const before=map.get(song.id);if(!before)added++;else if(['title','artist','notes','genres'].some(key=>JSON.stringify(before[key])!==JSON.stringify(song[key])))updated++;map.set(song.id,{...before,...song,artwork:before?.artwork||{status:'missing',image:null,candidates:[]}});}
 return {songs:[...map.values()],added,updated,preserved:existing.filter(s=>!incoming.some(n=>n.id===s.id)).length};
}
