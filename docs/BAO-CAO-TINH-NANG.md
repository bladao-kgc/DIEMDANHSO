# BÁO CÁO TÍNH NĂNG & HƯỚNG DẪN SỬ DỤNG

**Hệ thống Điểm danh số — Đoàn khoa Cơ khí, Trường Cao đẳng Kiên Giang**

- Link công khai (HTTPS): https://diemdanhsockkgc.tail0851f0.ts.net/
- Link nội bộ: http://localhost:3000
- Phiên bản báo cáo: 24/10/2026

---

## 1. Tổng quan hệ thống

| Hạng mục | Nội dung |
|---|---|
| Mục tiêu | Số hóa điểm danh hoạt động Đoàn và quản lý ngày Công tác xã hội (CTXH) |
| Đối tượng | Quản trị viên, Cán bộ Đoàn, Đoàn viên thanh niên |
| Nền tảng | Web app (React + TypeScript), chạy trên máy chủ nội bộ, truy cập qua HTTPS |
| Thiết bị | Máy tính, máy tính bảng, điện thoại (giao diện responsive) |
| Dữ liệu | `data/db.json` — sao lưu bằng cách copy file |

### Tài khoản & phân quyền

| Vai trò | Quyền chính |
|---|---|
| **ADMIN** (Bí thư) | Toàn quyền: cấp/sửa/khóa/xóa tài khoản, cấp lại mật khẩu, tạo hoạt động, mở/đóng QR, xem báo cáo, nhật ký, khôi phục dữ liệu mẫu |
| **CANBO** (Cán bộ Đoàn) | Tạo hoạt động, mở/đóng điểm danh QR, xem báo cáo & danh sách tham gia |
| **DVTN** (Đoàn viên) | Trang cá nhân, quét QR điểm danh, xem lịch sử ngày CTXH |

> Hệ thống tự xác định vai trò theo tài khoản sau khi đăng nhập — không cần chọn vai trò.

---

## 2. Đăng nhập

- **Tên đăng nhập:** họ tên viết tắt (chữ cái đầu, bỏ dấu) hoặc tên tài khoản/mã đoàn viên.
  - `Bành Lê Anh Đào` → `blad` (hoặc `bladao`)
  - `Trương Hoàng Trung Kha` → `thtk` (hoặc `thtkha`)
- **Mật khẩu mặc định:** `Kgc@2410`
- Nhập sai mật khẩu → báo lỗi; tài khoản bị khóa → chặn đăng nhập; tên viết tắt trùng nhiều người → yêu cầu dùng tên đầy đủ/mã ĐV.

---

## 3. Tính năng chi tiết

### 3.1. Quản lý tài khoản (ADMIN)

| Tính năng | Mô tả |
|---|---|
| Thêm đoàn viên | Tạo tài khoản mới, tự cấp tên đăng nhập từ họ tên |
| Chống trùng tên đăng nhập | Trùng họ tên hoặc trùng tên đã cấp → tự thêm hậu tố: `thtk` → `thtk.2` → `thtk.3` |
| Nhập hàng loạt | Dán danh sách CSV/Excel (Mã ĐV, Họ tên, Lớp…), xem trước, báo lỗi từng dòng |
| Khóa / mở khóa | Chặn đăng nhập tạm thời, không xóa dữ liệu |
| **Cấp lại mật khẩu** | Đưa mật khẩu về mặc định `Kgc@2410` (nút hình chìa khóa) |
| **Xóa tài khoản** | Xóa vĩnh viễn hồ sơ + mật khẩu + dữ liệu điểm danh liên quan (nút thùng rác). Không thể xóa tài khoản ADMIN hoặc tự xóa chính mình |
| Tìm kiếm / lọc | Theo họ tên, mã ĐV, email, lớp |
| Hiển thị tên đăng nhập | Cột riêng trong bảng quản lý để gửi thông tin cho đoàn viên |

### 3.2. Quản lý hoạt động (ADMIN, CANBO)

- Tạo hoạt động: tên, nội dung, địa điểm, thời gian, đơn vị tổ chức, mức ngày CTXH (0.25 → 10 ngày).
- Bật **xác minh GPS** (bán kính tùy chỉnh, mặc định quanh tọa độ trường).
- Bật **bắt buộc ảnh minh chứng** chụp trực tiếp bằng camera.
- Trạng thái: nháp / đã lên lịch / đang mở điểm danh / đã đóng / hoàn thành / hủy.

### 3.3. Điểm danh QR động (ADMIN, CANBO)

- Màn hình trình chiếu QR cho cả hội trường.
- **Mã QR tự đổi mỗi 30 giây**, chống chụp ảnh gửi cho người vắng mặt.
- Đếm ngược thời gian, đếm số lượt điểm danh hợp lệ theo thời gian thực.
- Hiển thị danh sách đoàn viên vừa điểm danh.
- Chế độ toàn màn hình khi trình chiếu.
- Mở/đóng phiên điểm danh bất kỳ lúc nào.

### 3.4. Điểm danh phía Đoàn viên (DVTN)

1. Đăng nhập → trang **Trang cá nhân**.
2. Nhấn **QUÉT MÃ QR ĐIỂM DANH NGAY** (hoặc nút QR trên thanh điều hướng dưới).
3. Cho phép trình duyệt dùng **camera** và **vị trí**.
4. Quét mã QR trên màn hình máy chiếu.
5. Hệ thống kiểm tra lần lượt:
   - mã QR còn hiệu lực (đúng phiên, chưa hết hạn);
   - tài khoản đang hoạt động, chưa điểm danh trùng;
   - GPS nằm trong bán kính cho phép (nếu hoạt động yêu cầu);
   - ảnh minh chứng chụp trực tiếp (nếu yêu cầu).
6. Thành công → cộng ngày CTXH và ghi vào lịch sử.

### 3.5. Trang cá nhân & lịch sử CTXH (DVTN)

- Thẻ thông tin: họ tên, mã ĐV, lớp, chi đoàn.
- Tổng ngày CTXH và tiến độ so với mục tiêu năm học (15 ngày).
- Danh sách hoạt động đang mở, sắp diễn ra, đã hoàn thành.
- Lịch sử từng giao dịch cộng ngày CTXH (thời gian, căn cứ, lũy kế).

### 3.6. Báo cáo & xuất dữ liệu (ADMIN, CANBO)

- Bảng điểm danh chi tiết: mã ĐV, họ tên, lớp, hoạt động, thời gian, ngày CTXH, GPS, ảnh minh chứng.
- Lọc theo hoạt động và lớp.
- **Xuất CSV UTF-8 BOM** mở trực tiếp bằng Excel, không lỗi dấu tiếng Việt.

### 3.7. Nhật ký & an toàn dữ liệu (ADMIN)

- Audit log ghi lại: đăng nhập, tạo tài khoản, nhập hàng loạt, khóa/mở, cấp lại mật khẩu, xóa tài khoản, tạo hoạt động, mở/đóng QR, điểm danh.
- Mật khẩu lưu dạng **scrypt + salt riêng từng tài khoản**, không bao giờ trả về trình duyệt.
- Khôi phục dữ liệu mẫu (dùng khi demo, không dùng khi đã có dữ liệu thật).

### 3.8. Tương thích thiết bị

| Thiết bị | Điều chỉnh |
|---|---|
| Điện thoại (< 640px) | Form đăng nhập 1 cột, thanh điều hướng dưới, bảng cuộn ngang, modal toàn chiều rộng, nút chạm ≥ 44px |
| Máy tính bảng (640–1023px) | Bố cục 2 cột cho thẻ/danh sách, điều hướng dưới, modal giới hạn chiều cao và cuộn trong |
| Máy tính (≥ 1024px) | Thanh menu ngang đầy đủ, lưới 4 cột KPI, bảng dữ liệu rộng, footer đầy đủ |

---

## 4. Hướng dẫn nhanh cho Đoàn viên (DVTN)

### Bước 1 — Mở hệ thống
Điện thoại → trình duyệt (Chrome/Safari) → mở:
**https://diemdanhsockkgc.tail0851f0.ts.net/**

### Bước 2 — Đăng nhập
- Tên đăng nhập: tên viết tắt do Đoàn khoa cấp (ví dụ `ck2401`) hoặc họ tên viết tắt.
- Mật khẩu: `Kgc@2410`.
- Nếu quên/không đăng nhập được: liên hệ Bí thư/Cán bộ Đoàn để **cấp lại mật khẩu**.

### Bước 3 — Điểm danh
1. Tại trang cá nhân, nhấn **QUÉT MÃ QR ĐIỂM DANH NGAY**.
2. Chọn **Cho phép** khi trình duyệt hỏi camera và vị trí.
3. Đưa camera về mã QR trên màn hình chiếu, giữ trong khung ngắm.
4. Hệ thống tự xác thực. Nếu được yêu cầu, chụp ảnh minh chứng và gửi.
5. Thấy thông báo **Điểm danh thành công** và số ngày CTXH được cộng.

### Bước 4 — Kiểm tra kết quả
- Vào **Lịch sử ngày CTXH** để xem giao dịch và tổng ngày đã tích lũy.
- Nếu chưa thấy cập nhật, kéo xuống để làm mới hoặc đăng xuất/đăng nhập lại.

### Lưu ý quan trọng
| Tình huống | Cách xử lý |
|---|---|
| Camera không mở | Dùng HTTPS (link trên), cấp quyền camera trong Cài đặt trình duyệt |
| Báo sai vị trí | Bật GPS, đứng gần địa điểm, chờ GPS ổn định 10–20 giây |
| Mã QR hết hạn | Quét lại mã mới (mã đổi mỗi 30 giây) |
| Báo đã điểm danh | Mỗi hoạt động chỉ ghi nhận 1 lần |
| Tài khoản bị khóa | Liên hệ Văn phòng Đoàn khoa |
| Sai tên đăng nhập | Dùng mã đoàn viên (ví dụ `CK2401`) hoặc liên hệ cán bộ |

### Bảo mật
- Không chia sẻ mật khẩu hoặc mã QR cho người khác.
- Đổi mật khẩu sau khi nhận tài khoản (đề xuất bổ sung ở phiên bản tiếp theo).
- Mọi thao tác đều được ghi nhật ký.

---

## 5. Kiểm thử đã thực hiện

| Hạng mục | Kết quả |
|---|---|
| Đăng nhập `blad`, `thtkha`, `ck2401` + `Kgc@2410` | ✅ Đúng vai trò ADMIN / CANBO / DVTN |
| Sai mật khẩu / mật khẩu trống | ✅ 401 / 400 |
| Tài khoản bị khóa | ✅ 403 |
| Trùng tên viết tắt | ✅ 409, yêu cầu dùng tên đầy đủ |
| Tạo tài khoản trùng họ tên | ✅ Cấp `thtk.2`, đăng nhập được |
| Cấp lại mật khẩu | ✅ Về `Kgc@2410`, đăng nhập lại được |
| Xóa tài khoản | ✅ Không đăng nhập được nữa, dữ liệu điểm danh được dọn |
| Chặn tự xóa / xóa ADMIN | ✅ 400 |
| Type-check TypeScript | ✅ Không lỗi |
| Build production | ✅ Thành công |
| Truy cập công khai HTTPS | ✅ HTTP 200, đăng nhập OK |
| Hợp nhất file lỗi (merge conflict) | ✅ Đã xử lý |

---

## 6. Hạn chế & khuyến nghị

1. **Chưa có đổi mật khẩu tự phục vụ** — hiện ADMIN cấp lại về mặc định. Nên bổ sung trong phiên bản sau.
2. **Một máy chủ duy nhất** — nên sao lưu `data/db.json` hằng ngày và đặt máy chủ ở nơi có điện/nhiệt độ ổn định.
3. **Link Tailscale phụ thuộc máy bật** — nếu tắt laptop, web ngừng hoạt động. Có thể chuyển lên VPS khi số lượng dùng tăng.
4. **Ảnh minh chứng lưu trong file dữ liệu** — dữ liệu lớn dần; nên chuyển sang lưu file/thư mục riêng khi dùng thường xuyên.
5. **Chưa có thông báo tự động** (Zalo/Email) — nên bổ sung nhắc lịch hoạt động.

---

*Báo cáo được tổng hợp tự động từ mã nguồn và kết quả kiểm thử ngày 24/10/2026.*
