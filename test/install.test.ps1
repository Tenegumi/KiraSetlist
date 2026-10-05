$ErrorActionPreference = 'Stop'
$taskTempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$taskFixture = Join-Path $taskTempBase ('kira-installer-test-' + [guid]::NewGuid())
$taskPackage = Join-Path $taskFixture 'package'
$taskTarget = Join-Path $taskFixture 'installed'
New-Item -ItemType Directory -Path $taskPackage -Force | Out-Null
try {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '..\obs\install.ps1') -Destination $taskPackage
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '..\obs\guide.html') -Destination (Join-Path $taskPackage 'OBS-guide.template.html')
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '..\obs\guide.css') -Destination $taskPackage
    foreach ($taskFolder in @('lib','runtime','public\artwork','public\guide-assets','data')) { New-Item -ItemType Directory -Path (Join-Path $taskPackage $taskFolder) -Force | Out-Null }
    Set-Content -LiteralPath (Join-Path $taskPackage 'public\guide-assets\demo.png') -Value 'guide-image'
    foreach ($taskFile in @('lib\catalog.mjs','runtime\node.exe','public\control.html','public\artwork\shared.png','data\songbook.raw.json','data\artwork.json','server.mjs','package.json','README.md','kira-setlist.lua','dock-launcher.html','overlay-launcher.html')) { Set-Content -LiteralPath (Join-Path $taskPackage $taskFile) -Value 'original' }
    & (Join-Path $taskPackage 'install.ps1') -Destination $taskTarget
    foreach ($taskFile in @('data\state.json','data\artwork.json','public\artwork\shared.png','public\artwork\personal.png')) { Set-Content -LiteralPath (Join-Path $taskTarget $taskFile) -Value 'personal' }
    Set-Content -LiteralPath (Join-Path $taskPackage 'data\songbook.raw.json') -Value 'updated-book'
    Set-Content -LiteralPath (Join-Path $taskPackage 'lib\catalog.mjs') -Value 'updated-code'
    & (Join-Path $taskPackage 'install.ps1') -Destination $taskTarget
    foreach ($taskFile in @('data\state.json','data\artwork.json','public\artwork\shared.png','public\artwork\personal.png')) { if ((Get-Content -LiteralPath (Join-Path $taskTarget $taskFile) -Raw).Trim() -ne 'personal') { throw "Personal file replaced: $taskFile" } }
    if ((Get-Content -LiteralPath (Join-Path $taskTarget 'data\songbook.raw.json') -Raw).Trim() -ne 'updated-book') { throw 'Book not updated' }
    if ((Get-Content -LiteralPath (Join-Path $taskTarget 'lib\catalog.mjs') -Raw).Trim() -ne 'updated-code') { throw 'Code not updated' }
    if (Test-Path -LiteralPath (Join-Path $taskTarget 'lib\lib')) { throw 'Nested code directory created' }
    if (-not (Select-String -LiteralPath (Join-Path $taskTarget 'OBS-setup.txt') -Pattern 'file:///')) { throw 'Local dock URL missing' }
    $taskInstalledGuide = Get-Content -LiteralPath (Join-Path $taskTarget 'OBS-guide.html') -Raw -Encoding UTF8
    if ($taskInstalledGuide -match '__INSTALL_DIR__|__DOCK_URL__' -or -not $taskInstalledGuide.Contains($taskTarget)) { throw 'Guide paths not personalized' }
    if (-not (Test-Path -LiteralPath (Join-Path $taskTarget 'public\guide.html'))) { throw 'In-dock guide missing' }
    foreach ($taskImage in @('guide-assets\demo.png','public\guide-assets\demo.png')) { if (-not (Test-Path -LiteralPath (Join-Path $taskTarget $taskImage))) { throw "Guide screenshot missing: $taskImage" } }
    Write-Output 'PASS: reinstall updates code and songbook while preserving personal songs and album art.'
} finally {
    $taskResolved = [IO.Path]::GetFullPath($taskFixture)
    if (-not $taskResolved.StartsWith($taskTempBase,[StringComparison]::OrdinalIgnoreCase) -or (Split-Path $taskResolved -Leaf) -notlike 'kira-installer-test-*') { throw 'Unsafe test cleanup path' }
    Remove-Item -LiteralPath $taskResolved -Recurse -Force
}
