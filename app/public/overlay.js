const frame=document.getElementById('edition-frame');let edition;
const preview=new URLSearchParams(location.search).has('preview');
const events=new EventSource('/api/events');events.onmessage=event=>{
 const state=JSON.parse(event.data),next=state.edition==='original'?'original':'amp';
 if(next===edition)return;edition=next;frame.hidden=true;
 frame.src=`/editions/${next}/overlay.html${preview?'?preview=1':''}`;
};
frame.addEventListener('load',()=>{frame.hidden=false});
