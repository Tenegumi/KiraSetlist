# Kira Setlist · 키라 셋리스트

**OBS 안에서 곡을 추가하고 조작하는 방송용 셋리스트.** 세이로쿠 키라의 퍼플·블랙 컬러와 작은 레드 체크 포인트, 회전 앨범 아트를 담았습니다.

![키라 방송 적용 예시](public/guide-assets/broadcast-example.png)

**[설치 ZIP 다운로드](https://github.com/Tenegumi/KiraSetlist/releases/latest)** · **[스크린샷 설치·사용 가이드](docs/INSTALL.md)** · [개발·데이터 안내](docs/DEVELOPMENT.md)

## 처음 설치하기

1. 다운로드 페이지의 **Assets → KiraSetlist-OBS.zip**을 받아 전부 압축 해제합니다.
2. `KiraSetlist-OBS/install.cmd`를 실행합니다. Node 런타임이 포함되어 있습니다.
3. 설치 폴더의 **OBS-guide.html**을 열고 OBS에 스크립트·조작 독·오버레이를 한 번 등록합니다.
4. 다음부터는 **OBS만 실행**합니다. 별도 웹 브라우저나 터미널을 열 필요가 없습니다.

Windows용입니다. OBS 32.2.2에서 확인했습니다. 기본 설치 폴더는 `%USERPROFILE%\KiraSetlist`입니다. **Source code** ZIP은 개발용이며 설치 패키지와 다릅니다.

## 조작 화면

<img src="public/guide-assets/dock-list.png" alt="오늘의 리스트 조작 패널" width="280"> <img src="public/guide-assets/songbook-search.png" alt="노래책 검색과 추가" width="280">

노래책에서 검색해 **+**로 추가하고, 리스트에서 **부르기**로 현재 곡을 지정합니다. 노래가 끝나면 **완료 · 다음 곡**, 실수하면 **되돌리기**를 누릅니다. 노래책에 없는 신청곡은 **+ 직접 추가**로 넣을 수 있습니다.

## 방송 화면 설정

<img src="public/guide-assets/panel-current.png" alt="현재 곡만 표시" width="280"> <img src="public/guide-assets/panel-full.png" alt="이전·현재·다음 곡 표시" width="280">

| 기능 | 지원 범위 |
| --- | --- |
| 표시 곡 수 | 현재 곡만, 이전 1곡 ON/OFF, 다음 0~5곡 |
| 크기·위치 | 우측 패널 50~120%, 오른쪽·위쪽 여백, 하단 정보 크기 별도 설정 |
| 스타일 | 반투명도 0~100%, 딥 퍼플 / 라벤더 글라스, 작은 체크 포인트 |
| 좌측 하단 정보 | ON/OFF |
| 앨범 아트 | 현재 곡 디스크 회전, 미등록·로딩 실패 시 키라 기본 CD |
| 노래책 | 211곡, 곡명·가수·초성 검색, 장르 필터, 직접 추가 곡 저장 |
| 리스트 | 순서 변경, 완료, 되돌리기, 자동 저장 |

음원 재생·자동 곡 감지·가사 싱크 기능은 포함하지 않습니다. 표시 설정을 바꿔도 실제 리스트와 현재 곡은 유지됩니다.

## 업데이트와 백업

**OBS를 닫은 뒤** 새 ZIP의 `install.cmd`를 다시 실행하세요. 같은 설치 경로를 사용하면 개인 리스트·설정·직접 등록한 곡과 이미지가 보존됩니다. 백업은 설치 폴더의 `data`와 `public/artwork`를 함께 복사합니다.

설치 폴더의 **OBS-guide.html**과 조작 패널의 **설치·사용 안내**에서 스크린샷 가이드를 볼 수 있습니다.

## 개발

Node.js 22 이상에서 `npm start`, 자동 테스트는 `npm test`로 실행합니다. Windows 배포 ZIP은 `powershell -File scripts/package-obs.ps1`로 만듭니다. 자세한 구조와 테스트 방법은 [개발 안내](docs/DEVELOPMENT.md)를 참고하세요.

방송 예시는 제공받은 스크린샷이며, 조작·설정 이미지는 실제 앱을 별도 테스트 환경에서 캡처한 화면입니다. 노래책은 2026-10-05에 가져온 스냅샷이며 Notion 변경 사항을 자동 동기화하지 않습니다. 외부 앨범 아트는 URL로 연결되어 인터넷이 필요합니다.
