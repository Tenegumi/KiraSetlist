const bound=(value,min,max,fallback)=>Math.min(max,Math.max(min,Number.isFinite(value)?value:fallback));
export function dlcLayout(settings={},height=640,width=518){
 const scale=Math.min(bound(settings.panelScale,50,120,80)/100,810/Math.max(1,height));
 return {scale,right:bound(settings.panelRight*.75,0,Math.max(0,1440-width*scale),45),top:bound(settings.panelTop*.75,0,Math.max(0,810-height*scale),57),captionScale:1.4*bound(settings.captionScale,50,120,100)/100,panelWidth:bound(settings.panelWidth,28,42,36)};
}
