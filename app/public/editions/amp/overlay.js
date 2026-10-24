import {sessionWindow,previousSongCount} from './session-view.js';
import {createHistoryCarousel} from '../../history-carousel.js';
const historyCarousel=createHistoryCarousel(document.getElementById('previous-list'));
const nextCarousel=createHistoryCarousel(document.getElementById('next-list'));
import {fallbackArtwork,artworkImage} from './artwork-view.js';import {nextSongCount} from './overlay-layout.js';import {dlcLayout} from './dlc-layout.js';import {drawSignature} from './signature.js';
const $=id=>document.getElementById(id),stage=$('kira-dlc'),studio=stage.querySelector('.studio'),panel=stage.querySelector('.amp');
document.body.classList.toggle('preview',new URLSearchParams(location.search).has('preview'));
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let settings={},lastImage,lastCurrentId,rendered=false,snapshot,swapTimer,settleTimer;
function resize(){const s=Math.min(innerWidth/1440,innerHeight/810);stage.style.zoom=s;stage.style.transform='none';stage.style.left=`${(innerWidth/s-1440)/2}px`;stage.style.top=`${(innerHeight/s-810)/2}px`;}
function placePanel(){studio.style.setProperty('--panel-width',`${settings.panelWidth||36}%`);const p=dlcLayout(settings,panel.offsetHeight,panel.offsetWidth);studio.style.setProperty('--panel-scale',p.scale);studio.style.setProperty('--caption-scale',p.captionScale);panel.style.right=p.right+'px';panel.style.top=p.top+'px';}
window.addEventListener('resize',resize);resize();new ResizeObserver(placePanel).observe(panel);document.fonts.ready.then(placePanel);
function paint(state){
 settings=state.settings;studio.style.setProperty('--panel-alpha',settings.opacity/100);studio.style.setProperty('--rotation-speed',`${settings.rotationSeconds}s`);studio.style.setProperty('--disc-spin-state',settings.rotate?'running':'paused');$('caption').style.setProperty('--stroke',settings.stroke||'#bc8de7');
 const entry=state.queue.find(q=>q.id===state.currentId),song=entry&&state.songs.find(s=>s.id===entry.songId),index=entry?state.queue.indexOf(entry):-1;
 studio.classList.toggle('spinning',!!song&&settings.rotate);studio.classList.toggle('no-current',!song);$('caption').hidden=!settings.caption||!song;$('record-pack').hidden=settings.captionArt===false;$('plaid').hidden=!settings.plaid;
 $('counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(state.queue.length).padStart(2,'0')}`;$('song-title').textContent=song?.title||'잠시 후 시작됩니다';$('song-artist').textContent=song?.artist||'';$('caption-title').textContent=song?.title||'';$('caption-artist').textContent=song?.artist||'';$('session-title').textContent=settings.title||'KIRA LIVE SESSION';
 const image=artworkImage(song);if(image!==lastImage){for(const id of ['panel-art','caption-art']){const img=$(id);img.hidden=false;img.onerror=()=>{if(img.getAttribute('src')!==fallbackArtwork){img.src=fallbackArtwork;img.alt='키라 기본 앨범 아트';}else img.hidden=true;};img.src=image;img.alt=image===fallbackArtwork?'키라 기본 앨범 아트':'현재 곡 앨범 아트';}lastImage=image;}
 const count=nextSongCount(settings),{previousSongs,upcomingSongs}=sessionWindow(state,count);$('previous-section').hidden=previousSongCount(settings)===0;$('next-section').hidden=count===0;
 const row=(q,number)=>{const s=state.songs.find(s=>s.id===q.songId),n=number??(state.queue.indexOf(q)+1);return `<div class="queue-row"><span class="queue-num">${String(n).padStart(2,'0')}</span><p class="queue-title">${esc(s.title)}</p></div>`;};
 historyCarousel.render(previousSongs,{rows:previousSongCount(settings),startIndex:Math.max(0,previousSongs.length-previousSongCount(settings)),autoSlide:settings.previousSlide!==false,row:(q,i)=>row(q,i+1),empty:'<div class="history-empty">이전 곡이 없어요</div>'});
 nextCarousel.render(upcomingSongs,{rows:count,autoSlide:settings.nextSlide!==false,row:q=>row(q),empty:'<div class="history-empty">대기 곡이 없어요</div>'});
 drawSignature(studio,settings.stroke||'#bc8de7');placePanel();
}
function receive(state){snapshot=state;const changed=rendered&&lastCurrentId!==state.currentId;lastCurrentId=state.currentId;rendered=true;if(changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches){clearTimeout(swapTimer);clearTimeout(settleTimer);panel.classList.remove('change-in');void panel.offsetWidth;panel.classList.add('change-in');swapTimer=setTimeout(()=>{swapTimer=null;paint(snapshot)},90);settleTimer=setTimeout(()=>{panel.classList.remove('change-in');settleTimer=null},680);}else if(!swapTimer)paint(state);}
const events=new EventSource('/api/events');events.onmessage=e=>receive(JSON.parse(e.data));

