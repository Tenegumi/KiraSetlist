const scenes=window.TUTORIAL_SCENES,$=id=>document.getElementById(id),length=8;
const params=new URLSearchParams(location.search);let shown=-1,clock=0,playing=!params.has('export'),last=performance.now();
if(params.has('export'))document.body.classList.add('export');
const poses=[[0,0],[100,0],[0,100],[100,100]];
function render(t){
 t=Math.max(0,Math.min(scenes.length*length-.001,t));clock=t;const n=Math.floor(t/length),local=Math.floor(t%length*8)/8,f=scenes[n];
 if(n!==shown){shown=n;$('phase').textContent=f.phase;$('title').textContent=f.title;$('number').textContent=`${String(n+1).padStart(2,'0')} / ${scenes.length}`;$('line').textContent=f.line;visual({...f,cut:'a'});window.frameReady=false;Promise.all([...document.images].map(img=>img.complete?null:new Promise(resolve=>{img.onload=img.onerror=resolve}))).then(()=>window.frameReady=true);}
 let pose=0,dx=0,dy=0,angle=0;
 if(local<1.5){dx=-380*(1-local/1.5);dy=Math.round(Math.sin(local*12)*8);angle=Math.sin(local*12)*3;pose=Math.floor(local*6)%2;}
 else if(local<2.5){pose=1;angle=Math.sin(local*15)*3;dy=-4;}
 else if(local<5.4){pose=2;dx=55;dy=-Math.abs(Math.sin(local*3))*4;angle=-2;}
 else{pose=3;dy=Math.round(Math.sin((local-5.4)*8)*4);angle=Math.sin((local-5.4)*8)*2;}
 $('sprite').style.backgroundPosition=`${poses[pose][0]}% ${poses[pose][1]}%`;
 $('puppet').style.transform=`translate(${Math.round(dx)}px,${Math.round(dy)}px) rotate(${angle.toFixed(1)}deg)`;
 $('bubble').textContent=local<2.5?'이것부터 같이 해보자!':local<5.4?'여기를 봐 줘 →':follow[f.visual]||'잘 됐어!';
 const target=document.querySelector('#visual .active, #visual .file, #visual .route span:last-of-type, #visual .shot-row');
 let tx=1110,ty=540;if(target){const r=target.getBoundingClientRect(),s=$('stage').getBoundingClientRect(),scale=s.width/1920;tx=(r.left-s.left+r.width*.65)/scale;ty=(r.top-s.top+r.height*.5)/scale;}
 const p=Math.max(0,Math.min(1,(local-2.5)/1));$('pointer').style.left=`${430+(tx-430)*p-35}px`;$('pointer').style.top=`${700+(ty-700)*p-35}px`;$('pointer').style.opacity=local>=2.5&&local<5.4?'1':'0';
 const click=local>=4&&local<4.75;$('click-ring').style.left=`${tx-50}px`;$('click-ring').style.top=`${ty-50}px`;$('click-ring').style.opacity=click?String(1-(local-4)/.75):'0';$('click-ring').style.transform=`scale(${.6+(local-4)*1.3})`;
 $('visual').style.transform=local>=4&&local<4.25?'translate(0,3px)':'none';$('progress').style.width=`${t/(scenes.length*length)*100}%`;
}
function resize(){const s=Math.min(innerWidth/1920,innerHeight/1080);$('stage').style.transform=`scale(${s})`;$('stage').style.left=`${(innerWidth-1920*s)/2}px`;$('stage').style.top=`${(innerHeight-1080*s)/2}px`;render(clock)}
function tick(now){if(playing){clock+=(now-last)/1000;if(clock>=scenes.length*length){clock=0;}render(clock)}last=now;requestAnimationFrame(tick)}
$('prev').onclick=()=>{render(Math.max(0,(shown-1)*length));};$('next').onclick=()=>render(Math.min((scenes.length-1)*length,(shown+1)*length));$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'일시 정지':'재생';};window.renderTime=render;window.addEventListener('resize',resize);resize();requestAnimationFrame(tick);
