import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export async function browserRelease(dir){
 const hash=createHash('sha256');
 for(const file of ['vercel.json','build.mjs'])hash.update(file).update(await fs.readFile(path.join(dir,file)));
 async function visit(rel){
  const entries=(await fs.readdir(path.join(dir,rel),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'));
  for(const entry of entries){
   const file=`${rel}/${entry.name}`;
   if(entry.isDirectory())await visit(file);
   else if(/\.(js|html|css)$/.test(entry.name))hash.update(file).update(await fs.readFile(path.join(dir,file)));
  }
 }
 for(const rel of ['source/public','assets'])await visit(rel);
 return hash.digest('hex').slice(0,12);
}
