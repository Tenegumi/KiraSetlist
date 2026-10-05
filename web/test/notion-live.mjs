import {fetchNotionSongs} from '../lib/notion-source.mjs';
const songs=await fetchNotionSongs();console.log({count:songs.length,first:songs[0].title,last:songs.at(-1).title});
