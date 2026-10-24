param(
  [string]$Version = "0.4.0-beta",
  [switch]$IncludeTestBuild,
  [switch]$SkipDesktop
)
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true
$Root = Split-Path -Parent $PSScriptRoot
$Release = Join-Path $Root "release"
$Stage = Join-Path $Release "stage-v04"
$Editions = @("free", "ads", "supporter", "pro")
$Display = @{free="Free"; ads="Free-with-Ads"; supporter="Supporter"; pro="Pro"}

if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Path $Stage -Force | Out-Null
Get-ChildItem $Release -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "Cuspr-$Version-*" -or $_.Name -eq "SHA256SUMS" } | Remove-Item -Force

function Build-Bundle([string]$Edition, [string]$Output, [switch]$Unlock) {
  $args = @((Join-Path $Root "app\bundle.py"), $Edition, $Output)
  if ($Unlock) { $args += "unlock" }
  python @args
}
function Write-PackageReadme([string]$Path, [string]$Edition, [bool]$Unlocked) {
  $access = if ($Unlocked) {"This local QA package is unlocked Pro. Do not publish or sell it."} elseif ($Edition -in @("supporter","pro")) {"The Windows and PWA builds still require an active matching Gumroad membership key. This is not a forced paid build."} else {"Edition defaults can be changed inside Cuspr from the Plans screen."}
  @"
Cuspr $Version — $($Display[$Edition])

$access

PWA\launch\index.html contains the installable web build.
Windows-x64\Cuspr.exe launches the Windows build.

Supporter: `$4.99/month
Pro: `$9.99/month

Astrology is symbolic and for reflection/entertainment, not medical, legal, financial, safety or travel advice.
Sigstore bundles sign public ZIP artifacts in GitHub Actions. This is not Windows Authenticode.
"@ | Set-Content -Path (Join-Path $Path "README.txt") -Encoding utf8
}

New-Item -ItemType Directory -Path (Join-Path $Root "launch") -Force | Out-Null
Build-Bundle "free" (Join-Path $Root "launch\index.html")
Copy-Item (Join-Path $Root "launch\index.html") (Join-Path $Root "desktop\index.html") -Force
Copy-Item (Join-Path $Root "app\dist\Cuspr.ico") (Join-Path $Root "desktop\icon.ico") -Force
Copy-Item (Join-Path $Root "app\dist\Cuspr_icon_256.png") (Join-Path $Root "desktop\icon.png") -Force

$Bundles = @{}
$Roots = @{}
foreach ($Edition in $Editions) {
  $EditionRoot = Join-Path $Stage "Cuspr-$Version-$($Display[$Edition])"
  $PwaRoot = Join-Path $EditionRoot "PWA"
  $Launch = Join-Path $PwaRoot "launch"
  New-Item -ItemType Directory -Path $Launch -Force | Out-Null
  Build-Bundle $Edition (Join-Path $Launch "index.html")
  Copy-Item (Join-Path $Root "launch\manifest.webmanifest"), (Join-Path $Root "launch\sw.js") $Launch
  Copy-Item (Join-Path $Root "icons") (Join-Path $PwaRoot "icons") -Recurse
  Copy-Item (Join-Path $Root "offline.html"), (Join-Path $Root "site.css"), (Join-Path $Root "LICENSE") $PwaRoot
  $Bundles[$Edition] = Join-Path $Launch "index.html"
  $Roots[$Edition] = $EditionRoot
}

if (-not $SkipDesktop) {
  Push-Location (Join-Path $Root "desktop")
  try { npm run pack } finally { Pop-Location }
  $BaseDesktop = Join-Path $Root "desktop\out\Cuspr-win32-x64"
  foreach ($Edition in $Editions) {
    $WindowsRoot = Join-Path $Roots[$Edition] "Windows-x64"
    Copy-Item $BaseDesktop $WindowsRoot -Recurse
    Copy-Item $Bundles[$Edition] (Join-Path $WindowsRoot "resources\app\index.html") -Force
  }
}

foreach ($Edition in $Editions) {
  Write-PackageReadme $Roots[$Edition] $Edition $false
  Compress-Archive -Path "$($Roots[$Edition])\*" -DestinationPath (Join-Path $Release "Cuspr-$Version-$($Display[$Edition]).zip") -Force
}

if ($IncludeTestBuild) {
  if ($SkipDesktop) { throw "Unlocked Pro executable requires desktop packaging." }
  $TestRoot = Join-Path $Stage "Cuspr-$Version-Unlocked-Pro-Test"
  $TestWindows = Join-Path $TestRoot "Windows-x64"
  Copy-Item (Join-Path $Root "desktop\out\Cuspr-win32-x64") $TestWindows -Recurse
  Build-Bundle "pro" (Join-Path $TestWindows "resources\app\index.html") -Unlock
  Write-PackageReadme $TestRoot "pro" $true
  Set-Content -Path (Join-Path $TestRoot "DO-NOT-PUBLISH.txt") -Value "Unlocked Pro QA executable. Local use only." -Encoding ascii
  Compress-Archive -Path "$TestRoot\*" -DestinationPath (Join-Path $Release "Cuspr-$Version-Unlocked-Pro-Test.zip") -Force
}

$Artifacts = Get-ChildItem $Release -Filter "Cuspr-$Version-*.zip" | Sort-Object Name
$Lines = foreach ($File in $Artifacts) {
  "$((Get-FileHash $File.FullName -Algorithm SHA256).Hash.ToLowerInvariant())  $($File.Name)"
}
Set-Content -Path (Join-Path $Release "SHA256SUMS") -Value $Lines -Encoding ascii
Write-Output "Built $($Artifacts.Count) edition artifact(s) in $Release"
