export function previousSongCount(settings={}){
 return settings.showPrevious===false?0:Math.round(Math.min(5,Math.max(1,Number.isFinite(settings.previousSongs)?settings.previousSongs:2)));
}
export function sessionWindow(state,nextCount=2){
 const currentIndex=state.queue.findIndex(q=>q.id===state.currentId);
 const current=currentIndex>=0?state.queue[currentIndex]:null;
 // Preserve sung/title order. Only the history renderer renumbers this result
 // 01..N, independently of the original queue positions (e.g. 1,7,9,2,3).
 const lastDoneIndex=state.queue.reduce((last,entry,index)=>entry.status==='done'?index:last,-1);
 const position=currentIndex>=0?currentIndex:lastDoneIndex;
 const previousSongs=state.queue.filter(entry=>entry.status==='done').sort((a,b)=>(a.completedAt||0)-(b.completedAt||0));
 const previous=previousSongs.at(-1)||null;
 // Skipped entries before the current position stay in the lineup, but are not
 // upcoming. After the final completion, do not wrap back to that earlier backlog.
 const upcomingSongs=state.queue.slice(position+1).filter(q=>q.status==='waiting');
 return {current,previous,previousSongs,upcomingSongs,next:upcomingSongs.slice(0,nextCount)};
}
