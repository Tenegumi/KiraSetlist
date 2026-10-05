param([string]$Destination=(Join-Path $env:USERPROFILE 'KiraSetlistUnified'),[string]$ObsExe,[switch]$Portable,[switch]$NoLaunch)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
if(Get-Process obs64 -ErrorAction SilentlyContinue){throw 'OBS를 먼저 종료해 주세요. 방송 중인 화면과 설정을 보호하기 위해 설치를 멈췄어요.'}
if($ObsExe){
 if(-not (Test-Path -LiteralPath $ObsExe -PathType Leaf) -or (Split-Path $ObsExe -Leaf) -ne 'obs64.exe'){throw 'OBS 실행 파일 obs64.exe를 선택해 주세요.'}
}else{
 $taskCandidates=@((Join-Path $env:ProgramFiles 'obs-studio\bin\64bit\obs64.exe'))
 if(${env:ProgramFiles(x86)}){$taskCandidates+=(Join-Path ${env:ProgramFiles(x86)} 'obs-studio\bin\64bit\obs64.exe')}
 $taskCandidates+=(Join-Path $env:LOCALAPPDATA 'Programs\obs-studio\bin\64bit\obs64.exe')
 foreach($taskKey in @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\OBS Studio','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\OBS Studio','HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\OBS Studio')){
  $taskLocation=(Get-ItemProperty -LiteralPath $taskKey -Name InstallLocation -ErrorAction SilentlyContinue).InstallLocation
  if($taskLocation){$taskCandidates+=(Join-Path $taskLocation 'bin\64bit\obs64.exe')}
 }
 $ObsExe=$taskCandidates | Where-Object {Test-Path -LiteralPath $_ -PathType Leaf} | Select-Object -First 1
 if(-not $ObsExe){throw 'OBS를 찾지 못했어요. 설치 창의 OBS 경로 선택에서 obs64.exe를 지정하거나 수동 ZIP을 사용해 주세요.'}
}
$taskObsRoot=Split-Path (Split-Path (Split-Path $ObsExe))
if(@('portable_mode','portable_mode.txt','obs_portable_mode','obs_portable_mode.txt') | Where-Object {Test-Path -LiteralPath (Join-Path $taskObsRoot $_)}){$Portable=$true}
$taskLog=Join-Path $env:TEMP ('kira-install-'+[guid]::NewGuid().ToString()+'.log')
$taskErrorLog=$taskLog+'.err'
$taskArguments='"'+(Join-Path $PSScriptRoot 'install.mjs')+'" "'+$Destination+'"'
$taskArguments+=' --obs-exe "'+$ObsExe+'"'
if($Portable){$taskArguments+=' --portable'}
$taskProcess=Start-Process -FilePath (Join-Path $PSScriptRoot 'app\runtime\node.exe') -ArgumentList $taskArguments -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $taskLog -RedirectStandardError $taskErrorLog
if(Test-Path -LiteralPath $taskLog){Get-Content -LiteralPath $taskLog -Encoding UTF8 | Write-Output}
if(Test-Path -LiteralPath $taskErrorLog){Get-Content -LiteralPath $taskErrorLog -Encoding UTF8 | Write-Output}
if($taskProcess.ExitCode -ne 0){throw '설치가 끝나지 않았어요. 위에 나온 안내를 확인해 주세요.'}
if(-not $NoLaunch){
 $taskLaunchArgs='--collection "키라 통합 셋리스트 (원본 + DLC)"'
 if($Portable){$taskLaunchArgs+=' --portable'}
 Start-Process -FilePath $ObsExe -WorkingDirectory (Split-Path $ObsExe) -ArgumentList $taskLaunchArgs
}
