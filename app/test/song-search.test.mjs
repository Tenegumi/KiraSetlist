import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {searchSongs,koreanKeyboard} from '../public/song-search.js';
const songs=[{id:'digimon',title:'Butter-Fly',artist:'전영호'},{id:'rave',title:'Butterfly Kiss',artist:'요네쿠라 치히로'},{id:'korean',title:'버터플라이',artist:'테스트'},{id:'korean2',title:'나비',artist:'테스트'},{id:'bad',title:'Bad Apple!!',artist:'동방 프로젝트'},{id:'love',title:'Love me or Leave me',artist:'DAY6'},{id:'another',title:'Love Story',artist:'다른 가수'}];
const ids=query=>searchSongs(songs,query).map(s=>s.id);
test('Korean pronunciation, punctuation-free English and two-set mistypes find both Butterfly songs',()=>{
 for(const query of ['버터플라이','버터 플라이','qjxjvmffkdl','>qjxjvmffkdl','QJXJVMFFKDL']){const result=ids(query);for(const id of ['digimon','rave','korean'])assert.ok(result.includes(id),query+':'+id);assert.ok(!result.includes('bad'));}
 for(const query of ['Butterfly','Ｂｕｔｔｅｒｆｌｙ']){const result=ids(query);for(const id of ['digimon','rave','korean'])assert.ok(result.includes(id),query+':'+id);}
 assert.deepEqual(ids('버터플라이 키스'),['rave']);assert.deepEqual(ids('qjxjvmffkdl zltm'),['rave']);
});
test('unfinished Korean syllables, English-key prefixes and initials update matches while typing',()=>{
 for(const query of ['버터ㅍ','버터플ㄹ','qjxjv','ㅂㅌㅍㄹㅇ'])assert.ok(ids(query).includes('digimon'),query);
 assert.equal(koreanKeyboard('버터플라이'),'qjxjvmffkdl');assert.equal(koreanKeyboard('버터플라이'.normalize('NFD')),'qjxjvmffkdl');assert.equal(koreanKeyboard('값 과'),'rkqtrhk');
 assert.ok(ids('skql').includes('korean2'));
});
test('existing artist, Japanese, Unicode, spacing and initials searches still work',()=>{
 const book=[...songs,{id:'japanese',title:'君の知らない物語',artist:'supercell'},{id:'korean3',title:'사랑했나봐',artist:'윤도현'}];
 assert.equal(searchSongs(book,'君の知らない')[0].id,'japanese');assert.equal(searchSongs(book,'ㅅㄹㅎㄴㅂ')[0].id,'korean3');assert.equal(searchSongs(book,'사랑했나봐'.normalize('NFD'))[0].id,'korean3');
 assert.ok(ids('전영호').includes('digimon'));assert.ok(ids('버터플라이 전영호').includes('digimon'));assert.ok(ids('데이식스').includes('love'));assert.ok(ids('Bad Apple').includes('bad'));assert.ok(ids('배드애플').includes('bad'));
});
test('multi-word English search does not become an OR search for every pronunciation token',()=>{
 assert.deepEqual(ids('love me'),['love']);assert.deepEqual(ids('러브 미'),['love']);
});
test('exact titles rank first, titles remain unchanged and edits invalidate the index',()=>{
 const before=structuredClone(songs);assert.equal(ids('버터플라이')[0],'korean');assert.deepEqual(searchSongs(songs,''),songs);assert.deepEqual(songs,before);
 const custom={id:'custom',title:'Other',artist:'Singer',searchAliases:['나만의 곡']};assert.equal(searchSongs([custom],'나만의').length,1);custom.title='버터플라이';custom.searchAliases=[];assert.equal(searchSongs([custom],'qjxjvmffkdl').length,1);assert.equal(searchSongs([custom],'나만의').length,0);
});
test('real catalog Butterfly titles are found without altering its stored records',async()=>{
 const rows=JSON.parse(await fs.readFile(new URL('../data/songbook.raw.json',import.meta.url),'utf8')),book=rows.map(([id,g,title,artist])=>({id,title,artist}));
 for(const query of ['버터플라이','qjxjvmffkdl']){const found=searchSongs(book,query);assert.ok(found.some(s=>s.title==='Butter-Fly'));assert.ok(found.some(s=>s.title==='Butterfly Kiss'));}
});
