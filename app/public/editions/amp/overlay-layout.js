const bound=(value,min,max,fallback)=>Math.min(max,Math.max(min,Number.isFinite(value)?value:fallback));
export function nextSongCount(settings){return Math.round(bound(settings?.nextSongs,0,5,2));}
export function displayPreset(settings){const previous=settings?.showPrevious!==false,count=nextSongCount(settings);return !previous&&count===0?'current':!previous&&count===2?'next':previous&&count===2?'full':'custom';}
// Keep the entire card inside the broadcast canvas, including long song titles.
export function overlayLayout(settings={},height=700){
 const scale=Math.min(bound(settings.panelScale,50,120,75)/100,1080/Math.max(1,height));
 return {scale,right:bound(settings.panelRight,0,Math.max(0,1920-500*scale),60),top:bound(settings.panelTop,0,Math.max(0,1080-height*scale),55),captionScale:bound(settings.captionScale,50,120,85)/100};
}
