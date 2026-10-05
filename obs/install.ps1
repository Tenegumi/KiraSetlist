param([string]$Destination = (Join-Path $env:USERPROFILE 'KiraSetlist'))
$ErrorActionPreference = 'Stop'
$taskDestination = [IO.Path]::GetFullPath($Destination)
$taskPackage = [IO.Path]::GetFullPath($PSScriptRoot)
if ($taskDestination -eq $taskPackage) { throw 'Choose a destination outside the package folder.' }
New-Item -ItemType Directory -Path $taskDestination -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $taskPackage 'lib') -Destination $taskDestination -Recurse -Force
$taskRuntimeDestination = Join-Path $taskDestination 'runtime'
New-Item -ItemType Directory -Path $taskRuntimeDestination -Force | Out-Null
foreach ($taskFile in Get-ChildItem -LiteralPath (Join-Path $taskPackage 'runtime') -File) {
    $taskTarget = Join-Path $taskRuntimeDestination $taskFile.Name
    # Do not replace an identical runtime executable that OBS might be using.
    if ((Test-Path -LiteralPath $taskTarget) -and (Get-FileHash -LiteralPath $taskTarget).Hash -eq (Get-FileHash -LiteralPath $taskFile.FullName).Hash) { continue }
    Copy-Item -LiteralPath $taskFile.FullName -Destination $taskTarget -Force
}
$taskPublic = Join-Path $taskDestination 'public'
New-Item -ItemType Directory -Path $taskPublic -Force | Out-Null
Get-ChildItem -LiteralPath (Join-Path $taskPackage 'public') -File | Copy-Item -Destination $taskPublic -Force
# Guide screenshots are shared assets, separate from personal uploaded album art.
$taskGuideAssets = Join-Path $taskPackage 'public\guide-assets'
if (Test-Path -LiteralPath $taskGuideAssets) {
    Copy-Item -LiteralPath $taskGuideAssets -Destination $taskPublic -Recurse -Force
    Copy-Item -LiteralPath $taskGuideAssets -Destination $taskDestination -Recurse -Force
}
# Uploaded art and existing personal data are never replaced by the installer.
$taskUploads = Join-Path $taskPublic 'artwork'
New-Item -ItemType Directory -Path $taskUploads -Force | Out-Null
foreach ($taskFile in Get-ChildItem -LiteralPath (Join-Path $taskPackage 'public\artwork') -File) {
    $taskTarget = Join-Path $taskUploads $taskFile.Name
    if (-not (Test-Path -LiteralPath $taskTarget)) { Copy-Item -LiteralPath $taskFile.FullName -Destination $taskTarget }
}
$taskData = Join-Path $taskDestination 'data'
New-Item -ItemType Directory -Path $taskData -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $taskPackage 'data\songbook.raw.json') -Destination $taskData -Force
foreach ($taskFile in Get-ChildItem -LiteralPath (Join-Path $taskPackage 'data') -File) {
    $taskTarget = Join-Path $taskData $taskFile.Name
    if (-not (Test-Path -LiteralPath $taskTarget)) { Copy-Item -LiteralPath $taskFile.FullName -Destination $taskTarget }
}
foreach ($taskName in @('server.mjs','package.json','README.md','kira-setlist.lua','dock-launcher.html','overlay-launcher.html')) {
    Copy-Item -LiteralPath (Join-Path $taskPackage $taskName) -Destination $taskDestination -Force
}
$taskDock = ([uri](Join-Path $taskDestination 'dock-launcher.html')).AbsoluteUri
$taskOverlay = ([uri](Join-Path $taskDestination 'overlay-launcher.html')).AbsoluteUri
$taskGuide = @"
KIRA SETLIST / OBS

1. OBS: Tools > Scripts > +
   $taskDestination\kira-setlist.lua

2. OBS: Docks > Custom Browser Docks
   Name: Kira Setlist
   URL: $taskDock
   Dock width: 340-420 px

3. OBS: Tools > Scripts > Kira script
   Click the button to add the overlay to the current scene.
   Or manually: Sources > + > Browser
   Local file: ON
   File: $taskDestination\overlay-launcher.html
   Width: 1920 / Height: 1080 / FPS: 30
   Shutdown source when not visible: OFF

After registration: open OBS and operate the Kira Setlist dock.
No external browser, terminal, Node installation or audio playback required.
Saved data: $taskDestination\data
Uploaded album art: $taskDestination\public\artwork

Overlay URL if needed: $taskOverlay
"@
[IO.File]::WriteAllText((Join-Path $taskDestination 'OBS-setup.txt'),$taskGuide)
$taskGuideTemplate = Get-Content -LiteralPath (Join-Path $taskPackage 'OBS-guide.template.html') -Raw -Encoding UTF8
$taskLocalizedGuide = $taskGuideTemplate.Replace('__INSTALL_DIR__',[System.Net.WebUtility]::HtmlEncode($taskDestination)).Replace('__DOCK_URL__',[System.Net.WebUtility]::HtmlEncode($taskDock))
[IO.File]::WriteAllText((Join-Path $taskDestination 'OBS-guide.html'),$taskLocalizedGuide)
Copy-Item -LiteralPath (Join-Path $taskPackage 'guide.css') -Destination $taskDestination -Force
[IO.File]::WriteAllText((Join-Path $taskPublic 'guide.html'),$taskLocalizedGuide)
Copy-Item -LiteralPath (Join-Path $taskPackage 'guide.css') -Destination $taskPublic -Force
Write-Output "Installed: $taskDestination"
Write-Output "One-time OBS setup: $taskDestination\OBS-setup.txt"
Write-Output "Korean installation guide: $taskDestination\OBS-guide.html"
