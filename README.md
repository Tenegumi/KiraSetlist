# Kira Setlist · 원본 + 앰프 DLC

**오늘 부를 곡을 담고, OBS 안에서 바로 넘겨요.** 깔끔한 원본과 밴드 스타일의 앰프 DLC를 하나의 설치본에서 골라 쓸 수 있어요.

![앰프 DLC를 적용한 실제 OBS 출력](app/public/guide-assets/unified-amp.png)

**[설치 ZIP 받기](https://github.com/Tenegumi/KiraSetlist/releases/download/v1.2.0/KiraSetlist-Integrated-1.2.0.zip)** · **[그림으로 따라 하기](docs/INSTALL.md)** · **[가이드 영상 받기](https://github.com/Tenegumi/KiraSetlist/releases/download/v1.2.0/kira-integrated-tutorial.mp4)** · **[영상·이미지 128장 묶음](https://github.com/Tenegumi/KiraSetlist/releases/download/v1.2.0/KiraSetlist-Integrated-Guide.zip)**

## 설치는 이렇게 해요

1. 방송이 끝나면 **OBS를 닫아요**.
2. 위의 설치 ZIP을 받아 **모두 압축 풀기**를 해요.
3. 폴더 안의 **설치하기.exe**를 열고 **설치하고 OBS에 적용**을 눌러요.
4. OBS가 열리면 **키라 통합 셋리스트 (원본 + DLC)** 장면 모음과 조작 독을 확인해요.

<img src="app/public/guide-assets/installer.png" alt="설치하고 OBS에 적용 버튼이 있는 실제 설치 프로그램 화면" width="540">

다음부터는 **OBS만 켜면 돼요**. 실행에 필요한 Node도 들어 있고, 조작 독·오버레이·자동 시작 스크립트가 함께 등록돼요. Windows용이며 OBS 32.2.2에서 확인했어요. GitHub의 **Source code**는 개발용이니 위의 **설치 ZIP**을 받아 주세요.

## 오늘의 디자인은 버튼으로

<img src="app/public/guide-assets/design-switch.png" alt="OBS 독의 원본 / 앰프 DLC 전환 버튼" width="460">

**원본**은 반투명 셋리스트와 회전 CD, **앰프 DLC**는 컷아웃 앰프·붉은 하트 슬리브·반쯤 꺼낸 LP·보라색 사인이에요. DLC에서 곡이 바뀌면 LP와 곡 정보가 함께 튕기듯 움직여요. 이전 곡과 대기 곡은 제목만 보여 주고, 현재 곡에는 가수도 표시해요.

두 디자인은 **노래책·직접 추가한 곡·오늘의 리스트·현재 곡을 공유**해요. 크기와 투명도 같은 화면 설정은 각각 기억하니, 전환할 때마다 다시 맞출 필요 없어요.

<details><summary>원본 디자인도 보기</summary>

![원본을 적용한 실제 OBS 출력. 방송 배경이 그대로 보입니다.](app/public/guide-assets/unified-original.png)

</details>

## 방송 중에는 세 가지만 기억해요

<img src="app/public/guide-assets/search-results.png" alt="노래책 검색 결과와 곡 추가 버튼" width="360"> <img src="app/public/guide-assets/custom-song.png" alt="노래책에 없는 곡을 직접 추가하는 창" width="360">

- **담기:** 노래책에서 검색하고 곡 옆의 **+**를 눌러요. 없는 신청곡은 **+ 직접 추가**로 넣어요.
- **부르기:** 리스트에서 **부르기**를 누르면 방송 화면의 현재 곡이 바뀌어요.
- **넘기기:** 다 부르면 **완료 · 다음 곡**, 실수하면 **되돌리기**를 눌러요.

이미지가 없는 곡은 키라 기본 CD가 대신 나와요. 앨범 이미지를 눌러 후보를 고르거나 내 이미지를 등록할 수도 있어요.

## 화면은 내 방송에 맞춰요

<img src="app/public/guide-assets/panel-current.png" alt="DLC의 현재 곡만 표시" width="320"> <img src="app/public/guide-assets/panel-full.png" alt="DLC의 이전·현재·다음 곡 표시. 대기와 이전은 제목만 나옵니다." width="320">

| 맞출 수 있는 것 | 설정 |
| --- | --- |
| 보이는 곡 수 | 현재 곡만 / 이전 1곡 ON·OFF / 다음 0~5곡 |
| 오른쪽 창 | 크기·위치·투명도 / DLC 앰프 너비 |
| 왼쪽 하단 | 곡 정보 ON·OFF·크기 / DLC LP 슬리브·사인 색 |
| 앨범 아트 | 회전 ON·OFF, 한 바퀴 15~60초 |
| 방송 화면 | 두 디자인 모두 **3840×2160 소스 · 60fps**, 기존 캔버스에 맞춰 축소 |

표시를 줄여도 실제 곡 목록은 그대로 남아요. 음원 재생·자동 곡 감지·가사 싱크는 포함하지 않아요.

## 남궁우가 움직이며 알려줘요

![도트 남궁우의 움직이는 통합본 튜토리얼](docs/tutorial-motion/examples/movement.gif)

**32장면 · 3분 12초 · Full HD 무음 영상**이에요. 설치, 디자인 전환, 신청곡 추가, 현재 곡 지정, 화면 설정, 업데이트와 백업까지 알려줘요. **1920×1080 이미지 128장**, 자막 SRT, 내레이션 대사, 단계별로 넘겨 보는 HTML도 함께 받아 쓸 수 있어요.

[영상·이미지 미리 보기](docs/tutorial-motion/README.md) · [편집할 때 사용하는 방법](docs/MEDIA.md)

**전환 모션만 보기:** [원본 60fps 샘플](https://github.com/Tenegumi/KiraSetlist/releases/download/v1.2.0/KiraSetlist-Original-Motion-60fps.mp4) · [DLC 60fps 샘플](https://github.com/Tenegumi/KiraSetlist/releases/download/v1.2.0/KiraSetlist-DLC-Motion-60fps.mp4). 각 8초, 예시 목록에서 두 번 곡을 넘기는 실제 렌더러 화면이에요.

## 업데이트와 백업

OBS를 닫고 새 ZIP의 **설치하기.exe**를 실행해요. 같은 설치 폴더를 쓰면 개인 목록·직접 등록한 곡·이미지·설정이 보존돼요. 통합본은 기본적으로 `사용자 폴더/KiraSetlistUnified`에 설치돼요. 기존 원본 또는 단독 DLC가 있으면 첫 설치 때 저장한 데이터도 가져와요.

백업은 설치 폴더의 **data**와 **public/artwork**를 함께 복사해 두면 돼요. 기존 장면 모음은 보관하며, OBS 설정 백업도 설치할 때 만들어 둬요. [문제가 생겼을 때](docs/INSTALL.md#잘-안-보이면-여기부터)

노래책은 2026-10-05에 가져온 **211곡 스냅샷**이에요. Notion의 변경 사항을 자동으로 동기화하지 않아요. 외부 앨범 이미지는 인터넷이 필요하고 직접 등록한 이미지는 PC에 저장돼요.

[개발·저장 구조](docs/DEVELOPMENT.md) · [v1.2.0 변경 사항](docs/RELEASE-NOTES.md)
