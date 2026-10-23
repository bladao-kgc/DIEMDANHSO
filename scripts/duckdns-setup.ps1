# ============================================================================
#  Cập nhật tên miền miễn phí DuckDNS cho hệ thống Điểm danh số
#  Đoàn khoa Cơ khí - Trường Cao đẳng Kiên Giang
#
#  Cách dùng lần đầu (mở PowerShell tại thư mục dự án):
#    powershell -ExecutionPolicy Bypass -File .\scripts\duckdns-setup.ps1 -Token "TOKEN_CUA_BAN"
#
#  Token lấy tại: https://www.duckdns.org  (đăng nhập bằng Google/GitHub)
#  Tên miền đã tạo trên DuckDNS: ddskgc  ->  ddskgc.duckdns.org
#
#  Script sẽ:
#    1. Trỏ ddskgc.duckdns.org về IP công cộng hiện tại của mạng.
#    2. Lưu token vào %LOCALAPPDATA%\DDKSGC\duckdns.json (không đưa lên GitHub).
#    3. Tạo Scheduled Task cập nhật IP mỗi 5 phút (khi IP nhà mạng đổi).
# ============================================================================
param(
  [string]$Token = "",
  [string]$Domain = "ddskgc",
  [string]$LocalIp = "192.168.1.128",
  [int]$Port = 3000,
  [switch]$UpdateOnly,
  [switch]$NoTask
)

$ErrorActionPreference = "Stop"
$ConfigDir = Join-Path $env:LOCALAPPDATA "DDKSGC"
$ConfigFile = Join-Path $ConfigDir "duckdns.json"
$TaskName = "DDKSGC-DuckDNS-Update"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# ---------------------------------------------------------------------------
# Chế độ chạy tự động (Scheduled Task): đọc token đã lưu và cập nhật IP
# ---------------------------------------------------------------------------
if ($UpdateOnly) {
  if (-not (Test-Path $ConfigFile)) { Write-Host "Chua cau hinh DuckDNS."; exit 1 }
  $cfg = Get-Content $ConfigFile -Raw | ConvertFrom-Json
  $Token = $cfg.token
  $Domain = $cfg.domain
  $url = "https://www.duckdns.org/update?domains=$Domain&token=$Token&ip="
  try {
    $res = Invoke-RestMethod -Uri $url -TimeoutSec 20
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] DuckDNS: $res"
  } catch {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Loi cap nhat DuckDNS: $($_.Exception.Message)"
    exit 1
  }
  exit 0
}

# ---------------------------------------------------------------------------
# 1. Lấy token
# ---------------------------------------------------------------------------
if (-not $Token) {
  if (Test-Path $ConfigFile) {
    $cfg = Get-Content $ConfigFile -Raw | ConvertFrom-Json
    if ($cfg.token) { $Token = $cfg.token; if ($cfg.domain) { $Domain = $cfg.domain } }
  }
}
if (-not $Token) {
  Write-Host "Nhap token DuckDNS (lay tai https://www.duckdns.org):" -ForegroundColor Yellow
  $secure = Read-Host -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}
if (-not $Token) { Write-Host "Thieu token. Da huy." -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------------------
# 2. Cập nhật IP công cộng hiện tại
# ---------------------------------------------------------------------------
Write-Step "Dang tro $Domain.duckdns.org ve IP cong cong hien tai"
$url = "https://www.duckdns.org/update?domains=$Domain&token=$Token&ip="
$result = Invoke-RestMethod -Uri $url -TimeoutSec 20
if ($result -ne "OK") {
  Write-Host "DuckDNS tra ve: $result" -ForegroundColor Red
  Write-Host "Kiem tra lai token hoac ten mien '$Domain'." -ForegroundColor Yellow
  exit 1
}
Write-Host "DuckDNS: OK" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 3. Lưu cấu hình (chỉ trên máy này, KHÔNG commit lên GitHub)
# ---------------------------------------------------------------------------
if (-not (Test-Path $ConfigDir)) { New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null }
@{ token = $Token; domain = $Domain; updated_at = (Get-Date).ToString("o") } |
  ConvertTo-Json | Set-Content -Path $ConfigFile -Encoding UTF8
Write-Host "Da luu cau hinh: $ConfigFile"

# ---------------------------------------------------------------------------
# 4. Kiểm tra DNS công cộng
# ---------------------------------------------------------------------------
Write-Step "Kiem tra DNS $Domain.duckdns.org"
Start-Sleep -Seconds 3
try {
  $dns = Invoke-RestMethod -Uri "https://dns.google/resolve?name=$Domain.duckdns.org&type=A" -TimeoutSec 20
  $ips = @($dns.Answer | Where-Object { $_.type -eq 1 } | ForEach-Object { $_.data })
  if ($ips.Count -gt 0) {
    Write-Host "DNS hien tai: $($ips -join ', ')" -ForegroundColor Green
  } else {
    Write-Host "DNS chua co ban ghi A. Cho 1-2 phut roi kiem tra lai." -ForegroundColor Yellow
  }
} catch {
  Write-Host "Khong kiem tra duoc DNS: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# 5. Tạo Scheduled Task cập nhật IP mỗi 5 phút
# ---------------------------------------------------------------------------
if (-not $NoTask) {
  Write-Step "Tao Scheduled Task '$TaskName' (cap nhat IP moi 5 phut)"
  $scriptPath = $PSCommandPath
  $action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`" -UpdateOnly"
  $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
      -Description "Cap nhat IP cong cong cho ddskgc.duckdns.org" -Force | Out-Null
    Write-Host "Da tao Scheduled Task: $TaskName" -ForegroundColor Green
  } catch {
    Write-Host "Khong tao duoc Scheduled Task (co the can quyen Admin): $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Co the chay lai script bang PowerShell 'Run as administrator'." -ForegroundColor Yellow
  }
}

# ---------------------------------------------------------------------------
# 6. Hướng dẫn mở cổng router
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "================ VIEC CAN LAM TREN ROUTER ================" -ForegroundColor Cyan
Write-Host "1. Mo trinh duyet: http://192.168.1.1  (dang nhap router nha mang)"
Write-Host "2. Tim muc 'Port Forwarding' / 'Virtual Server' / 'NAT'"
Write-Host "3. Them quy tac:"
Write-Host "     - Cong ngoai (External Port): $Port"
Write-Host "     - Cong trong  (Internal Port): $Port"
Write-Host "     - IP may chu                : $LocalIp"
Write-Host "     - Giao thuc                 : TCP"
Write-Host "4. Luu lai, sau do truy cap: http://$Domain.duckdns.org:$Port"
Write-Host ""
Write-Host "Luu y:"
Write-Host " - Kiem tra IP may tinh bang: ipconfig  (muc IPv4 Address)"
Write-Host " - Neu IP may khac $LocalIp, chay lai script voi -LocalIp <IP dung>."
Write-Host " - DuckDNS mien phi chi ho tro HTTP; camera/QR van hoat dong binh thuong"
Write-Host "   tren trinh duyet, nhung mot so dien thoai co the can HTTPS."
Write-Host "   Khi can HTTPS on dinh, dung Cloudflare Tunnel (xem docs/HUONG-DAN-TRIEN-KHAI.md)."
Write-Host "==========================================================" -ForegroundColor Cyan
