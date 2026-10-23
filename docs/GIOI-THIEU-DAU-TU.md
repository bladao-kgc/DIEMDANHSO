# GIỚI THIỆU DỰ ÁN — ĐIỂM DANH SỐ

**Số hóa điểm danh hoạt động Đoàn và quản lý ngày Công tác xã hội cho trường cao đẳng, trung cấp, đại học**

- Phiên bản tài liệu: 24/10/2026
- Đơn vị khởi tạo: Đoàn khoa Cơ khí — Trường Cao đẳng Kiên Giang
- Sản phẩm đang chạy thật: https://diemdanhsockkgc.tail0851f0.ts.net/

---

## 1. Vấn đề

Các hoạt động Đoàn — Hội ở trường hiện được điểm danh bằng **giấy ký tay** hoặc **Google Form**. Cách làm này bộc lộ nhiều điểm yếu:

| Vấn đề | Hệ quả |
|---|---|
| Điểm danh giấy, ký thay | Không kiểm chứng được người tham gia thật; sai lệch số liệu |
| Sổ sách phân tán | Mỗi chi đoàn giữ một file Excel riêng, khó tổng hợp toàn khoa/trường |
| Cộng ngày CTXH thủ công | Mất hàng chục giờ mỗi học kỳ; dễ cộng sai, cộng trùng |
| Không có bằng chứng | Không lưu ảnh, vị trí, thời điểm để đối chiếu khi xét danh hiệu |
| Báo cáo chậm | Cán bộ phải gõ lại số liệu, thường trễ hạn báo cáo cấp trên |
| Không minh bạch | Đoàn viên không tự kiểm tra được số ngày CTXH của mình |

Quy mô: mỗi khoa có **300–1.500 đoàn viên**, mỗi năm **20–60 hoạt động**. Một trường cao đẳng có 8–15 khoa tương tự. Toàn quốc có hơn **1.800 cơ sở giáo dục nghề nghiệp và cao đẳng/đại học**.

---

## 2. Giải pháp

**Điểm danh số** là một web app chạy trên máy chủ nhỏ (laptop/PC của Đoàn khoa hoặc VPS), truy cập bằng trình duyệt trên **máy tính, máy tính bảng, điện thoại** — không cần cài app.

### Luồng hoạt động cốt lõi

```
Cán bộ tạo hoạt động
        ↓
Chiếu mã QR động lên màn hình hội trường (đổi mỗi 30 giây)
        ↓
Đoàn viên quét QR bằng điện thoại
        ↓
Hệ thống xác thực: phiên điểm danh + tài khoản + GPS + ảnh minh chứng
        ↓
Cộng ngày CTXH tự động, ghi lịch sử, cập nhật báo cáo realtime
```

### Điểm khác biệt

| Tiêu chí | Giấy / Google Form | Điểm danh số |
|---|---|---|
| Chống điểm danh hộ | Không | QR động 30 giây + GPS + ảnh trực tiếp |
| Thời gian tổng hợp | 1–3 ngày/hoạt động | Tức thời |
| Cộng ngày CTXH | Thủ công | Tự động, có lịch sử từng giao dịch |
| Báo cáo | Gõ lại Excel | Xuất CSV UTF-8 mở thẳng bằng Excel |
| Minh bạch | Không | Đoàn viên tự xem số ngày tích lũy |
| Chi phí vận hành | In ấn, công sức | Gần 0 đồng (chạy trên máy sẵn có) |
| Triển khai | — | Trong 10 phút, không cần hạ tầng đám mây |

---

## 3. Sản phẩm đã có gì (không phải ý tưởng)

Hệ thống **đang chạy thật** tại Đoàn khoa Cơ khí, CĐ Kiên Giang:

- Đăng nhập bằng tên viết tắt/mã đoàn viên + mật khẩu, tự phân quyền ADMIN / CANBO / DVTN.
- Quản lý tài khoản: thêm, nhập hàng loạt CSV, khóa/mở, **cấp lại mật khẩu**, **xóa tài khoản**.
- Tạo hoạt động với mức ngày CTXH, bán kính GPS, yêu cầu ảnh minh chứng.
- Màn hình QR trình chiếu, mã đổi 30 giây, đếm lượt điểm danh realtime.
- Trang đoàn viên: tiến độ CTXH, hoạt động đang mở, lịch sử giao dịch.
- Báo cáo lọc theo hoạt động/lớp, xuất CSV.
- Nhật ký thao tác (audit log) đầy đủ.
- Giao diện responsive cho điện thoại, máy tính bảng, máy tính.
- Truy cập công khai qua HTTPS, dùng được trên mọi Wi-Fi/4G.

**Công nghệ:** React + TypeScript + Tailwind (giao diện), Node.js/Express (máy chủ), lưu trữ JSON file (dễ sao lưu, không cần cài database), mã hóa mật khẩu scrypt + salt riêng từng tài khoản, QR động ký phiên.

---

## 4. Thị trường & khách hàng

### Khách hàng mục tiêu

1. **Đoàn Thanh niên cấp khoa** (người dùng trực tiếp) — 3.000–5.000 khoa trên toàn quốc.
2. **Đoàn trường / Phòng Công tác Sinh viên** — cần báo cáo tổng hợp toàn trường.
3. **Trung tâm/Đơn vị tổ chức hoạt động tình nguyện** — cần quản lý hàng nghìn lượt tham gia.

### Quy mô

- ~1.800 cơ sở GDNN + CĐ/ĐH trên cả nước (nguồn: Bộ GD&ĐT, Tổng cục GDNN).
- Mỗi trường 8–15 khoa → **~20.000 đơn vị cấp khoa** có nhu cầu.
- Mỗi đơn vị trả 2–5 triệu đồng/năm → thị trường tiềm năng **40–100 tỷ đồng/năm** ở Việt Nam.
- Mở rộng sang Lào, Campuchia và các nước có mô hình Đoàn/Hội tương tự.

### Lợi thế cạnh tranh

- **Hiểu nghiệp vụ Đoàn** (ngày CTXH, chi đoàn, xét danh hiệu) — sản phẩm đại trà như Google Form không có.
- **Chi phí triển khai cực thấp**, chạy trên máy có sẵn, không phụ thuộc cloud nước ngoài.
- **Dữ liệu tại chỗ** — phù hợp yêu cầu bảo mật của trường công lập.
- **Đã có khách hàng đầu tiên** và quy trình vận hành thực tế.

---

## 5. Mô hình doanh thu

| Gói | Đối tượng | Giá tham khảo | Nội dung |
|---|---|---|---|
| **Miễn phí** | 1 khoa dùng thử | 0 đ | Đầy đủ tính năng, tối đa 100 đoàn viên |
| **Khoa** | 1 khoa | 2.000.000 đ/năm | Không giới hạn đoàn viên, hỗ trợ Zalo |
| **Trường** | Toàn trường | 15.000.000 – 30.000.000 đ/năm | Nhiều khoa, báo cáo tổng hợp, tài khoản quản trị cấp trường |
| **Dịch vụ triển khai** | Trường/nhà tài trợ | 3.000.000 – 10.000.000 đ/lần | Cài đặt máy chủ, tên miền, đào tạo cán bộ |
| **Tài trợ / học bổng số** | Doanh nghiệp | Thỏa thuận | Logo nhà tài trợ trong app, báo cáo tác động xã hội |

Ngoài ra có thể bán **gói dữ liệu tổng hợp ẩn danh** (thống kê hoạt động tình nguyện) cho đơn vị nghiên cứu — cần tuân thủ quy định dữ liệu cá nhân.

---

## 6. Lộ trình phát triển

| Giai đoạn | Thời gian | Mục tiêu |
|---|---|---|
| **0 — Đã xong** | Hiện tại | Sản phẩm chạy thật 1 khoa, đầy đủ điểm danh QR/GPS/ảnh, báo cáo, phân quyền |
| **1 — Chuẩn hóa** | 1–3 tháng | Đổi mật khẩu tự phục vụ; sao lưu tự động; Dashboard cấp trường; App PWA cài lên điện thoại |
| **2 — Mở rộng** | 3–9 tháng | Multi-tenant (nhiều trường trên một hệ thống); thông báo Zalo/Email; chữ ký số minh chứng |
| **3 — Thương mại** | 9–18 tháng | Bán gói cho 20–50 trường; tích hợp cổng báo cáo của Tỉnh đoàn; mở rộng Đông Nam Á |

---

## 7. Đội ngũ

- **Đoàn khoa Cơ khí — CĐ Kiên Giang:** đội ngũ vận hành, am hiểu nghiệp vụ Đoàn, đang dùng sản phẩm hằng ngày.
- **Đội phát triển:** xây dựng toàn bộ sản phẩm từ đầu (giao diện, máy chủ, bảo mật, triển khai).
- **Cố vấn:** Ban Chấp hành Đoàn trường, giảng viên Công nghệ thông tin.

Điểm mạnh: đội ngũ **vừa là người dùng, vừa là người phát triển** — mọi tính năng xuất phát từ nhu cầu thật, được kiểm chứng ngay trong hoạt động thực tế.

---

## 8. Rủi ro & cách giảm thiểu

| Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|
| Phụ thuộc một máy chủ cá nhân | Cao | Chuyển lên VPS 100–200k/tháng khi có từ 2 trường; sao lưu tự động |
| Dữ liệu cá nhân (ảnh, GPS) | Cao | Chỉ thu khi hoạt động yêu cầu; mã hóa khi lưu; chính sách xóa dữ liệu |
| Đoàn viên không có smartphone | Trung bình | Cán bộ điểm danh hộ có ghi nhận + ảnh; nhập tay có kiểm soát |
| Cạnh tranh từ ứng dụng lớn | Trung bình | Tập trung nghiệp vụ Đoàn, giá thấp, hỗ trợ tiếng Việt tận nơi |
| Phụ thuộc nhân sự | Trung bình | Tài liệu hóa; đào tạo 2–3 cán bộ nòng cốt mỗi trường |
| Thay đổi quy chế CTXH | Thấp | Cấu hình mức ngày theo hoạt động, không hard-code |

---

## 9. Lời kêu gọi

Chúng tôi đang tìm:

1. **Nhà đầu tư hạt giống (pre-seed) 300–500 triệu đồng** để:
   - Chuyển hệ thống lên hạ tầng đám mây ổn định;
   - Hoàn thiện multi-tenant phục vụ 20–50 trường;
   - Xây app PWA, tích hợp Zalo;
   - Đội ngũ 2 lập trình viên + 1 chuyên viên nghiệp vụ trong 12 tháng.
2. **Đối tác trường học** dùng thử miễn phí 1 học kỳ, đổi lại cung cấp phản hồi và số liệu tác động.
3. **Nhà tài trợ** đồng hành cùng hoạt động tình nguyện của sinh viên.

### Chỉ số cam kết trong 12 tháng

| Chỉ số | Mục tiêu |
|---|---|
| Trường dùng thật | 10–20 trường |
| Đoàn viên trên hệ thống | 20.000–50.000 |
| Doanh thu | 300–600 triệu đồng |
| Thời gian tổng hợp báo cáo giảm | ≥ 90% |

---

## 10. Liên hệ

- Đơn vị: Đoàn khoa Cơ khí — Trường Cao đẳng Kiên Giang
- Sản phẩm demo: https://diemdanhsockkgc.tail0851f0.ts.net/
- Mã nguồn: https://github.com/bladao-kgc/DIEMDANHSO
- Tài liệu kỹ thuật: `docs/HUONG-DAN-TRIEN-KHAI.md`
- Báo cáo tính năng: `docs/BAO-CAO-TINH-NANG.md`

> *“Mỗi ngày tình nguyện được ghi nhận đúng — mỗi đoàn viên được ghi nhận xứng đáng.”*
