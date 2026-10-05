import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),out=path.join(root,'dist/KiraSetlist-Pixel-Guide'),bundle=path.join(out,'bundle');
fs.mkdirSync(bundle,{recursive:true});
for(const [from,to] of [['keyframes','images'],['subtitles.srt','subtitles.srt'],['namgungwoo-tutorial.mp4','namgungwoo-tutorial.mp4']])fs.cpSync(path.join(out,from),path.join(bundle,to),{recursive:true});
fs.cpSync(path.join(root,'docs/tutorial-motion'),path.join(bundle,'viewer'),{recursive:true});
const code=fs.readFileSync(path.join(root,'docs/tutorial-motion/scenes.js'),'utf8');const scenes=JSON.parse(code.slice(code.indexOf('=')+1).replace(/;\s*$/,''));
fs.writeFileSync(path.join(bundle,'narration.txt'),scenes.map((s,i)=>`${String(i+1).padStart(2,'0')} · ${s.title}\n${s.line}\n`).join('\n'));
fs.writeFileSync(path.join(bundle,'README.txt'),'남궁우 도트 셋리스트 가이드\n\nnamgungwoo-tutorial.mp4: 24단계 / 3분 12초 / 무음 / 8fps\nimages: 1920×1080 안내 이미지 96장\nsubtitles.srt: 영상 자막\nnarration.txt: 내레이션 대사\nviewer/index.html: 이전·다음 버튼이 있는 움직이는 가이드\nviewer/assets/namgungwoo-pixel-sheet.png: 투명 캐릭터 4포즈\n\n화면 파일 선택과 OBS 메뉴는 설명용 도식이고, 조작 패널은 실제 앱 캡처입니다.\n');
console.log(`Bundle ready: ${bundle}`);
