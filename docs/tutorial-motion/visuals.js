const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(name,cls='wide')=>`<div class="shot-row"><img class="${cls}" src="assets/${name}" alt="실제 앱 화면"></div>`;
const route=(...items)=>`<div class="route">${items.map(x=>`<span>${esc(x)}</span>`).join('<i>→</i>')}</div>`;
const file=name=>`<div class="file">${esc(name)}</div>`;
const check=s=>`<div class="check">${s}</div>`;
const follow={intro:'이 가이드대로 한 번만 연결하면 돼.',download:'다운로드 폴더에 ZIP 파일이 있어.',extract:'ZIP 밖에 새 폴더가 생겼어.',install:'설치가 끝나고 설치 폴더가 생겼어.',guide:'네 PC에 맞는 파일 경로와 주소가 보여.',script:'스크립트 목록에 kira-setlist.lua가 보여.',dock:'OBS 안에 셋리스트 조작 칸이 생겼어.',overlay:'소스 목록에 새 오버레이가 보여.',reconnect:'조작 칸의 연결 상태를 다시 확인해 줘.',connected:'조작 칸 위쪽에 연결됨이 보여.',search:'찾던 곡이 검색 결과에 보여.',add:'리스트 탭에 방금 추가한 곡이 보여.',sing:'방송 화면의 현재 곡이 바뀌었어.',next:'다음 대기 곡이 현재 곡으로 바뀌었어.',undo:'잘못 바꾼 리스트가 이전 상태로 돌아왔어.',order:'오늘 부를 순서대로 정리됐어.',custom:'직접 적은 곡도 리스트에 추가됐어.',upload:'등록한 이미지가 곡 옆에 보여.',count:'선택한 곡 수만큼 방송에 보여.',size:'내 방송 화면에 맞는 크기가 됐어.',opacity:'배경이 더 비치고, 하단 정보도 바뀌었어.',art:'원하는 속도로 디스크가 돌아가.',backup:'같은 폴더에 설치하면 개인 곡과 설정이 남아.',finish:'다음 방송에는 OBS만 켜고 곡을 추가하면 돼.'};
function visual(f){let content='',note='파일·메뉴는 설명용 도식';switch(f.visual){
 case 'intro':case 'finish':content=img('broadcast-example.png')+check(f.visual==='finish'?'방송 준비 끝!':'키라 셋리스트를 함께 켜보자');note='제공받은 방송 적용 예시';break;
 case 'download':content='<h2>다운로드 페이지에서</h2>'+route('Assets','KiraSetlist-OBS.zip')+file('KiraSetlist-OBS.zip')+'<p>Source code는 개발용 파일이야.</p>';break;
 case 'extract':content='<h2>받은 ZIP에서</h2>'+route('마우스 오른쪽','모두 압축 풀기')+'<div class="mock-list">📁 KiraSetlist-OBS<br><small>새로 생긴 폴더를 열어 줘.</small></div>';break;
 case 'install':content='<h2>압축을 푼 폴더 안에서</h2><div class="mock-list"><div class="active">▶ install.cmd　 ← 두 번 클릭</div><div>OBS-guide.html</div><div>kira-setlist.lua</div></div><p>추가 프로그램은 따로 설치하지 않아도 돼.</p>';break;
 case 'guide':content='<h2>설치가 끝났다면</h2>'+file('OBS-guide.html')+'<p>설치된 폴더의 안내서를 열어 줘.<br>네 PC에 맞는 주소를 복사할 수 있어.</p>';break;
 case 'script':content='<h2>OBS 위쪽 메뉴</h2>'+route('도구','스크립트','+')+file('kira-setlist.lua')+'<p>OBS를 켤 때 같이 켜지도록 연결해.</p>';break;
 case 'dock':content='<h2>OBS 위쪽 메뉴</h2>'+route('독','사용자 브라우저 독')+'<div class="mock-list">이름: 키라 셋리스트<br>주소: 안내서에서 전체 복사<br><div class="active">적용</div></div><p>창 제목을 잡아 OBS 오른쪽으로 끌어 줘.</p>';break;
 case 'overlay':content=route('도구','스크립트','kira-setlist.lua')+file('현재 장면에 오버레이 추가')+'<div class="mock-list"><div class="active">👁 키라 셋리스트 오버레이 ← 위로</div><div>👁 캐릭터</div><div>👁 배경</div></div>';break;
 case 'reconnect':content=route('도구','스크립트','kira-setlist.lua')+file('연결 다시 시작')+'<p>연결 중에서 멈추면 이 버튼을 눌러 줘.</p>';break;
 case 'connected':content=img('dock-list.png','tall')+'<p>위쪽의 연결됨 표시를 확인해 줘.</p>';note='실제 앱 캡처';break;
 case 'search':case 'add':content=img('songbook-search.png','tall');note='실제 앱 캡처';break;
 case 'sing':case 'next':case 'undo':case 'order':content=img('dock-list.png','tall');note='실제 앱 캡처';break;
 case 'custom':content=img('custom-song.png','tall');note='실제 앱 캡처';break;
 case 'upload':content=file('곡 옆 이미지 클릭 → 내 이미지 등록')+'<p>앨범 후보를 골라도 되고,<br>네가 가진 JPG·PNG·WebP를 넣어도 돼.</p>'+img('default-art.png','panel');note='등록 방법 도식 · 기본 CD 예시';break;
 case 'count':content='<div class="shot-row"><img class="panel" src="assets/panel-current.png" alt="현재 곡만"><img class="panel" src="assets/panel-full.png" alt="이전·현재·다음 곡"></div><p>현재 곡만 / 앞뒤 곡까지</p>';note='실제 앱 캡처';break;
 case 'size':content='<h2>화면 설정에서</h2>'+file('우측 패널 크기　65~75%부터')+route('오른쪽 여백','위쪽 여백')+'<p>OBS 조작 칸 너비는 독 경계선으로 조절해.</p>';break;
 case 'opacity':content='<h2>화면 설정에서</h2>'+route('셋리스트 배경','숫자를 낮추면 더 투명')+route('좌측 하단 곡 정보','켜기 / 끄기')+'<p>우측 패널과 하단 정보를 따로 맞출 수 있어.</p>';break;
 case 'art':content=img('default-art.png','panel')+route('앨범 아트 회전','한 바퀴 15~60초')+'<p>이미지가 없으면 키라 기본 CD가 보여.</p>';note='기본 CD 예시 · 설정 설명';break;
 case 'backup':content='<h2>업데이트: OBS부터 닫기</h2>'+route('새 ZIP 압축 풀기','install.cmd 실행')+'<h2>백업: 두 폴더 함께 복사</h2>'+file('data + public/artwork');break;
 }
 if(f.cut==='b'&&!['intro','finish'].includes(f.visual))content=check(follow[f.visual])+content;
 $('visual').innerHTML=content;$('footnote').textContent=note;
}
