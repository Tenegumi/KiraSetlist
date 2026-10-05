param([string]$Destination=(Join-Path $env:USERPROFILE 'KiraSetlistUnified'),[switch]$NoLaunch)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
if(Get-Process obs64 -ErrorAction SilentlyContinue){throw 'OBS를 먼저 종료해 주세요. 방송 중인 화면과 설정을 보호하기 위해 설치를 멈췄어요.'}
$taskLog=Join-Path $env:TEMP ('kira-install-'+[guid]::NewGuid().ToString()+'.log')
$taskErrorLog=$taskLog+'.err'
$taskArguments='"'+(Join-Path $PSScriptRoot 'install.mjs')+'" "'+$Destination+'"'
$taskProcess=Start-Process -FilePath (Join-Path $PSScriptRoot 'app\runtime\node.exe') -ArgumentList $taskArguments -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $taskLog -RedirectStandardError $taskErrorLog
if(Test-Path -LiteralPath $taskLog){Get-Content -LiteralPath $taskLog -Encoding UTF8 | Write-Output}
if(Test-Path -LiteralPath $taskErrorLog){Get-Content -LiteralPath $taskErrorLog -Encoding UTF8 | Write-Output}
if($taskProcess.ExitCode -ne 0){throw '설치가 끝나지 않았어요. 위에 나온 안내를 확인해 주세요.'}
if(-not $NoLaunch){
 $taskObs=Join-Path $env:ProgramFiles 'obs-studio\bin\64bit\obs64.exe'
 if(Test-Path -LiteralPath $taskObs){Start-Process -FilePath $taskObs -WorkingDirectory (Split-Path $taskObs) -ArgumentList '--collection "키라 통합 셋리스트 (원본 + DLC)"'}
 else{Write-Output 'OBS를 직접 열고 장면 모음에서 키라 통합 셋리스트 (원본 + DLC)를 선택해 주세요.'}
}
