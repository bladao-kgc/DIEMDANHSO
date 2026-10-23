<#
    Stop the DIEM DANH SO web server listening on the given port.
    Usage: powershell -ExecutionPolicy Bypass -File .\scripts\stop-web.ps1 -Port 3000
#>
param(
    [int]$Port = 3000
)

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $listeners) {
    Write-Host "No process listening on port $Port."
    exit 0
}

foreach ($listener in $listeners) {
    $proc = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping $($proc.ProcessName) (PID $($proc.Id)) on port $Port..."
        Stop-Process -Id $proc.Id -Force
    }
}

Start-Sleep -Seconds 1
Write-Host "Stopped."
