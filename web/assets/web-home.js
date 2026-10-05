const button=document.getElementById('create-room'),status=document.getElementById('status');
function urls(c){return {dock:`${location.origin}/control?dock=1#${new URLSearchParams({room:c.room,owner:c.owner,view:c.view})}`,overlay:`${location.origin}/overlay#${new URLSearchParams({room:c.room,view:c.view})}`};}
try{const saved=JSON.parse(localStorage.getItem('kira-web-room'));if(saved?.room&&saved.owner&&saved.view){const link=document.getElementById('return-room');link.hidden=false;link.href=urls(saved).dock;}}catch{}
button.addEventListener('click',async()=>{
 button.disabled=true;status.textContent='방송 공간을 만들고 있어요…';
 try{
  const res=await fetch('/api?op=rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),credentials=await res.json();
  if(!res.ok)throw Error(credentials.error||'방송 공간을 만들지 못했어요.');
  try{localStorage.setItem('kira-web-room',JSON.stringify(credentials));}catch{}
  const links=urls(credentials),dialog=document.createElement('dialog');
  dialog.innerHTML='<h2>준비 끝. OBS에 붙여요.</h2><p>아래 주소 두 개만 붙이면 돼요. 조작 주소는 본인만 보관해 주세요.</p><label>① OBS → 독 → 사용자 지정 브라우저 독<input id="dock-link" readonly aria-label="조작 독 주소"></label><button data-copy="dock">독 주소 복사</button><label>② OBS → 소스 추가 → 브라우저<input id="overlay-link" readonly aria-label="방송 화면 주소"></label><button data-copy="overlay">방송 화면 주소 복사</button><p>브라우저 소스: 너비 3840 / 높이 2160 / 60fps.<br>조작 독 이름은 ‘키라 셋리스트’로 넣으면 돼요.</p><div class="last-actions"><a id="open-control">조작 화면 열기 →</a><button class="secondary-close" type="button">닫기</button></div>';
  document.body.append(dialog);dialog.querySelector('#dock-link').value=links.dock;dialog.querySelector('#overlay-link').value=links.overlay;dialog.querySelector('#open-control').href=links.dock;
  dialog.querySelector('.secondary-close').addEventListener('click',()=>dialog.close());
  for(const b of dialog.querySelectorAll('[data-copy]'))b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(links[b.dataset.copy]);b.textContent='복사했어요 ✓';}catch{dialog.querySelector(b.dataset.copy==='dock'?'#dock-link':'#overlay-link').select();}});
  dialog.showModal();status.textContent='방송 공간이 만들어졌어요. 주소를 OBS에 붙여 주세요.';
  const returnLink=document.getElementById('return-room');returnLink.href=links.dock;returnLink.hidden=false;
 }catch(e){status.textContent=e.message;}finally{button.disabled=false;}
});
