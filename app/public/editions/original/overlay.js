import {sessionWindow} from './session-view.js';
import {fallbackArtwork,artworkImage} from './artwork-view.js';
import {nextSongCount,overlayLayout} from './overlay-layout.js';
const $=id=>document.getElementById(id);const stage=$('stage');const preview=new URLSearchParams(location.search).has('preview');document.body.classList.toggle('preview',preview);const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function resize(){const s=Math.min(innerWidth/1920,innerHeight/1080);stage.style.zoom=s;stage.style.transform="none";stage.style.left=`${(innerWidth/s-1920)/2}px`;stage.style.top=`${(innerHeight/s-1080)/2}px`;}
window.addEventListener('resize',resize);resize();
const panel=document.querySelector('.setlist');let layoutSettings={};
function placePanel(){const layout=overlayLayout(layoutSettings,panel.offsetHeight);panel.style.transform=`scale(${layout.scale})`;panel.style.right=`${layout.right}px`;panel.style.top=`${layout.top}px`;$('caption').style.transform=`scale(${layout.captionScale})`;}
new ResizeObserver(placePanel).observe(panel);document.fonts.ready.then(placePanel);
let lastImage;
function render(state){const settings=state.settings;layoutSettings=settings;stage.classList.toggle('light',settings.theme==='light');stage.style.setProperty('--panel-fill',settings.theme==='light'?`rgba(241,235,249,${settings.opacity/100})`:`rgba(31,22,43,${settings.opacity/100})`);stage.style.setProperty('--rotation-speed',`${settings.rotationSeconds}s`);$('plaid').hidden=!settings.plaid;$('session-title').textContent=settings.title;
 const entry=state.queue.find(q=>q.id===state.currentId),current=entry&&state.songs.find(s=>s.id===entry.songId),index=entry?state.queue.indexOf(entry):-1;stage.classList.toggle('spinning',Boolean(current&&settings.rotate));stage.classList.toggle('no-current',!current);$('caption').hidden=!settings.caption||!current;$('counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(state.queue.length).padStart(2,'0')}`;$('song-title').textContent=current?.title||(state.queue.some(q=>q.status==='waiting')?'현재 곡을 선택해 주세요':'잠시 후 시작됩니다');$('caption-title').textContent=current?.title||'';
 const image=artworkImage(current);if(image!==lastImage){for(const id of ['panel-art','caption-art']){const img=$(id);img.hidden=false;img.parentElement.classList.toggle('kira-cover',image===fallbackArtwork);img.alt=image===fallbackArtwork?'키라 기본 앨범 아트':'현재 곡 앨범 아트';img.onerror=()=>{if(img.getAttribute('src')!==fallbackArtwork){img.src=fallbackArtwork;img.parentElement.classList.add('kira-cover');img.alt='키라 기본 앨범 아트';}else img.hidden=true;};img.src=image;}lastImage=image;}
 const count=nextSongCount(settings),{previous,next}=sessionWindow(state,count);
 $('previous-section').hidden=settings.showPrevious===false;$('next-section').hidden=count===0;
 panel.classList.toggle('current-only',settings.showPrevious===false&&count===0);panel.classList.toggle('no-next',count===0);
 const row=q=>{const s=state.songs.find(s=>s.id===q.songId),n=state.queue.indexOf(q)+1;return `<div class="next-row"><span class="next-number">${String(n).padStart(2,'0')}</span><div><div class="next-title">${esc(s.title)}</div></div></div>`;};
 $('previous-list').innerHTML=previous?row(previous):'<div class="previous-empty">아직 완료한 곡이 없어요</div>';
 $('next-list').innerHTML=Array.from({length:count},(_,i)=>next[i]?row(next[i]):`<div class="next-row empty-slot"><span class="next-number">—</span><div class="next-title">${next.length?'대기 곡이 없어요':current?'다음 곡이 없어요':'다음 곡을 기다리고 있어요'}</div></div>`).join('');
 placePanel();
}
const events=new EventSource('/api/events');events.onmessage=e=>render(JSON.parse(e.data));
