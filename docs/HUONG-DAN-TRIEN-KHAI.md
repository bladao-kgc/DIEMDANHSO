# HƯỚNG DẪN TRIỂN KHAI — ĐIỂM DANH SỐ

Hệ thống điểm danh QR động của Đoàn khoa Cơ khí – CĐ Kiên Giang.
Repo: https://github.com/bladao-kgc/DIEMDANHSO

---

## 0. Trạng thái hiện tại (đã làm sẵn)

| Hạng mục | Trạng thái |
|---|---|
| Clone mã nguồn | ✅ `D:\CHUYENDOISO2026\DIEMDANHSO` |
| Cài dependencies | ✅ `node_modules` |
| Build production | ✅ `dist/` + `server.js` |
| Chạy thử | ✅ `http://localhost:3000` (API trả HTTP 200) |
| Đăng nhập thử | ✅ tài khoản `bladao` (ADMIN) |
| Dữ liệu | 📄 `data/db.json` (file JSON, tự lưu khi có thay đổi) |

> **Lưu ý quan trọng về tên miền:** `diemdanhso.cokhi.cdkg.vn` hiện **chưa tồn tại trên DNS công cộng**
> (kiểm tra bằng 8.8.8.8 và DNS của router FPT đều trả về *NXDOMAIN*, kể cả tên miền gốc `cdkg.vn`).
> Vì vậy muốn có địa chỉ thật `https://diemdanhso.cokhi.cdkg.vn` truy cập từ bất kỳ đâu thì **bắt buộc**
> phải làm Phần 2A (đăng ký tên miền + Cloudflare). Không có cách nào khác nếu chưa sở hữu tên miền.

---

## 1. Chạy web trên máy này (bắt buộc, làm trước)

### Bước 1.1 — Mở PowerShell tại thư mục dự án

```powershell
cd D:\CHUYENDOISO2026\DIEMDANHSO
```

### Bước 1.2 — Chạy web (bản production)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

Script sẽ tự: cài dependency nếu thiếu → build nếu chưa có → tắt bản cũ trên cổng 3000 → chạy nền.

Kết quả mong đợi:

```
OK: web is running on port 3000 (API HTTP 200)
Local URL : http://localhost:3000
```

### Bước 1.3 — Kiểm tra

Mở trình duyệt: <http://localhost:3000>

- Đăng nhập quản trị: `bladao` (Bành Lê Anh Đào – Bí thư Đoàn khoa)
- Đăng nhập đoàn viên (demo): `ck2401`, `ck2402`, `ck24ot3412`…

### Bước 1.4 — Dừng web

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-web.ps1
```

> Xem log: `logs\web-3000.out.log` và `logs\web-3000.err.log`

---

## 2. Đưa web lên tên miền `diemdanhso.cokhi.cdkg.vn`

Chọn **một** trong ba cách dưới đây.

### 2A. Tên miền thật, truy cập từ Internet (khuyến nghị)

Cần chuẩn bị (việc của bạn, mất ~10–30 phút + phí tên miền):

1. **Sở hữu tên miền `cdkg.vn`.** Nếu chưa có, đăng ký tại nhà đăng ký .VN (iNET, Vietnix, Mắt Bão, PA Việt Nam…).
   Giá tham khảo khoảng 500.000 – 800.000 đ/năm. Cần CCCD/tổ chức để làm thủ tục VNNIC.
2. **Có tài khoản Cloudflare (miễn phí)** tại <https://dash.cloudflare.com/sign-up>.

#### Bước 2A.1 — Add tên miền vào Cloudflare

1. Đăng nhập Cloudflare → **Add a site** → nhập `cdkg.vn` → chọn gói **Free**.
2. Cloudflare cho 2 dòng nameserver, ví dụ:
   ```
   kai.ns.cloudflare.com
   lia.ns.cloudflare.com
   ```
3. Vào trang quản trị của nhà đăng ký tên miền → **đổi Nameserver (DNS)** sang đúng 2 dòng trên.
4. Chờ 5 phút – 24 giờ đến khi Cloudflare báo **Active** (trạng thái xanh).

Kiểm tra nhanh:

```powershell
Resolve-DnsName -Name cdkg.vn -Type NS -Server 8.8.8.8
```

Phải thấy `*.ns.cloudflare.com`.

#### Bước 2A.2 — Đăng nhập cloudflared (máy đã cài sẵn cloudflared 2026.10.3)

```powershell
cd D:\CHUYENDOISO2026\DIEMDANHSO
powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-tunnel.ps1 -Login
```

Trình duyệt mở ra → chọn tên miền `cdkg.vn` → **Authorize**. File chứng chỉ được lưu ở
`%USERPROFILE%\.cloudflared\cert.pem`.

#### Bước 2A.3 — Tạo tunnel + trỏ DNS + chạy

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-tunnel.ps1
```

Script tự động:
- tạo tunnel tên `diemdanhso` (nếu chưa có),
- tạo bản ghi CNAME `diemdanhso.cokhi.cdkg.vn` → tunnel,
- chạy cầu nối `https://diemdanhso.cokhi.cdkg.vn` → `http://localhost:3000`.

Mở <https://diemdanhso.cokhi.cdkg.vn> để kiểm tra. HTTPS do Cloudflare cấp tự động (miễn phí).

> Nếu tên miền chính bạn muốn dùng là `diemdanhso.cdkg.vn` (không có `cokhi`), thêm `-Hostname diemdanhso.cdkg.vn`.

#### Bước 2A.4 — Chạy tunnel nền, tự khởi động cùng Windows (cần Administrator)

Cách nhanh — dùng Task Scheduler, mở PowerShell **Run as Administrator**:

```powershell
$root = 'D:\CHUYENDOISO2026\DIEMDANHSO'
schtasks /Create /TN "DIEMDANHSO Web" /SC ONSTART /RL HIGHEST /F `
  /TR "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$root\scripts\start-web.ps1`" -Port 3000"
schtasks /Create /TN "DIEMDANHSO Tunnel" /SC ONSTART /RL HIGHEST /F `
  /TR "`"C:\Program Files (x86)\cloudflared\cloudflared.exe`" tunnel run --url http://localhost:3000 diemdanhso"
```

Khởi động lại máy và kiểm tra lại bằng trình duyệt.

Cách chuẩn production — cài cloudflared thành Windows Service:

```powershell
# 1. Tạo tunnel điều khiển từ xa trên Dashboard: Zero Trust > Networks > Tunnels > Create a tunnel
# 2. Copy token, rồi chạy (Admin):
cloudflared service install <TOKEN>
# 3. Trong Dashboard, thêm Public Hostname:
#    Subdomain: diemdanhso.cokhi   Domain: cdkg.vn   Service: http://localhost:3000
```

Sau đó tunnel tự chạy cùng Windows, không cần mở cửa sổ nào.

---

### 2B. Chỉ dùng tên miền trên **máy này** (không cần Internet, không cần mua tên miền)

Cách này sửa file `hosts` để máy tự hiểu `diemdanhso.cokhi.cdkg.vn = 127.0.0.1`.

#### Bước 2B.1 — Chạy web ở cổng 80

```powershell
cd D:\CHUYENDOISO2026\DIEMDANHSO
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1 -Port 80
```

> Nếu cổng 80 bị chiếm (IIS, Skype, http.sys), xem Phần 4.

#### Bước 2B.2 — Thêm bản ghi hosts

Chuột phải `scripts\setup-hosts-domain.bat` → **Run as administrator**.

#### Bước 2B.3 — Kiểm tra

Mở <http://diemdanhso.cokhi.cdkg.vn> — chỉ hoạt động trên đúng máy tính này.

---

### 2C. Truy cập trong mạng LAN bằng IP (nhanh nhất, không cần tên miền)

1. Chạy web: `.\scripts\start-web.ps1` (mặc định cổng 3000, đã lắng nghe `0.0.0.0`).
2. Cho phép tường lửa (PowerShell **Run as Administrator**):

```powershell
New-NetFirewallRule -DisplayName "DIEMDANHSO 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

3. Lấy IP máy chủ:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' }
```

4. Điện thoại/máy khác **cùng Wi-Fi** mở: `http://192.168.1.128:3000`

> IP này có thể đổi khi router cấp lại DHCP. Nên đặt IP tĩnh cho máy chủ trong router (DHCP Reservation).
> Lưu ý: tính năng camera/GPS của trình duyệt chỉ chạy trên **HTTPS** hoặc `localhost`.
> Dùng IP LAN qua HTTP thì điện thoại có thể chặn camera → nên dùng 2A (Cloudflare có HTTPS) khi điểm danh thật.

---

## 3. Sao lưu & cập nhật

### 3.1 — Sao lưu dữ liệu (quan trọng)

Toàn bộ dữ liệu nằm trong **một file**: `data\db.json`

```powershell
cd D:\CHUYENDOISO2026\DIEMDANHSO
Copy-Item .\data\db.json ".\data\db-backup-$(Get-Date -Format yyyyMMdd-HHmm).json"
```

Nên sao lưu định kỳ (Task Scheduler hằng ngày) hoặc copy lên Google Drive.

### 3.2 — Cập nhật code mới từ GitHub

```powershell
cd D:\CHUYENDOISO2026\DIEMDANHSO
git pull
npm install --no-audit --no-fund
powershell -ExecutionPolicy Bypass -File .\scripts\stop-web.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

Dữ liệu trong `data\db.json` **không** bị Git ghi đè (trừ khi bạn `git checkout` file đó).

---

## 4. Kiểm tra & xử lý sự cố

| Triệu chứng | Cách xử lý |
|---|---|
| `start-web.ps1` báo FAILED | Xem `logs\web-3000.err.log`; chạy `npm run build` xem lỗi |
| Cổng bị chiếm | `Get-NetTCPConnection -LocalPort 80 -State Listen` → đổi cổng hoặc tắt dịch vụ đang giữ |
| Trang trắng / 404 | Chưa build: chạy `npm run build` rồi khởi động lại |
| Tên miền chưa vào được (2A) | `Resolve-DnsName diemdanhso.cokhi.cdkg.vn -Server 1.1.1.1` phải ra CNAME `*.cfargotunnel.com` |
| Tunnel báo lỗi 1033 | Tunnel chưa chạy hoặc hostname chưa route: chạy lại `cloudflare-tunnel.ps1 -RouteOnly` rồi khởi động tunnel |
| Camera không mở trên điện thoại | Phải dùng HTTPS (2A) hoặc `localhost`; HTTP qua IP sẽ bị chặn |
| GPS sai vị trí | Kiểm tra quyền vị trí của trình duyệt; bán kính mặc định 150 m quanh toạ độ hoạt động |
| Quên mật khẩu/đăng nhập | Hệ thống đăng nhập bằng mã đoàn viên/email/username, không dùng mật khẩu; ADMIN: `bladao` |

### Kiểm tra nhanh toàn hệ thống bằng API

```powershell
Invoke-RestMethod http://localhost:3000/api/stats/dashboard | ConvertTo-Json
```

---

## 5. Tóm tắt nhanh (cheat sheet)

```powershell
cd D:\CHUYENDOISO2026\DIEMDANHSO

# Chạy web
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1     # cổng 3000
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1 -Port 80

# Dừng web
powershell -ExecutionPolicy Bypass -File .\scripts\stop-web.ps1

# Tên miền thật (Cloudflare)
powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-tunnel.ps1 -Login   # 1 lần
powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-tunnel.ps1          # mỗi lần chạy

# Tên miền chỉ trên máy này
#   (Run as administrator) scripts\setup-hosts-domain.bat

# Sao lưu dữ liệu
Copy-Item .\data\db.json ".\data\db-backup-$(Get-Date -Format yyyyMMdd-HHmm).json"
```
