import {timingSafeEqual} from 'node:crypto';
import {ClientError,readBody} from './request.mjs';

// Scheduled GETs cannot refresh the songbook, even with the old scheduler secret.
export async function authorizeNotionSync(req,secret=process.env.NOTION_SYNC_SECRET||process.env.CRON_SECRET){
 if(req.method!=='POST')throw new ClientError(405,'노래책은 요청할 때만 수동으로 갱신해요.');
 const expected=Buffer.from(`Bearer ${secret||''}`),actual=Buffer.from(req.headers.authorization||'');
 if(!secret||actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new ClientError(401,'운영자의 수동 갱신 요청만 허용됩니다.');
 const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;
 if(origin&&origin!==`https://${host}`&&origin!==`http://${host}`)throw new ClientError(403,'이 사이트에서 다시 시도해 주세요.');
 if(!req.headers['content-type']?.startsWith('application/json'))throw new ClientError(415,'JSON 요청이 필요합니다.');
 await readBody(req);
}
