import {pronunciationAliases} from './search-aliases.js';
const consonants='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const leading=['r','R','s','e','E','f','a','q','Q','t','T','d','w','W','c','z','x','v','g'];
const vowels=['k','o','i','O','j','p','u','P','h','hk','ho','hl','y','n','nj','np','nl','b','m','ml','l'];
const trailing=['','r','R','rt','s','sw','sg','e','f','fr','fa','fq','ft','fx','fv','fg','a','q','qt','t','T','d','w','c','z','x','v','g'];
const jamo=new Map([...Array.from(consonants).map((c,i)=>[c,leading[i]]),...Array.from('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ').map((c,i)=>[c,vowels[i]]),...Array.from('ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ').map((c,i)=>[c,trailing[i+1]])]);
export const normalizeSearch=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
// Compare physical two-set Korean keystrokes rather than guessing how to compose
// an unfinished IME syllable. Works with prefixes, final consonants and NFD input.
export function koreanKeyboard(value){
 return Array.from(String(value||'').normalize('NFC')).map(c=>{
  const n=c.charCodeAt(0)-0xac00;
  if(n>=0&&n<11172)return leading[Math.floor(n/588)]+vowels[Math.floor(n/28)%21]+trailing[n%28];
  const code=c.charCodeAt(0);
  if(code>=0x1100&&code<0x1100+19)return leading[code-0x1100];
  if(code>=0x1161&&code<0x1161+21)return vowels[code-0x1161];
  if(code>0x11a7&&code<0x11a7+28)return trailing[code-0x11a7];
  return jamo.get(c)||c;
 }).join('').toLowerCase().replace(/[^a-z0-9]/g,'');
}
const initials=value=>Array.from(String(value||'').normalize('NFC')).map(c=>{const n=c.charCodeAt(0)-0xac00;return n>=0&&n<11172?consonants[Math.floor(n/588)]:c;}).join('');
const cache=new WeakMap();
function indexFor(song){
 const extra=Array.isArray(song.searchAliases)?song.searchAliases.filter(v=>typeof v==='string'):[];
 const signature=JSON.stringify([song.title,song.artist,extra]),cached=cache.get(song);if(cached?.signature===signature)return cached;
 const title=String(song.title||''),artist=String(song.artist||'');
 const titles=[title,...pronunciationAliases(title),...extra],artists=[artist,...pronunciationAliases(artist)];
 const values=[...titles,...artists,...titles.flatMap(t=>artists.map(a=>`${t} ${a}`))];
 const normal=values.map(normalizeSearch).filter(Boolean),keys=values.map(koreanKeyboard).filter(Boolean),chosung=titles.map(v=>normalizeSearch(initials(v))).filter(Boolean);
 const entry={signature,normal,keys,chosung,title:normalizeSearch(title)};cache.set(song,entry);return entry;
}
export function searchSongs(songs,query){
 const normal=normalizeSearch(query),keyboard=koreanKeyboard(query);if(!normal)return songs.slice();
 const phonetic=/^[a-z0-9\s’'&☆♡.!\-]+$/i.test(String(query).normalize('NFKC'))?pronunciationAliases(query,{includeWords:false}).map(normalizeSearch).filter(Boolean):[];
 const result=[];
 for(const song of songs){
  const index=indexFor(song);
  const rank=index.title===normal?0:index.normal.some(v=>v===normal)?1:index.normal.some(v=>v.includes(normal))?2:index.chosung.some(v=>v.includes(normal))?3:index.normal.some(v=>phonetic.some(q=>v.includes(q)))?4:keyboard&&index.keys.some(v=>v.includes(keyboard))?5:-1;
  if(rank>=0)result.push({song,rank});
 }
 return result.sort((a,b)=>a.rank-b.rank).map(item=>item.song);
}
