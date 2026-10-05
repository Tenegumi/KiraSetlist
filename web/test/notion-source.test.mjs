import test from 'node:test';import assert from 'node:assert/strict';
import {mergeCatalog,fetchNotionSongs,sourcePage} from '../lib/notion-source.mjs';
test('updates and additions retain removed songs and existing album art',()=>{
 const old=[{id:'a',title:'Before',artist:'Artist',genres:['K-pop'],notes:[],artwork:{image:'existing.jpg'}},{id:'b',title:'Keep removed'}];
 const incoming=[{id:'a',title:'After',artist:'Artist',genres:['K-pop'],notes:[]},{id:'c',title:'New',artist:'New artist',genres:['J-pop'],notes:[]}];
 const result=mergeCatalog(old,incoming);assert.equal(result.added,1);assert.equal(result.updated,1);assert.equal(result.preserved,1);assert.equal(result.songs.length,3);assert.equal(result.songs.find(s=>s.id==='a').artwork.image,'existing.jpg');assert.equal(result.songs.find(s=>s.id==='b').title,'Keep removed');assert.equal(result.songs.find(s=>s.id==='c').artwork.image,null);assert.equal(old[0].title,'Before');
});
test('incomplete public source fails instead of returning a partial replacement',async()=>{
 const responses=[{recordMap:{collection:{c:{value:{value:{id:'collection',parent_id:sourcePage,space_id:'space',schema:{title:{name:'노래 제목',type:'title'},artist:{name:'가수명'}}}}}}}},{allBlockIds:['missing'],recordMap:{block:{}}},{recordMap:{block:{}}},{recordMap:{block:{}}}];
 await assert.rejects(fetchNotionSongs(async()=>new Response(JSON.stringify(responses.shift()))),/일부 곡/);
});
test('complete public board excludes blank rows and imports newly visible songs',async()=>{
 const responses=[{recordMap:{collection:{c:{value:{value:{id:'collection',parent_id:sourcePage,space_id:'space',schema:{title:{name:'노래 제목',type:'title'},artist:{name:'가수명'}}}}}}}},{allBlockIds:['song','blank'],recordMap:{block:{}},compiledRequest:{loader:{reducers:{board_columns:{blockResults:{defaultLimit:25}}}}}},{result:{reducerResults:{board_columns:{hasMore:false,blockResults:{group:{hasMore:false,blockIds:['song']}}}}},recordMap:{block:{song:{value:{value:{id:'song',type:'page',parent_id:'collection',alive:true,properties:{title:[['New']],artist:[['Artist']]}}}}}}}];
 const songs=await fetchNotionSongs(async()=>new Response(JSON.stringify(responses.shift())));assert.equal(songs.length,1);assert.equal(songs[0].title,'New');assert.equal(responses.length,0);
});
