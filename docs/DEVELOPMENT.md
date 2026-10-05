# 통합본 개발·데이터 안내

현재 배포 프로그램은 `app/`에 있어요. Node.js 24에서 `npm start`로 로컬 실행하고 `npm test`로 디자인 전환·저장 보존·설치 테스트를 실행합니다. 실행 포트는 **4320**, 바인딩은 **127.0.0.1**입니다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `app/server.mjs` | 카탈로그, 저장, API, SSE, 로컬 정적 파일 |
| `app/lib/state.mjs` | 공유 목록·현재 곡·되돌리기와 디자인별 설정 |
| `app/public/control.*` | OBS 조작 독과 원본/DLC 선택 버튼 |
| `app/public/overlay.*` | 투명 iframe을 사용하는 디자인 선택 셸 |
| `app/public/editions/original/` | 원본 렌더러 |
| `app/public/editions/amp/` | 앰프 DLC 렌더러 |
| `app/kira-unified.lua` | OBS 자동 시작·종료 및 소스 추가 |
| `install.mjs`, `install.ps1`, `Installer.cs` | 데이터 보존 설치와 OBS 등록·설정 백업 |
| `docs/tutorial-motion/` | 32단계의 재생 가능한 도트 안내 |

원본의 iframe은 `color-scheme:normal`과 투명 html/body를 사용합니다. 어두운 색 구성의 iframe 캔버스가 부모와 다를 때 불투명해지는 Chromium 동작을 피합니다. 두 렌더러는 CSS zoom을 사용하고, DLC의 기울어진 배경과 글자 평면을 분리합니다. LP와 제목 전환은 660ms로 구성돼 있습니다.

## 로컬 주소

- 조작 독: `http://127.0.0.1:4320/control?dock=1`
- 방송 소스: `http://127.0.0.1:4320/overlay`
- 참고 배경 미리보기: `http://127.0.0.1:4320/overlay?preview=1`
- 앱 도움말: `http://127.0.0.1:4320/guide`

방송 소스에는 `preview=1`을 쓰지 않습니다. 브라우저 소스는 3840×2160 / 사용자 지정 FPS 60입니다. 기본 1080p 장면에서는 배율 0.5로 배치합니다. 설치 시 기존 방송 캔버스·출력 해상도·프로필 FPS를 유지합니다. 60fps 방송을 원하면 사용자가 OBS 설정 > 비디오에서 직접 선택합니다. 다른 캔버스 비율에서는 OBS에서 소스를 화면에 맞춰 조절하세요.

## 데이터

기본 설치 경로는 `%USERPROFILE%\KiraSetlistUnified`입니다.

| 파일 | 내용 |
| --- | --- |
| `data/songbook.raw.json` | 2026-10-05 노래책 211곡 스냅샷 |
| `data/artwork.json` | 아트 URL·후보·출처 |
| `data/state.json`, `.bak` | 곡 목록·현재 곡·직접 등록한 곡·두 디자인 설정·되돌리기 |
| `public/artwork/` | 사용자가 직접 등록한 이미지 |

첫 설치는 기존 `KiraSetlistDLC` 또는 `KiraSetlist`의 저장 데이터를 가져옵니다. 이후에는 통합본 데이터가 따로 유지됩니다. 재설치는 개인 데이터와 이미지를 보존합니다. OBS 설정 백업은 `%APPDATA%\obs-studio\kira-install-backups`에 저장합니다. 배포본에는 `state.json`, 사용자 업로드, OBS 비밀번호를 넣지 않습니다.

## 배포·가이드 재생성

1. Windows에서 사용 중인 Node 24 실행 파일을 `app/runtime/node.exe`에 복사하고 라이선스를 함께 둡니다.
2. `node package-release.mjs`로 설치 폴더를 만들고 `dist/KiraSetlist-Integrated-1.2.2`을 ZIP으로 압축합니다.
3. `capture-current-guide.mjs`는 임시 데이터·헤드리스 Edge에서 앱 화면을 캡처합니다. 실행 중인 OBS의 곡 목록이나 PC 커서를 조작하지 않습니다.
4. `build-current-tutorial.mjs` → `export-current-tutorial.mjs`는 안내 이미지·MP4·GIF·SRT를 만듭니다. Playwright와 FFmpeg가 필요합니다. Playwright 모듈 경로는 `KIRA_PLAYWRIGHT_PATH`로 지정할 수 있습니다.

설치 테스트는 임시 사용자·AppData를 사용하여 기존 장면과 Lua 유지, 4K 소스, 재설치 시 데이터 보존·소스 중복 방지를 확인합니다. 앱 테스트는 두 디자인을 오가도 목록·현재 곡·되돌리기 기록이 같고 화면 설정이 개별 보존되는지 확인합니다.

이 저장소 최상위의 기존 `public/`, `lib/`, `server.mjs`, `obs/`는 이전 원본 소스 호환 기록입니다. 현재 통합 배포·가이드는 `app/`를 기준으로 합니다. 이전 설치 파일은 v1.0.0·v1.1.0 Releases에 남아 있습니다.
