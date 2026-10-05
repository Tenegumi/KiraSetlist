-- Windows OBS Lua script: start the bundled local service without a console.
local obs = obslua
local ffi = require('ffi')
ffi.cdef[[
typedef void* KIRA_UNIFIED_HANDLE;
typedef unsigned long KIRA_UNIFIED_DWORD;
typedef int KIRA_UNIFIED_BOOL;
typedef unsigned short KIRA_UNIFIED_WCHAR;
typedef struct { KIRA_UNIFIED_DWORD cb; KIRA_UNIFIED_WCHAR *lpReserved; KIRA_UNIFIED_WCHAR *lpDesktop; KIRA_UNIFIED_WCHAR *lpTitle; KIRA_UNIFIED_DWORD dwX,dwY,dwXSize,dwYSize,dwXCountChars,dwYCountChars,dwFillAttribute,dwFlags; unsigned short wShowWindow,cbReserved2; unsigned char *lpReserved2; KIRA_UNIFIED_HANDLE hStdInput,hStdOutput,hStdError; } KIRA_UNIFIED_STARTUPINFO;
typedef struct { KIRA_UNIFIED_HANDLE hProcess,hThread; KIRA_UNIFIED_DWORD dwProcessId,dwThreadId; } KIRA_UNIFIED_PROCESSINFO;
int __stdcall MultiByteToWideChar(unsigned int, KIRA_UNIFIED_DWORD, const char*, int, KIRA_UNIFIED_WCHAR*, int);
KIRA_UNIFIED_BOOL __stdcall CreateProcessW(const KIRA_UNIFIED_WCHAR*, KIRA_UNIFIED_WCHAR*, void*, void*, KIRA_UNIFIED_BOOL, KIRA_UNIFIED_DWORD, void*, const KIRA_UNIFIED_WCHAR*, KIRA_UNIFIED_STARTUPINFO*, KIRA_UNIFIED_PROCESSINFO*);
KIRA_UNIFIED_BOOL __stdcall CloseHandle(KIRA_UNIFIED_HANDLE);
KIRA_UNIFIED_BOOL __stdcall TerminateProcess(KIRA_UNIFIED_HANDLE,unsigned int);
KIRA_UNIFIED_DWORD __stdcall GetCurrentProcessId(void);
KIRA_UNIFIED_DWORD __stdcall GetLastError(void);
KIRA_UNIFIED_DWORD __stdcall WaitForSingleObject(KIRA_UNIFIED_HANDLE,KIRA_UNIFIED_DWORD);
]]
local win = ffi.load('kernel32')
local process = nil
local function wide(text)
 local count=win.MultiByteToWideChar(65001,0,text,#text,nil,0)
 local result=ffi.new('KIRA_UNIFIED_WCHAR[?]',count+1)
 win.MultiByteToWideChar(65001,0,text,#text,result,count)
 return result
end
local function launch()
 if process and win.WaitForSingleObject(process,0)==258 then return true end
 if process then win.CloseHandle(process);process=nil end
 local root=script_path():gsub('[/\\]+$','')
 local runtime=root..'/runtime/node.exe'
 local entry=root..'/server.mjs'
 local file=io.open(runtime,'rb')
 if not file then obs.script_log(obs.LOG_ERROR,'키라 통합 셋리스트: runtime/node.exe가 없습니다. 설치 폴더의 스크립트를 등록해 주세요.');return false end
 file:close()
 local si=ffi.new('KIRA_UNIFIED_STARTUPINFO');si.cb=ffi.sizeof(si)
 local pi=ffi.new('KIRA_UNIFIED_PROCESSINFO')
 local command='"'..runtime..'" "'..entry..'" --owner-pid '..tonumber(win.GetCurrentProcessId())
 local ok=win.CreateProcessW(wide(runtime),wide(command),nil,nil,0,0x08000000,nil,wide(root),si,pi)
 if ok==0 then obs.script_log(obs.LOG_ERROR,'키라 통합 셋리스트 실행 실패: Windows '..tonumber(win.GetLastError()));return false end
 win.CloseHandle(pi.hThread);process=pi.hProcess
 return true
end
function script_description()
 return '<b>키라 통합 셋리스트 · OBS 자동 실행</b><br>OBS를 켜면 콘솔이나 별도 브라우저 없이 실행합니다.<br>조작 패널과 방송 소스는 설치 폴더의 OBS-setup.txt를 참고해 한 번 등록해 주세요.'
end
function script_load(settings) launch() end
function script_unload()
 if process then
  -- Only terminate the child we created. Never stop another running instance.
  if win.WaitForSingleObject(process,0)==258 then win.TerminateProcess(process,0) end
  win.CloseHandle(process);process=nil
 end
end
local function add_overlay()
 local scene_source=obs.obs_frontend_get_current_scene()
 if not scene_source then return false end
 local scene=obs.obs_scene_from_source(scene_source)
 local name='키라 통합 셋리스트 오버레이'
 if obs.obs_scene_find_source(scene,name) then obs.obs_source_release(scene_source);return true end
 local source=obs.obs_get_source_by_name(name)
 if not source then
  local data=obs.obs_data_create()
  obs.obs_data_set_bool(data,'is_local_file',true)
  obs.obs_data_set_string(data,'local_file',script_path()..'overlay-launcher.html')
  obs.obs_data_set_int(data,'width',3840);obs.obs_data_set_int(data,'height',2160)
  obs.obs_data_set_bool(data,'fps_custom',true);obs.obs_data_set_int(data,'fps',60)
  obs.obs_data_set_bool(data,'shutdown',false)
  source=obs.obs_source_create('browser_source',name,data,nil)
  obs.obs_data_release(data)
 end
 if source then
  local item=obs.obs_scene_add(scene,source)
  local scale=obs.vec2();scale.x=1920/obs.obs_source_get_width(source);scale.y=1080/obs.obs_source_get_height(source)
  obs.obs_sceneitem_set_scale(item,scale)
  obs.obs_source_release(source)
 end
 obs.obs_source_release(scene_source)
 return source~=nil
end
function script_properties()
 local props=obs.obs_properties_create()
 obs.obs_properties_add_button(props,'restart','연결 다시 시작',function() return launch() end)
 obs.obs_properties_add_button(props,'overlay','현재 장면에 오버레이 추가',function() return add_overlay() end)
 return props
end
