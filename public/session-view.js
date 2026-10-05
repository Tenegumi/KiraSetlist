// Completion order stays meaningful even when the lineup is reordered.
export function sessionWindow(state,nextCount=2){
 const current=state.queue.find(q=>q.id===state.currentId)||null;
 const completed=state.queue.filter(q=>q.status==='done');
 const previous=completed.reduce((last,q)=>!last||(q.completedAt||0)>=(last.completedAt||0)?q:last,null);
 return {current,previous,next:state.queue.filter(q=>q.status==='waiting').slice(0,nextCount)};
}
