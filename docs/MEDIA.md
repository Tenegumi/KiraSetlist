# 가이드 영상을 편집하고 싶다면

[가이드 묶음 ZIP 받기](https://github.com/Tenegumi/KiraSetlist/releases/download/v1.2.0/KiraSetlist-Integrated-Guide.zip)

**전환 모션만 보고 싶다면:** [원본 60fps MP4](https://github.com/Tenegumi/KiraSetlist/releases/download/v1.2.0/KiraSetlist-Original-Motion-60fps.mp4) · [앰프 DLC 60fps MP4](https://github.com/Tenegumi/KiraSetlist/releases/download/v1.2.0/KiraSetlist-DLC-Motion-60fps.mp4). 각 8초이며 예시 목록에서 두 번 곡을 넘겨요. 4K 브라우저 소스를 Full HD로 축소해 촬영했어요. 원본은 곡 정보 교체와 CD 회전, DLC는 LP·슬리브·곡 정보의 스트럼 전환을 보여줘요.

ZIP의 **kira-integrated-tutorial.mp4**를 영상 편집기에 넣으면 바로 쓸 수 있어요. **3분 12초 · 1920×1080 · 무음**이며, 도트 남궁우가 걸어 들어와 손을 흔들고 버튼을 가리키고 고개를 끄덕여요. 움직임은 종이 인형을 옮겨 찍듯 초당 8컷으로 끊었고 MP4는 24fps로 저장했어요.

| 파일 | 사용할 때 |
| --- | --- |
| `kira-integrated-tutorial.mp4` | 완성 영상으로 바로 사용 |
| `images/01-1.png` ~ `32-4.png` | 단계별 4컷, 총 128장. 정지 안내나 직접 편집에 사용 |
| `subtitles.srt` | 편집기에 불러와 자막 타이밍 사용 |
| `narration.txt` | 직접 읽거나 원하는 TTS로 내레이션 만들기 |
| `viewer/index.html` | 브라우저에서 단계 선택·이전·다음·일시 정지 |
| `viewer/assets/namgungwoo-pixel-sheet.png` | 기존 GPT 이미지 생성 도트 캐릭터 4포즈 |

## 영상의 순서

| 시간 | 내용 |
| --- | --- |
| 00:00~00:12 | 통합본 소개와 원본 디자인 |
| 00:12~00:48 | OBS 닫기, ZIP 받기, 압축 해제, 설치 버튼, 조작 독 |
| 00:48~01:06 | 원본/DLC 전환과 제목만 보이는 대기 목록 |
| 01:06~01:30 | 노래책 검색, + 추가, 직접 추가, 내 노래책 저장 |
| 01:30~01:48 | 기본 CD, 앨범 후보, 내 이미지 등록 |
| 01:48~02:06 | 부르기, 완료 · 다음 곡, 순서 변경, 되돌리기 |
| 02:06~02:48 | 표시 곡 수, 크기·위치, 투명도, 하단 정보, 회전 |
| 02:48~03:12 | 4K/60fps 확인, 다음 방송, 업데이트·백업, 마무리 |

## 화면 구분

방송 합성 화면은 **실제 OBS 출력**, 조작 화면은 **개인 방송 목록을 건드리지 않은 예시 데이터의 실제 앱 캡처**예요. 설치 창은 실제 설치 프로그램의 컨트롤을 화면에 렌더링했어요. 다운로드·압축 해제와 폴더 안내는 따라 하기용 안내 카드예요. 화살표와 클릭 원은 안내 표시이며 실제 마우스 조작을 녹화한 것은 아니에요.

캐릭터는 이전 가이드에서 GPT 이미지로 만든 **오프숄더 도트 남궁우**를 이어 사용했어요. 이번에는 모든 안내 내용과 앱 화면을 v1.2.0 통합본에 맞췄어요.

[단계 예시 보기](tutorial-motion/README.md) · [설치 안내](INSTALL.md)
