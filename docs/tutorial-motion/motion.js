const scenes=window.TUTORIAL_SCENES,$=id=>document.getElementById(id),length=6,poses=[[0,0],[100,0],[0,100],[100,100]];
const params=new URLSearchParams(location.search);let shown=-1,clock=0,playing=!params.has('export'),last=performance.now(),ready=Promise.resolve();
if(params.has('export'))document.body.classList.add('export');
$('chapters').innerHTML=scenes.map((s,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} · ${s.title}</option>`).join('');
function render(t){
 t=Math.max(0,Math.min(scenes.length*length-.001,t));clock=t;const n=Math.floor(t/length),local=Math.floor(t%length*8)/8,s=scenes[n];
 if(n!==shown){shown=n;$('phase').textContent=s.phase;$('title').textContent=s.title;$('number').textContent=`${String(n+1).padStart(2,'0')} / ${scenes.length}`;$('chapters').value=n;$('line').textContent=s.line;
  $('notes').replaceChildren(...s.notes.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
  const wide=s.image?.startsWith('unified-')||['design-switch.png','queue-controls.png','settings-opacity.png','settings-rotate.png'].includes(s.image);$('visual').className=s.image?(wide?'wide':''):'text';
  $('capture-label').textContent=s.image?(s.image.startsWith('unified-')?'실제 OBS 출력':s.image==='installer.png'?'실제 설치 창 · 화면 렌더':s.image==='default-art.png'||s.image==='dlc-heart-detail.png'?'앱에서 사용하는 이미지':'실제 앱 캡처 · 예시 목록'):'따라 하기 안내';
  $('footnote').textContent=s.image?'클릭 표시는 안내용이에요. 버튼은 실제 OBS 독에서 눌러 주세요.':'현재 통합 설치본 기준 · 노래나 음원을 재생하지 않아요.';
  window.frameReady=false;ready=s.image?new Promise((resolve,reject)=>{const img=$('shot');img.onload=()=>{window.frameReady=true;resolve()};img.onerror=()=>reject(Error('Image failed: '+s.image));img.alt=s.title;img.src='assets/'+s.image;}):Promise.resolve().then(()=>window.frameReady=true);
 }
 let pose=0,dx=0,dy=0,angle=0;
 if(local<1){dx=-350*(1-local);dy=Math.round(Math.sin(local*13)*7);angle=Math.sin(local*13)*3;pose=Math.floor(local*8)%2;}
 else if(local<1.8){pose=1;angle=Math.sin(local*16)*3;dy=-4;}
 else if(local<4.6){pose=2;dx=45;dy=-Math.abs(Math.sin(local*4))*4;angle=-2;}
 else{pose=3;dy=Math.round(Math.sin((local-4.6)*9)*4);angle=Math.sin((local-4.6)*9)*2;}
 $('sprite').style.backgroundPosition=`${poses[pose][0]}% ${poses[pose][1]}%`;$('puppet').style.transform=`translate(${Math.round(dx)}px,${Math.round(dy)}px) rotate(${angle.toFixed(1)}deg)`;
 $('bubble').textContent=local<1.8?'같이 하나씩 해 보자!':local<4.6?'여기를 봐 줘 →':'좋아, 다음으로 가자!';
 let tx=1160,ty=480;if(s.target&&s.image){const r=$('shot').getBoundingClientRect(),stage=$('stage').getBoundingClientRect(),scale=stage.width/1920;tx=(r.left-stage.left+r.width*s.target[0])/scale;ty=(r.top-stage.top+r.height*s.target[1])/scale;}
 const p=Math.max(0,Math.min(1,(local-1.8)/.8));$('pointer').style.left=`${390+(tx-390)*p-35}px`;$('pointer').style.top=`${690+(ty-690)*p-35}px`;$('pointer').style.opacity=local>=1.8&&local<4.6&&s.target?'1':'0';
 const click=local>=3.5&&local<4.25&&s.target;$('click-ring').style.left=`${tx-40}px`;$('click-ring').style.top=`${ty-40}px`;$('click-ring').style.opacity=click?String(1-(local-3.5)/.75):'0';$('click-ring').style.transform=`scale(${.6+(local-3.5)*1.3})`;
 $('progress').style.width=`${t/(scenes.length*length)*100}%`;
 return ready;
}
function resize(){const scale=Math.min(innerWidth/1920,innerHeight/1080);$('stage').style.transform=`scale(${scale})`;$('stage').style.left=`${(innerWidth-1920*scale)/2}px`;$('stage').style.top=`${(innerHeight-1080*scale)/2}px`;render(clock)}
function tick(now){if(playing){clock+=(now-last)/1000;if(clock>=scenes.length*length)clock=0;render(clock)}last=now;requestAnimationFrame(tick)}
$('prev').onclick=()=>render(Math.max(0,(shown-1)*length));$('next').onclick=()=>render(Math.min((scenes.length-1)*length,(shown+1)*length));$('chapters').onchange=()=>render(Number($('chapters').value)*length);$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'일시 정지':'재생'};
window.renderTime=async t=>{await render(t);render(t);};window.addEventListener('resize',resize);resize();requestAnimationFrame(tick);
