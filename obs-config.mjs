import fs from 'node:fs';
import path from 'node:path';

// Selecting a portable copy must never fall back to the installed OBS settings.
export function resolveOBSConfig({exe,portable=false,appData=process.env.APPDATA}={}) {
  if(exe && (!fs.existsSync(exe)||path.basename(exe).toLowerCase()!=='obs64.exe')) throw Error('OBS 실행 파일 obs64.exe를 선택해 주세요.');
  const root=exe?path.resolve(path.dirname(exe),'../..'):null;
  const markers=['portable_mode','portable_mode.txt','obs_portable_mode','obs_portable_mode.txt'];
  const isPortable=portable||Boolean(root&&markers.some(name=>fs.existsSync(path.join(root,name))));
  if(isPortable&&!root) throw Error('포터블 OBS의 obs64.exe를 먼저 선택해 주세요.');
  const config=isPortable?path.join(root,'config/obs-studio'):path.join(appData,'obs-studio');
  const iniPath=path.join(config,'user.ini');
  if(!fs.existsSync(iniPath)) throw Error('선택한 OBS의 설정을 찾지 못했어요. 그 OBS를 한 번 열고 닫은 뒤 다시 시도해 주세요. 설정을 바꾸지 않았어요: '+config);
  return {config,iniPath,portable:isPortable};
}

export function isLegacyKiraDock(dock) {
  if(!['키라 셋리스트','키라 앰프 DLC'].includes(dock.title)) return false;
  let url;try{url=decodeURIComponent(dock.url||'');}catch{return false;}
  return /\/KiraSetlist(?:DLC)?\/dock-launcher\.html$/i.test(url)||/^http:\/\/127\.0\.0\.1:431[78]\/control(?:\?|$)/.test(url);
}
