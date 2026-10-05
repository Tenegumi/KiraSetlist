$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskPackage = Join-Path $taskRoot 'dist\KiraSetlist-OBS'
$taskDistRoot = [IO.Path]::GetFullPath((Join-Path $taskRoot 'dist'))
$taskResolvedPackage = [IO.Path]::GetFullPath($taskPackage)
if ((Split-Path $taskResolvedPackage -Parent) -ne $taskDistRoot -or (Split-Path $taskResolvedPackage -Leaf) -ne 'KiraSetlist-OBS') { throw 'Unsafe package staging path' }
if (Test-Path -LiteralPath $taskResolvedPackage) { Remove-Item -LiteralPath $taskResolvedPackage -Recurse -Force }
New-Item -ItemType Directory -Path $taskPackage -Force | Out-Null
$taskGuideTemplate = Get-Content -LiteralPath (Join-Path $taskRoot 'obs\guide.html') -Raw -Encoding UTF8
$taskPackageGuide = $taskGuideTemplate.Replace('__INSTALL_DIR__','%USERPROFILE%\KiraSetlist').Replace('__DOCK_URL__','See OBS-guide.html in your installed KiraSetlist folder for the exact address.')
[IO.File]::WriteAllText((Join-Path $taskRoot 'public\guide.html'),$taskPackageGuide)
Copy-Item -LiteralPath (Join-Path $taskRoot 'obs\guide.css') -Destination (Join-Path $taskRoot 'public\guide.css') -Force
Copy-Item -LiteralPath (Join-Path $taskRoot 'lib') -Destination $taskPackage -Recurse -Force
$taskPublic = Join-Path $taskPackage 'public'
New-Item -ItemType Directory -Path (Join-Path $taskPublic 'artwork') -Force | Out-Null
Get-ChildItem -LiteralPath (Join-Path $taskRoot 'public') -File | Copy-Item -Destination $taskPublic -Force
# Never bundle personal uploaded artwork or a broadcaster's live session state.
Copy-Item -LiteralPath (Join-Path $taskRoot 'public\artwork\.gitkeep') -Destination (Join-Path $taskPublic 'artwork') -Force
Copy-Item -LiteralPath (Join-Path $taskRoot 'public\guide-assets') -Destination $taskPublic -Recurse -Force
Copy-Item -LiteralPath (Join-Path $taskRoot 'public\guide-assets') -Destination $taskPackage -Recurse -Force
$taskData = Join-Path $taskPackage 'data'
New-Item -ItemType Directory -Path $taskData -Force | Out-Null
foreach ($taskName in @('songbook.raw.json','artwork.json')) {
    Copy-Item -LiteralPath (Join-Path $taskRoot "data\$taskName") -Destination $taskData -Force
}
foreach ($taskName in @('server.mjs','package.json','README.md')) { Copy-Item -LiteralPath (Join-Path $taskRoot $taskName) -Destination $taskPackage -Force }
Copy-Item -LiteralPath (Join-Path $taskRoot 'obs\kira-setlist.lua') -Destination $taskPackage -Force
Copy-Item -LiteralPath (Join-Path $taskRoot 'obs\install.ps1') -Destination $taskPackage -Force
Copy-Item -LiteralPath (Join-Path $taskRoot 'obs\install.cmd') -Destination $taskPackage -Force
Copy-Item -LiteralPath (Join-Path $taskRoot 'obs\guide.html') -Destination (Join-Path $taskPackage 'OBS-guide.template.html') -Force
Copy-Item -LiteralPath (Join-Path $taskRoot 'obs\guide.css') -Destination $taskPackage -Force
[IO.File]::WriteAllText((Join-Path $taskPackage 'OBS-guide.html'),$taskPackageGuide)
$taskRuntime = Join-Path $taskPackage 'runtime'
New-Item -ItemType Directory -Path $taskRuntime -Force | Out-Null
$taskNode = (Get-Command node -ErrorAction Stop).Source
Copy-Item -LiteralPath $taskNode -Destination (Join-Path $taskRuntime 'node.exe') -Force
# Include the runtime's actual license text with the distributable.
$taskRuntimeLicense = Join-Path (Split-Path $taskNode -Parent) 'LICENSE'
if (-not (Test-Path -LiteralPath $taskRuntimeLicense)) { $taskRuntimeLicense = Join-Path $taskRoot 'obs\runtime-license.txt' }
Copy-Item -LiteralPath $taskRuntimeLicense -Destination (Join-Path $taskRuntime 'LICENSE') -Force
$taskTemplate = Get-Content -LiteralPath (Join-Path $taskRoot 'obs\launcher.html') -Raw
[IO.File]::WriteAllText((Join-Path $taskPackage 'dock-launcher.html'),$taskTemplate.Replace('__TARGET__','/control?dock=1'))
[IO.File]::WriteAllText((Join-Path $taskPackage 'overlay-launcher.html'),$taskTemplate.Replace('__TARGET__','/overlay'))
Write-Output "OBS package: $taskPackage"
$taskZip = Join-Path $taskRoot 'dist\KiraSetlist-OBS.zip'
Compress-Archive -LiteralPath $taskPackage -DestinationPath $taskZip -Force
Write-Output "Installer archive: $taskZip"
