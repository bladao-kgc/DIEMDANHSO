<#
    Start DIEM DANH SO (production build) on a given port.
    Usage:
        powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
        powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1 -Port 80
#>
param(
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
    Write-Host 'Installing dependencies...'
    npm install --no-audit --no-fund
}

if (-not (Test-Path (Join-Path $Root 'dist')) -or -not (Test-Path (Join-Path $Root 'server.js'))) {
    Write-Host 'Building production bundle...'
    npm run build
}

$logDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Stop an old instance listening on the same port
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 500

$env:PORT = "$Port"
$outLog = Join-Path $logDir "web-$Port.out.log"
$errLog = Join-Path $logDir "web-$Port.err.log"

Start-Process -FilePath 'node' `
    -ArgumentList 'server.js' `
    -WorkingDirectory $Root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog

Start-Sleep -Seconds 3

try {
    $code = (Invoke-WebRequest "http://127.0.0.1:$Port/api/stats/dashboard" -UseBasicParsing -TimeoutSec 10).StatusCode
    Write-Host "OK: web is running on port $Port (API HTTP $code)"
    Write-Host "Local URL : http://localhost:$Port"
    Write-Host "Log file  : $outLog"
} catch {
    Write-Host "FAILED to start: $($_.Exception.Message)"
    if (Test-Path $errLog) { Get-Content $errLog }
    exit 1
}
