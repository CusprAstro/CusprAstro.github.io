param(
  [string]$Version = "0.3.0-beta",
  [switch]$IncludeTestBuild,
  [switch]$SkipDesktop
)
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true
$Root = Split-Path -Parent $PSScriptRoot
$Release = Join-Path $Root "release"
$Stage = Join-Path $Release "stage"
if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Path $Stage | Out-Null

python (Join-Path $Root "app\bundle.py") - (Join-Path $Root "index.html")
Copy-Item (Join-Path $Root "index.html") (Join-Path $Root "desktop\index.html") -Force
Copy-Item (Join-Path $Root "app\dist\Cuspr.ico") (Join-Path $Root "desktop\icon.ico") -Force
Copy-Item (Join-Path $Root "app\dist\Cuspr_icon_256.png") (Join-Path $Root "desktop\icon.png") -Force

$Web = Join-Path $Stage "Cuspr-$Version-web"
New-Item -ItemType Directory -Path $Web | Out-Null
Copy-Item (Join-Path $Root "index.html") $Web
Copy-Item (Join-Path $Root "README.md"), (Join-Path $Root "LICENSE") $Web
Compress-Archive -Path "$Web\*" -DestinationPath (Join-Path $Release "Cuspr-$Version-web.zip") -Force

if (-not $SkipDesktop) {
  Push-Location (Join-Path $Root "desktop")
  try { npm run pack } finally { Pop-Location }
  $DesktopOut = Join-Path $Root "desktop\out\Cuspr-win32-x64"
  Compress-Archive -Path "$DesktopOut\*" -DestinationPath (Join-Path $Release "Cuspr-$Version-windows-x64.zip") -Force
}

if ($IncludeTestBuild) {
  $Test = Join-Path $Stage "Cuspr-$Version-unlocked-pro-test"
  New-Item -ItemType Directory -Path $Test | Out-Null
  python (Join-Path $Root "app\bundle.py") pro (Join-Path $Test "index.html")
  Set-Content -Path (Join-Path $Test "TEST-BUILD.txt") -Value "Unlocked Pro QA build. Do not publish or sell."
  Compress-Archive -Path "$Test\*" -DestinationPath (Join-Path $Release "Cuspr-$Version-unlocked-pro-test.zip") -Force
}

$Artifacts = Get-ChildItem $Release -Filter "*.zip" | Sort-Object Name
$Lines = foreach ($File in $Artifacts) {
  $Hash = (Get-FileHash $File.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  "$Hash  $($File.Name)"
}
Set-Content -Path (Join-Path $Release "SHA256SUMS") -Value $Lines -Encoding ascii
Write-Output "Built $($Artifacts.Count) zip artifact(s) in $Release"
