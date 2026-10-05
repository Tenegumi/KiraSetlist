import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),dir=path.join(root,'docs/tutorial-motion');fs.mkdirSync(path.join(dir,'assets'),{recursive:true});fs.mkdirSync(path.join(dir,'examples'),{recursive:true});
for(const file of fs.readdirSync(path.join(root,'app/public/guide-assets')))if(file.endsWith('.png')&&!file.includes('guide-mascot'))fs.copyFileSync(path.join(root,'app/public/guide-assets',file),path.join(dir,'assets',file));
fs.copyFileSync(path.join(root,'app/public/default-art.png'),path.join(dir,'assets/default-art.png'));
const s=(phase,title,line,image,notes,target)=>({phase,title,line,image,notes,target});
const scenes=[
 s('시작하기','오늘 방송에 맞춰 골라 쓰자','원본과 앰프 DLC가 한 프로그램에 들어 있어. 설치도 한 번이면 돼!','unified-amp.png',['원본 + 앰프 DLC 통합본','OBS 안에서 곡 추가·전환·설정'],[.88,.3]),
 s('시작하기','원본도 그대로 골라 쓸 수 있어','원본은 깔끔한 반투명 셋리스트야. 방송 배경은 그대로 보여.','unified-original.png',['같은 노래책과 오늘의 리스트 사용','크기·투명도는 디자인별로 기억'],[.87,.25]),
 s('설치 · 1','방송이 끝나면 OBS를 닫아 줘','설치하기 전에 OBS를 완전히 닫아 줘. 설치가 끝나면 다시 열릴 거야.',null,['방송·녹화가 끝났는지 확인','OBS 종료 → 설치 → OBS 자동 실행']),
 s('설치 · 2','설치 ZIP을 받아 줘','GitHub 소개의 설치 ZIP 버튼을 눌러 줘. Source code는 설치 파일이 아니야.',null,['받을 파일: KiraSetlist-Integrated-1.2.0.zip','Releases → Assets → 설치 ZIP']),
 s('설치 · 3','먼저 압축을 전부 풀기','ZIP에서 모든 파일을 압축 해제해 줘. 안에 있는 app 폴더도 같이 필요해.',null,['ZIP 우클릭 → 모두 압축 풀기','폴더 안의 설치하기.exe 열기']),
 s('설치 · 4','설치하고 OBS에 적용을 눌러 줘','이 버튼이 프로그램, 조작 독, 오버레이를 한 번에 연결해 줘.','installer.png',['별도 Node 설치는 필요 없어','이 창에서 설치 완료 안내 기다리기'],[.49,.42]),
 s('설치 · 5','OBS가 열리면 장면 모음 확인','장면 모음 이름이 키라 통합 셋리스트인지 확인해 줘.',null,['키라 통합 셋리스트 (원본 + DLC)','기존 장면 모음은 보관돼 있어']),
 s('설치 · 6','OBS 오른쪽에서 바로 조작하기','키라 통합 셋리스트 독에서 조작해. 별도 웹 브라우저를 켤 필요 없어.','dock-list.png',['독이 없다면: 독 메뉴에서 통합 셋리스트 체크','독 제목을 끌어서 편한 자리에 고정'],[.5,.15]),
 s('디자인 · 1','앰프 DLC를 골라 보자','앰프 DLC 버튼을 누르면 컷아웃 앰프와 하프 LP 슬리브로 바뀌어.','design-switch.png',['붉은 하트 슬리브 + 보라색 사인','전환할 때 LP도 함께 움직여'],[.75,.47]),
 s('디자인 · 2','원본 버튼은 깔끔한 디자인','원본 버튼으로 바로 돌아갈 수 있어. 곡 목록을 다시 넣을 필요 없어.','design-switch.png',['전환해도 현재 곡과 대기 목록 유지','원본의 배경도 투명하게 출력'],[.24,.47]),
 s('디자인 · 3','이전 곡과 대기 곡은 제목만','DLC는 이전 곡과 다음 곡을 제목만 보여 줘. 현재 곡에는 가수도 보여.','panel-full.png',['지나간 곡·대기 곡: 번호와 제목','현재 곡: 앨범 아트 + 제목 + 가수'],[.5,.75]),
 s('곡 추가 · 1','노래책 탭을 열어 줘','곡명이나 가수를 검색해 봐. 초성으로도 찾을 수 있어.','songbook-search.png',['노래책 → 검색창','장르 버튼으로 범위를 좁혀도 돼'],[.47,.36]),
 s('곡 추가 · 2','곡 옆의 +를 누르면 끝','부를 곡 옆의 더하기를 누르면 오늘의 리스트에 추가돼.','songbook-search.png',['+ → 오늘의 리스트에 추가','같은 곡을 다시 부르면 또 추가해도 돼'],[.92,.7]),
 s('곡 추가 · 3','노래책에 없는 신청곡도 받아','리스트에서 직접 추가를 누르고 곡명을 입력해 줘.','custom-song.png',['곡명은 필수, 가수는 선택','오늘만 부를 곡도 추가 가능'],[.5,.32]),
 s('곡 추가 · 4','다음에도 부를 곡이라면 체크','내 노래책에도 저장을 켜면 다음 방송에서도 검색할 수 있어.','custom-saved.png',['내 노래책에도 저장 체크','원본 Notion 노래책은 수정하지 않아'],[.45,.78]),
 s('앨범 아트 · 1','이미지가 없어도 괜찮아','아트를 넣지 않은 신청곡은 키라 기본 CD로 보여 줘.','default-art.png',['아트 미등록·이미지 로딩 실패에도 기본 CD','현재 곡의 CD도 회전해'],[.5,.5]),
 s('앨범 아트 · 2','앨범 이미지를 바꾸고 싶다면','노래책이나 리스트에서 작은 앨범 이미지를 눌러 줘.','art-dialog.png',['앨범 후보의 곡명과 가수 확인','원하는 후보를 눌러 적용'],[.5,.45]),
 s('앨범 아트 · 3','내 이미지 등록도 할 수 있어','내 이미지 등록에서 PNG, JPG, WebP를 고르면 돼. 4MB까지 가능해.','art-dialog.png',['내 이미지 등록 → 이미지 선택','직접 추가 창에서도 이미지 첨부 가능'],[.5,.86]),
 s('방송 중 · 1','부르기로 현재 곡 지정','리스트의 부르기 버튼을 누르면 방송 화면에 그 곡이 떠.','dock-list.png',['이 도구는 음원을 재생하지 않아','실제로 부를 곡을 직접 골라 줘'],[.9,.86]),
 s('방송 중 · 2','다 불렀으면 완료 · 다음 곡','완료 · 다음 곡을 누르면 지금 곡이 완료되고 다음 대기 곡으로 넘어가.','queue-controls.png',['현재 곡 완료 + 다음 대기 곡 지정','실수했을 때는 되돌리기'],[.45,.5]),
 s('방송 중 · 3','순서와 실수도 바로 고치기','대기 곡을 끌거나 화살표로 순서를 바꿔. 잘못 눌렀으면 되돌리기야.','dock-list.png',['↑ ↓ 또는 드래그로 순서 변경','✕ 삭제 · 되돌리기로 이전 작업 복원'],[.91,.7]),
 s('화면 설정 · 1','오른쪽에 몇 곡을 띄울까?','화면 설정의 표시 구성에서 지금 곡만 보이게 할 수도 있어.','display-settings.png',['현재 곡만 / 현재 + 다음 2곡','이전 1곡 + 현재 + 다음 2곡'],[.5,.42]),
 s('화면 설정 · 2','현재 곡만 띄우면 이렇게','표시 구성을 현재 곡만으로 고르면 앰프 창도 간결해져.','panel-current.png',['가려진 대기 곡도 리스트에는 남아 있어','보이는 곡 수와 실제 리스트는 별개'],[.5,.6]),
 s('화면 설정 · 3','다음 곡 수를 직접 정하기','이전 곡 체크와 다음 곡 수로 자유롭게 맞춰 줘. 다음은 0부터 5곡까지야.','display-settings.png',['이전 곡 1개 표시 ON / OFF','다음 곡 수: 표시 안 함 ~ 5곡'],[.5,.56]),
 s('화면 설정 · 4','창이 크면 슬라이더를 줄여 줘','우측 패널 크기와 앰프 너비를 조절해. 오른쪽과 위쪽 여백도 바꿀 수 있어.','display-settings.png',['패널 크기·앰프 너비·여백 조절','크기·위치 기본값으로 버튼도 있어'],[.5,.67]),
 s('화면 설정 · 5','투명도는 방송 배경에 맞춰','셋리스트 배경 슬라이더로 반투명을 맞춰 줘. 디자인별로 따로 기억해.','caption-settings.png',['셋리스트 배경: 0 ~ 100%','글자가 읽히는지 OBS에서 확인'],[.5,.3]),
 s('화면 설정 · 6','왼쪽 하단 정보는 켜고 끄기','좌측 하단 곡 정보 체크를 끄면 왼쪽 정보 전체를 숨길 수 있어.','caption-settings.png',['하단 정보 ON / OFF · 크기 별도 조절','DLC: LP 슬리브 ON / OFF · 사인 색'],[.5,.53]),
 s('화면 설정 · 7','회전 속도도 골라 줘','앨범 아트 회전을 켜고 한 바퀴 도는 시간을 정해. 하트 마크는 슬리브에 있어.','dlc-heart-detail.png',['앨범 아트 회전 ON / OFF','회전 한 바퀴: 15 ~ 60초'],[.75,.5]),
 s('OBS 확인','오버레이는 4K · 60fps','설치가 브라우저 소스를 3840 × 2160, FPS 60으로 설정해 줘.',null,['OBS 소스 속성: 3840 × 2160 · 사용자 지정 FPS 60','방송 캔버스 크기는 그대로 · 소스를 맞춰 축소']),
 s('다음 방송','다음부터는 OBS만 켜면 돼','OBS를 켜면 조작 독과 셋리스트가 다시 연결돼. 목록도 자동 저장돼.','dock-list.png',['오늘의 리스트·현재 곡·직접 등록 곡 자동 저장','노래책은 가져온 목록 · 자동 Notion 동기화 없음'],[.5,.15]),
 s('업데이트·백업','다시 설치해도 내 목록은 남아','업데이트는 OBS를 닫고 새 ZIP의 설치하기를 실행해. 중요한 방송 전엔 백업해 둬.',null,['사용자 폴더 / KiraSetlistUnified','백업: data 폴더 + public/artwork 폴더']),
 s('준비 완료','이제 오늘의 셋리스트를 담아 보자','노래책에서 곡을 담고 부르기를 누르면 준비 끝이야. 오늘도 즐거운 방송 해!','unified-amp.png',['앱 아래 설치·사용 안내에서 다시 보기','GitHub에서 영상·이미지·설치 ZIP 받기'],[.88,.3])
];
// Use close views of the relevant controls so the instructions stay readable in video.
for(const scene of scenes){
 if(scene.image==='songbook-search.png'){scene.image='search-results.png';scene.target=scene.title.includes('+')?[.95,.52]:[.45,.22];}
 if(scene.title==='오른쪽에 몇 곡을 띄울까?'||scene.title==='다음 곡 수를 직접 정하기'){scene.image='display-options.png';scene.target=scene.title.startsWith('다음')?[.5,.8]:[.5,.2];}
 if(scene.title==='창이 크면 슬라이더를 줄여 줘'){scene.image='settings-layout.png';scene.target=[.5,.18];}
 if(scene.title==='투명도는 방송 배경에 맞춰'){scene.image='settings-opacity.png';scene.target=[.5,.75];}
 if(scene.title==='왼쪽 하단 정보는 켜고 끄기'){scene.image='settings-caption.png';scene.target=[.06,.1];}
 if(scene.title==='회전 속도도 골라 줘'){scene.image='settings-rotate.png';scene.target=[.5,.8];}
}
fs.writeFileSync(path.join(dir,'scenes.js'),'window.TUTORIAL_SCENES='+JSON.stringify(scenes,null,2)+';\n');
fs.writeFileSync(path.join(dir,'narration.txt'),scenes.map((s,i)=>`${String(i+1).padStart(2,'0')} · ${s.title}\n${s.line}\n`).join('\n'));
console.log(JSON.stringify({scenes:scenes.length,duration:scenes.length*6,dir}));
