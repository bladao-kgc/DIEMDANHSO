<#
    Tao Cloudflare Tunnel cho ten mien that (vd: diemdanhso.cokhi.cdkg.vn)
    Yeu cau: ten mien da add vao Cloudflare va NS da tro ve Cloudflare.

    Buoc 1 (1 lan): powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-tunnel.ps1 -Login
    Buoc 2 (moi lan chay): powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-tunnel.ps1

    Tham so:
      -Hostname  ten mien con (mac dinh diemdanhso.cokhi.cdkg.vn)
      -Port      cong app dang chay (mac dinh 3000)
      -Tunnel    ten tunnel (mac dinh diemdanhso)
#>
param(
    [string]$Hostname = 'diemdanhso.cokhi.cdkg.vn',
    [int]$Port = 3000,
    [string]$Tunnel = 'diemdanhso',
    [switch]$Login,
    [switch]$RouteOnly
)

$ErrorActionPreference = 'Stop'

$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (-not (Test-Path $cf)) {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cmd) { throw 'Khong tim thay cloudflared. Tai tai https://github.com/cloudflare/cloudflared/releases' }
    $cf = $cmd.Source
}

if ($Login) {
    Write-Host 'Mo trinh duyet de dang nhap Cloudflare va chon ten mien cdkg.vn...'
    & $cf tunnel login
    exit $LASTEXITCODE
}

# Tao tunnel neu chua co
$existing = (& $cf tunnel list 2>$null | Select-String -SimpleMatch $Tunnel)
if (-not $existing) {
    Write-Host "Tao tunnel '$Tunnel'..."
    & $cf tunnel create $Tunnel
}

if (-not $RouteOnly) {
    Write-Host "Tro DNS $Hostname -> tunnel '$Tunnel'..."
    & $cf tunnel route dns $Tunnel $Hostname
}

Write-Host ''
Write-Host "Dang chay tunnel: https://$Hostname  ->  http://localhost:$Port"
Write-Host 'Nhan Ctrl+C de dung. De chay nen, xem docs/HUONG-DAN-TRIEN-KHAI.md (phan Windows Service).'
& $cf tunnel run --url "http://localhost:$Port" $Tunnel
