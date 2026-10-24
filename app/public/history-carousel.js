export function createHistoryCarousel(host,{interval=4000,duration=650}={}){
 host.classList.add('history-carousel');
 let signature='',timer,settle,index=0,initial=0,count=0,track,visible=0,destroyed=false,sliding=true;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function stop(){clearTimeout(timer);clearTimeout(settle);timer=settle=null;}
 function transform(animated){
  if(!track)return;
  const first=track.children[0],second=track.children[1];
  const step=second?second.offsetTop-first.offsetTop:first?.offsetHeight||0;
  track.style.transition=animated&&!reduced.matches?`transform ${duration}ms cubic-bezier(.22,.75,.25,1)`:'none';
  track.style.transform=`translate3d(0,${-index*step}px,0)`;
  host.dataset.historyIndex=String(index%Math.max(1,count));
 }
 function schedule(){if(!destroyed&&sliding&&!document.hidden&&visible>0&&count>visible)timer=setTimeout(advance,interval);}
 function advance(){
  index++;transform(true);
  if(index===count){settle=setTimeout(()=>{index=0;transform(false);schedule();},reduced.matches?0:duration);}
  else schedule();
 }
 function visibility(){stop();index=initial;transform(false);schedule();}
 document.addEventListener('visibilitychange',visibility);
 const resize=new ResizeObserver(()=>transform(false));resize.observe(host);
 return {
  render(entries,{rows=2,row,empty,autoSlide=true,startIndex=0}){
   const shown=Math.max(0,Math.min(5,Math.round(rows))),rendered=entries.map(row);
   const next=JSON.stringify([shown,rendered,empty,autoSlide,startIndex]);if(signature===next)return;
   signature=next;stop();count=entries.length;visible=shown;initial=Math.min(Math.max(0,Math.round(startIndex)),Math.max(0,count-shown));index=initial;sliding=autoSlide!==false;host.hidden=shown===0;
   host.dataset.historyCount=String(count);host.dataset.historyRows=String(shown);host.dataset.historyIndex=String(index);host.dataset.sliding=String(sliding);
   host.style.setProperty('--history-rows',String(shown));
   const content=rendered.length?rendered:[empty];while(content.length<shown)content.push(empty);
   const duplicates=count>shown&&shown>0?rendered.slice(0,shown).map(html=>html.replace(/^<div /,'<div aria-hidden="true" ')):[];
   host.innerHTML=`<div class="history-track">${content.join('')}${duplicates.join('')}</div>`;
   track=host.firstElementChild;transform(false);schedule();
  },
  destroy(){destroyed=true;stop();resize.disconnect();document.removeEventListener('visibilitychange',visibility);}
 };
}
