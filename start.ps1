$ErrorActionPreference = 'Stop'
# Optional shortcut: ordinary use is simply opening OBS itself.
$taskInstall = Join-Path $env:USERPROFILE 'KiraSetlist'
if (-not (Test-Path -LiteralPath (Join-Path $taskInstall 'kira-setlist.lua'))) {
    $taskInstaller = Join-Path $PSScriptRoot 'dist\KiraSetlist-OBS\install.ps1'
    if (-not (Test-Path -LiteralPath $taskInstaller)) { throw 'Run scripts/package-obs.ps1 first, then install the OBS package.' }
    & $taskInstaller -Destination $taskInstall
}
if (Get-Process -Name obs64 -ErrorAction SilentlyContinue) {
    Write-Output 'OBS is already running. Use the Kira Setlist dock.'
    return
}
$taskOBS = Join-Path $env:ProgramFiles 'obs-studio\bin\64bit\obs64.exe'
if (-not (Test-Path -LiteralPath $taskOBS)) { throw 'OBS was not found. Open your OBS installation and register the script using OBS-setup.txt.' }
# OBS is the interactive app requested by the user; no browser or service console opens.
Start-Process -FilePath $taskOBS -WorkingDirectory (Split-Path $taskOBS -Parent)
