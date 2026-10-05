// Credentials stay in the fragment; only the public release reaches the server.
export const browserVersion='__KIRA_RELEASE__';
export function obsLinks({origin,room='',owner='',view='',release=''}){
 const dock=new URL('/control',origin),overlay=new URL('/overlay',origin);
 dock.searchParams.set('dock','1');
 if(release){dock.searchParams.set('v',release);overlay.searchParams.set('v',release);}
 dock.hash=new URLSearchParams({room,...(owner?{owner}:{}),view}).toString();
 overlay.hash=new URLSearchParams({room,view}).toString();
 return {dock:dock.href,overlay:overlay.href};
}

export function recoveryUrl({href,documentRelease,release}){
 if(!release||documentRelease===release)return null;
 const url=new URL(href);
 url.searchParams.set('v',release);
 // Do not revisit a stale cache entry even if its query already has this version.
 url.searchParams.set('kira-recover',release);
 if(url.href===href)return null;
 return url.href;
}
