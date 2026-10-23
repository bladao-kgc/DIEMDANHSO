import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import type { 
  UserProfile, 
  Activity, 
  QRSession, 
  Attendance, 
  PointTransaction, 
  AuditLog, 
  DashboardStats 
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Khi chạy bằng tsx (src/server) hay bằng bundle (server.js) đều phải dùng
// thư mục data của chính dự án, không phụ thuộc vị trí file đang chạy.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// KGC Campus Coordinates (Cơ sở 425 Mạc Cửu, P. Vĩnh Thanh, TP. Rạch Giá, Kiên Giang)
export const KGC_DEFAULT_LAT = 10.01254;
export const KGC_DEFAULT_LNG = 105.08092;

// Mật khẩu mặc định cấp cho mọi tài khoản Đoàn viên / Cán bộ
export const DEFAULT_PASSWORD = 'Kgc@2410';

// Bỏ dấu tiếng Việt để so khớp tên viết tắt (vd: "Bành Lê Anh Đào" -> "Banh Le Anh Dao")
const removeDiacritics = (value: string): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

// Chuẩn hóa khóa đăng nhập: bỏ dấu, bỏ khoảng trắng, dấu chấm, gạch nối...
const normalizeKey = (value: string): string =>
  removeDiacritics(value).toLowerCase().replace(/[^a-z0-9]/g, '');

// Tên viết tắt theo chữ cái đầu: "Bành Lê Anh Đào" -> "blad"
const initialsKey = (fullName: string): string =>
  normalizeKey(
    String(fullName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => removeDiacritics(word).charAt(0))
      .join('')
  );

interface StoredCredential {
  salt: string;
  hash: string;
  updated_at: string;
}

interface DatabaseSchema {
  profiles: UserProfile[];
  activities: Activity[];
  qr_sessions: Record<string, QRSession>; // key: activity_id
  attendances: Attendance[];
  point_transactions: PointTransaction[];
  audit_logs: AuditLog[];
  credentials?: Record<string, StoredCredential>; // key: user_id (không bao giờ trả về client)
  last_updated: string;
}

// Official DVTN accounts from Đoàn khoa Cơ khí - Cao đẳng Kiên Giang
const SEED_STUDENTS: Omit<UserProfile, 'created_at'>[] = [
  { id: 'usr-dv01', code: 'CK24OT3412', full_name: 'Trương Hoàng Trung Kha', email: 'trungkha1105@gmail.com', username: 'ck24ot3412', role: 'DVTN', class_name: 'CN ÔTÔ 3 9+K5', branch_name: 'Chi đoàn 9+K5 - CN ÔTÔ 3', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 12.0, phone: '0912345601' },
  { id: 'usr-dv02', code: 'CK24KL3135', full_name: 'Danh Minh Trí', email: 'mt9022125@gmail.com', username: 'ck24kl3135', role: 'DVTN', class_name: 'CGKL 9+K5', branch_name: 'Chi đoàn 9+K5 - CGKL', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 10.5, phone: '0912345602' },
  { id: 'usr-dv03', code: 'CK24OT3319', full_name: 'Bùi Vĩ Khiêm', email: 'bvkhiem.ot305@kgc.edu.vn', username: 'ck24ot3319', role: 'DVTN', class_name: 'CN ÔTÔ 3 9+K5', branch_name: 'Chi đoàn 9+K5 - CN ÔTÔ 3', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 14.0, phone: '0912345603' },
  { id: 'usr-dv04', code: 'CX26OT2208', full_name: 'Nguyễn Minh Hiếu', email: 'nmhieu.ot220@kgc.edu.vn', username: 'cx26ot2208', role: 'DVTN', class_name: 'CN ÔTÔ 2 K20', branch_name: 'Chi đoàn K20 - CN ÔTÔ 2', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 8.5, phone: '0912345604' },
  { id: 'usr-dv05', code: 'CK26LTOT53', full_name: 'Phạm Chí Nghĩa', email: 'phamnghianps2008@gmail.com', username: 'ck26ltot53', role: 'DVTN', class_name: 'CN ÔTÔ 2 9+K4 (LT)', branch_name: 'Chi đoàn 9+K4 - CN ÔTÔ 2 (LT)', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 11.0, phone: '0912345605' },
  { id: 'usr-ck06', code: 'CK2401', full_name: 'Huỳnh Đức Trọng', email: 'trong.ck2401@kgc.edu.vn', username: 'ck2401', role: 'DVTN', class_name: 'CĐ CKT K24', branch_name: 'Chi đoàn CĐ Cơ kỹ thuật K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 9.0, phone: '0912345606' },
  { id: 'usr-ck07', code: 'CK2402', full_name: 'Đặng Gia Huy', email: 'huy.ck2402@kgc.edu.vn', username: 'ck2402', role: 'DVTN', class_name: 'CĐ OTO K24', branch_name: 'Chi đoàn CĐ Công nghệ Ô tô K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 15.5, phone: '0912345607' },
  { id: 'usr-ck08', code: 'CK2403', full_name: 'Lâm Thảo My', email: 'my.ck2403@kgc.edu.vn', username: 'ck2403', role: 'DVTN', class_name: 'CĐ OTO K24', branch_name: 'Chi đoàn CĐ Công nghệ Ô tô K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 13.0, phone: '0912345608' },
  { id: 'usr-ck09', code: 'CK2404', full_name: 'Bùi Quốc Bảo', email: 'bao.ck2404@kgc.edu.vn', username: 'ck2404', role: 'DVTN', class_name: 'CĐ OTO K24', branch_name: 'Chi đoàn CĐ Công nghệ Ô tô K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 7.5, phone: '0912345609' },
  { id: 'usr-ck10', code: 'CK2405', full_name: 'Trương Ngọc Hân', email: 'han.ck2405@kgc.edu.vn', username: 'ck2405', role: 'DVTN', class_name: 'CĐ DCN K24', branch_name: 'Chi đoàn CĐ Điện công nghiệp K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 6.0, phone: '0912345610' },
  { id: 'usr-ck11', code: 'CK2406', full_name: 'Nguyễn Thành Danh', email: 'danh.ck2406@kgc.edu.vn', username: 'ck2406', role: 'DVTN', class_name: 'CĐ CKM K24', branch_name: 'Chi đoàn CĐ Cơ khí chế tạo K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 4.5, phone: '0912345611' },
  { id: 'usr-ck12', code: 'CK2407', full_name: 'Đỗ Thanh Tùng', email: 'tung.ck2407@kgc.edu.vn', username: 'ck2407', role: 'DVTN', class_name: 'CĐ CKM K24', branch_name: 'Chi đoàn CĐ Cơ khí chế tạo K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 5.0, phone: '0912345612' },
  { id: 'usr-ck13', code: 'CK2408', full_name: 'Phan Thúy Kiều', email: 'kieu.ck2408@kgc.edu.vn', username: 'ck2408', role: 'DVTN', class_name: 'CĐ CKT K24', branch_name: 'Chi đoàn CĐ Cơ kỹ thuật K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 3.5, phone: '0912345613' },
  { id: 'usr-ck14', code: 'CK2409', full_name: 'Dương Hải Đăng', email: 'dang.ck2409@kgc.edu.vn', username: 'ck2409', role: 'DVTN', class_name: 'CĐ CKT K24', branch_name: 'Chi đoàn CĐ Cơ kỹ thuật K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 4.0, phone: '0912345614' },
  { id: 'usr-ck15', code: 'CK2410', full_name: 'Lý Quốc Hưng', email: 'hung.ck2410@kgc.edu.vn', username: 'ck2410', role: 'DVTN', class_name: 'CĐ OTO K24', branch_name: 'Chi đoàn CĐ Công nghệ Ô tô K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 2.5, phone: '0912345615' },
  { id: 'usr-ck16', code: 'CK2411', full_name: 'Vũ Ngọc Diệp', email: 'diep.ck2411@kgc.edu.vn', username: 'ck2411', role: 'DVTN', class_name: 'CĐ OTO K24', branch_name: 'Chi đoàn CĐ Công nghệ Ô tô K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 5.5, phone: '0912345616' },
  { id: 'usr-ck17', code: 'CK2412', full_name: 'Mai Văn Hòa', email: 'hoa.ck2412@kgc.edu.vn', username: 'ck2412', role: 'DVTN', class_name: 'CĐ DCN K24', branch_name: 'Chi đoàn CĐ Điện công nghiệp K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 3.0, phone: '0912345617' },
  { id: 'usr-ck18', code: 'CK2413', full_name: 'Tạ Hoàng Nam', email: 'nam.ck2413@kgc.edu.vn', username: 'ck2413', role: 'DVTN', class_name: 'CĐ DCN K24', branch_name: 'Chi đoàn CĐ Điện công nghiệp K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 2.0, phone: '0912345618' },
  { id: 'usr-ck19', code: 'CK2414', full_name: 'Đoàn Cẩm Tú', email: 'tu.ck2414@kgc.edu.vn', username: 'ck2414', role: 'DVTN', class_name: 'CĐ CTD K24', branch_name: 'Chi đoàn CĐ Chế tạo Dụng cụ K24', unit: 'Đoàn khoa Cơ khí', status: 'active', total_ctxh_days: 4.5, phone: '0912345619' },
  { id: 'usr-ck20', code: 'CK2415', full_name: 'Cao Nhật Minh', email: 'minh.ck2415@kgc.edu.vn', username: 'ck2415', role: 'DVTN', class_name: 'CĐ CTD K24', branch_name: 'Chi đoàn CĐ Chế tạo Dụng cụ K24', unit: 'Đoàn khoa Cơ khí', status: 'locked', total_ctxh_days: 1.0, phone: '0912345620' },
];

export const INITIAL_PROFILES: UserProfile[] = [
  // ADMIN - Bí thư Đoàn khoa Cơ khí (matches user email bladao@kgc.edu.vn)
  {
    id: 'usr-admin-01',
    code: 'BTH-01',
    full_name: 'Bành Lê Anh Đào',
    email: 'bladao@kgc.edu.vn',
    username: 'bladao',
    role: 'ADMIN',
    class_name: 'Bí thư Đoàn khoa',
    branch_name: 'Ban Chấp hành Đoàn khoa Cơ khí',
    unit: 'Đoàn khoa Cơ khí - CĐ Kiên Giang',
    status: 'active',
    total_ctxh_days: 48.0,
    phone: '0918112233',
    created_at: new Date('2026-01-01').toISOString(),
  },
  // CANBO - Cán bộ Đoàn quản lý chung
  {
    id: 'usr-canbo-01',
    code: 'CB-01',
    full_name: 'Trương Hoàng Trung Kha',
    email: 'thtkha@kgc.edu.vn',
    username: 'thtkha',
    role: 'CANBO',
    class_name: 'Phó Bí thư Đoàn khoa',
    branch_name: 'Ban Chấp hành Đoàn khoa Cơ khí',
    unit: 'Đoàn khoa Cơ khí - CĐ Kiên Giang',
    status: 'active',
    total_ctxh_days: 36.5,
    phone: '0987654321',
    created_at: new Date('2026-01-05').toISOString(),
  },
  ...SEED_STUDENTS.map((s, idx) => ({
    ...s,
    created_at: new Date(Date.now() - (30 - idx) * 86400000).toISOString(),
  }))
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-001',
    code: 'ACT-2026-001',
    title: 'Chiến dịch Mùa hè Xanh 2026 - Đội hình Cơ khí Phục vụ Cộng đồng',
    description: 'Sửa chữa máy nông nghiệp, lắp đặt hệ thống điện an toàn cho hộ khó khăn và tuyên truyền bảo vệ môi trường.',
    organizing_unit: 'Đoàn khoa Cơ khí phối hợp Đoàn trường CĐ Kiên Giang',
    manager_name: 'Bành Lê Anh Đào',
    manager_id: 'usr-admin-01',
    location: 'Huyện Giồng Riềng, Tỉnh Kiên Giang',
    latitude: 9.9123,
    longitude: 105.3012,
    start_time: new Date(Date.now() - 15 * 86400000).toISOString(),
    end_time: new Date(Date.now() - 5 * 86400000).toISOString(),
    checkin_start: new Date(Date.now() - 15 * 86400000).toISOString(),
    checkin_end: new Date(Date.now() - 14 * 86400000).toISOString(),
    target_audience: 'Toàn thể đoàn viên khoa Cơ khí',
    allowed_classes: [],
    ctxh_days: 10.0, // Chính thức theo quy chế: Tham gia đảm bảo trật tự / CDTN hè: 10 ngày
    gps_required: true,
    gps_radius_meters: 500,
    photo_required: true,
    status: 'completed',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'act-002',
    code: 'ACT-2026-002',
    title: 'Hiến máu Tình nguyện - Giọt Hồng Cơ Khí Đợt 1/2026',
    description: 'Phong trào hiến máu nhân đạo cứu người, thể hiện tinh thần xung kích của tuổi trẻ Cao đẳng Kiên Giang.',
    organizing_unit: 'Đoàn khoa Cơ khí - Ban Chỉ đạo Vận động Hiến máu',
    manager_name: 'Trương Hoàng Trung Kha',
    manager_id: 'usr-canbo-01',
    location: 'Hội trường Lớn - Cơ sở 425 Mạc Cửu, CĐ Kiên Giang',
    latitude: KGC_DEFAULT_LAT,
    longitude: KGC_DEFAULT_LNG,
    start_time: new Date(Date.now() - 2 * 3600000).toISOString(),
    end_time: new Date(Date.now() + 4 * 3600000).toISOString(),
    checkin_start: new Date(Date.now() - 1 * 3600000).toISOString(),
    checkin_end: new Date(Date.now() + 3 * 3600000).toISOString(),
    target_audience: 'Tất cả đoàn viên, sinh viên đủ điều kiện sức khỏe',
    allowed_classes: [],
    ctxh_days: 2.0, // Chính thức: Tham gia hiến máu tình nguyện: 02 ngày
    gps_required: true,
    gps_radius_meters: 150,
    photo_required: true,
    status: 'checkin_open', // ĐANG MỞ ĐIỂM DANH!
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'act-003',
    code: 'ACT-2026-003',
    title: 'Ngày Chủ nhật Xanh: Vệ sinh xưởng thực hành & tôn tạo vườn hoa KGC',
    description: 'Bảo dưỡng trang thiết bị máy tiện, phay, hàn và vệ sinh môi trường xưởng thực hành Cơ khí.',
    organizing_unit: 'Chi đoàn Cán bộ & Đoàn khoa Cơ khí',
    manager_name: 'Trương Hoàng Trung Kha',
    manager_id: 'usr-canbo-01',
    location: 'Khu Xưởng Cơ khí & Khuôn viên Cơ sở 425 Mạc Cửu',
    latitude: KGC_DEFAULT_LAT,
    longitude: KGC_DEFAULT_LNG,
    start_time: new Date(Date.now() + 2 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 2 * 86400000 + 4 * 3600000).toISOString(),
    checkin_start: new Date(Date.now() + 2 * 86400000).toISOString(),
    checkin_end: new Date(Date.now() + 2 * 86400000 + 2 * 3600000).toISOString(),
    target_audience: 'Đoàn viên các lớp CKM, CKT, OTO',
    allowed_classes: ['CĐ CKM K23', 'CĐ CKT K23', 'CĐ OTO K23', 'CĐ CKM K24'],
    ctxh_days: 1.0, // Chính thức: Tham gia ngày Chủ nhật xanh: 0.5 - 1 ngày
    gps_required: true,
    gps_radius_meters: 200,
    photo_required: true,
    status: 'scheduled',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'act-004',
    code: 'ACT-2026-004',
    title: 'Hỗ trợ Lễ Tốt nghiệp & Tư vấn Tuyển sinh KGC Khóa mới',
    description: 'Lễ tân đón tiếp, hướng dẫn phụ huynh và vận chuyển lễ phục tốt nghiệp.',
    organizing_unit: 'Đoàn khoa Cơ khí phối hợp Phòng Đào tạo & CTSV',
    manager_name: 'Bành Lê Anh Đào',
    manager_id: 'usr-admin-01',
    location: 'Trung tâm Hội nghị KGC - Cơ sở 425 Mạc Cửu',
    latitude: KGC_DEFAULT_LAT,
    longitude: KGC_DEFAULT_LNG,
    start_time: new Date(Date.now() - 7 * 86400000).toISOString(),
    end_time: new Date(Date.now() - 6 * 86400000).toISOString(),
    checkin_start: new Date(Date.now() - 7 * 86400000).toISOString(),
    checkin_end: new Date(Date.now() - 7 * 86400000 + 4 * 3600000).toISOString(),
    target_audience: 'Đoàn viên khóa 23 và 24',
    allowed_classes: [],
    ctxh_days: 1.5, // Chính thức: Gói và vận chuyển tốt nghiệp, tư vấn tuyển sinh: 1 - 2 ngày
    gps_required: true,
    gps_radius_meters: 100,
    photo_required: true,
    status: 'checkin_closed',
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'act-005',
    code: 'ACT-2026-005',
    title: 'Tập huấn Kỹ năng Cán bộ Đoàn & Chuyên đề Chuyển đổi số Sinh viên',
    description: 'Kỹ năng tổ chức sinh hoạt chi đoàn, ứng dụng công nghệ số và an toàn thông tin.',
    organizing_unit: 'Ban Thường vụ Đoàn khoa Cơ khí',
    manager_name: 'Trương Hoàng Trung Kha',
    manager_id: 'usr-canbo-01',
    location: 'Phòng Hội thảo Smart Lab - KGC',
    latitude: KGC_DEFAULT_LAT,
    longitude: KGC_DEFAULT_LNG,
    start_time: new Date(Date.now() + 5 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 5 * 86400000 + 3 * 3600000).toISOString(),
    checkin_start: new Date(Date.now() + 5 * 86400000).toISOString(),
    checkin_end: new Date(Date.now() + 5 * 86400000 + 1 * 3600000).toISOString(),
    target_audience: 'Ban Chấp hành các Chi đoàn',
    allowed_classes: [],
    ctxh_days: 0.5, // 0.5 ngày
    gps_required: false,
    gps_radius_meters: 200,
    photo_required: false,
    status: 'draft',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  }
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    // Cấp mật khẩu mặc định cho các tài khoản chưa có (kể cả dữ liệu cũ)
    this.ensureCredentials();
    // Ensure active QR session for open activity act-002 on startup
    this.ensureActiveQRSessionForOpenActivities();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.profiles) && Array.isArray(parsed.activities)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load db.json, generating seed data:', e);
    }
    return this.createSeedData();
  }

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      this.data.last_updated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db.json:', e);
    }
  }

  private createSeedData(): DatabaseSchema {
    const profiles = [...INITIAL_PROFILES];
    const activities = [...INITIAL_ACTIVITIES];
    const attendances: Attendance[] = [];
    const point_transactions: PointTransaction[] = [];
    const audit_logs: AuditLog[] = [];

    // Seed attendances for completed Activity 001 (Mùa hè xanh)
    const act1 = activities[0];
    const studentsWhoAttendedAct1 = profiles.filter(p => p.role === 'DVTN').slice(0, 8);
    for (const student of studentsWhoAttendedAct1) {
      const attId = `att-${act1.id}-${student.id}`;
      attendances.push({
        id: attId,
        activity_id: act1.id,
        activity_title: act1.title,
        user_id: student.id,
        user_code: student.code,
        user_name: student.full_name,
        class_name: student.class_name,
        branch_name: student.branch_name,
        checkin_time: new Date(Date.now() - 14 * 86400000 + Math.random() * 3600000).toISOString(),
        status: 'valid',
        ctxh_days_awarded: act1.ctxh_days,
        gps_verified: true,
        gps_latitude: 9.9124,
        gps_longitude: 105.3011,
        gps_distance_meters: 18,
        gps_accuracy_meters: 5,
        photo_url: '',
        photo_stamped: true,
        server_verified_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        notes: 'Xác thực QR động và GPS hợp lệ',
      });

      point_transactions.push({
        id: `tx-${attId}`,
        user_id: student.id,
        user_code: student.code,
        user_name: student.full_name,
        activity_id: act1.id,
        activity_title: act1.title,
        ctxh_days: act1.ctxh_days,
        previous_total: Math.max(0, student.total_ctxh_days - act1.ctxh_days),
        new_total: student.total_ctxh_days,
        transaction_type: 'checkin_award',
        basis: 'Điểm danh QR động & GPS hợp lệ',
        created_by: 'Hệ thống tự động',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      });
    }

    // Seed attendances for closed Activity 004 (Lễ tốt nghiệp)
    const act4 = activities[3];
    const studentsWhoAttendedAct4 = profiles.filter(p => p.role === 'DVTN').slice(4, 12);
    for (const student of studentsWhoAttendedAct4) {
      const attId = `att-${act4.id}-${student.id}`;
      attendances.push({
        id: attId,
        activity_id: act4.id,
        activity_title: act4.title,
        user_id: student.id,
        user_code: student.code,
        user_name: student.full_name,
        class_name: student.class_name,
        branch_name: student.branch_name,
        checkin_time: new Date(Date.now() - 7 * 86400000 + Math.random() * 3600000).toISOString(),
        status: 'valid',
        ctxh_days_awarded: act4.ctxh_days,
        gps_verified: true,
        gps_latitude: KGC_DEFAULT_LAT + 0.0001,
        gps_longitude: KGC_DEFAULT_LNG + 0.0001,
        gps_distance_meters: 15,
        gps_accuracy_meters: 6,
        photo_url: '',
        photo_stamped: true,
        server_verified_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        notes: 'Điểm danh máy chủ ghi nhận hợp lệ',
      });
    }

    audit_logs.push({
      id: 'log-001',
      actor_id: 'usr-admin-01',
      actor_name: 'Bành Lê Anh Đào',
      actor_role: 'ADMIN',
      action: 'INIT_SYSTEM',
      entity_type: 'SYSTEM',
      entity_id: 'GLOBAL',
      details: 'Khởi tạo hệ thống Điểm Danh Số - Đoàn khoa Cơ khí CĐ Kiên Giang',
      timestamp: new Date().toISOString(),
    });

    const schema: DatabaseSchema = {
      profiles,
      activities,
      qr_sessions: {},
      attendances,
      point_transactions,
      audit_logs,
      credentials: this.buildDefaultCredentials(profiles),
      last_updated: new Date().toISOString(),
    };

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(schema, null, 2), 'utf-8');
    } catch {
      // Ignore if write fails on setup
    }

    return schema;
  }

  public resetToDemo(): void {
    this.data = this.createSeedData();
    this.ensureActiveQRSessionForOpenActivities();
    this.save();
  }

  // Ensure active sessions rotate tokens
  private ensureActiveQRSessionForOpenActivities(): void {
    const openActs = this.data.activities.filter(a => a.status === 'checkin_open');
    for (const act of openActs) {
      if (!this.data.qr_sessions[act.id]) {
        this.startQRSession(act.id, 'usr-canbo-01', 30);
      }
    }
  }

  // --- Profiles & Auth ---
  public getProfiles(): UserProfile[] {
    return this.data.profiles;
  }

  public getProfileById(id: string): UserProfile | undefined {
    return this.data.profiles.find(p => p.id === id);
  }

  // Tạo bản ghi mật khẩu (scrypt + salt riêng cho từng tài khoản)
  private hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(String(password), salt, 32).toString('hex');
  }

  private createCredential(password: string = DEFAULT_PASSWORD): StoredCredential {
    const salt = crypto.randomBytes(16).toString('hex');
    return {
      salt,
      hash: this.hashPassword(password, salt),
      updated_at: new Date().toISOString(),
    };
  }

  private buildDefaultCredentials(profiles: UserProfile[]): Record<string, StoredCredential> {
    const credentials: Record<string, StoredCredential> = {};
    for (const profile of profiles) {
      credentials[profile.id] = this.createCredential();
    }
    return credentials;
  }

  // Bổ sung mật khẩu mặc định cho tài khoản cũ chưa có mật khẩu
  private ensureCredentials(): void {
    if (!this.data.credentials) {
      this.data.credentials = {};
    }
    let changed = false;
    for (const profile of this.data.profiles) {
      if (!this.data.credentials[profile.id]) {
        this.data.credentials[profile.id] = this.createCredential();
        changed = true;
      }
    }
    if (changed) {
      this.save();
    }
  }

  public verifyPassword(userId: string, password: string): boolean {
    if (!this.data.credentials) this.ensureCredentials();
    const credential = this.data.credentials?.[userId];
    if (!credential || !password) return false;
    const attempt = Buffer.from(this.hashPassword(password, credential.salt), 'hex');
    const expected = Buffer.from(credential.hash, 'hex');
    return attempt.length === expected.length && crypto.timingSafeEqual(attempt, expected);
  }

  public setPassword(userId: string, newPassword: string): boolean {
    if (!this.getProfileById(userId)) return false;
    if (!this.data.credentials) this.data.credentials = {};
    this.data.credentials[userId] = this.createCredential(newPassword);
    this.save();
    return true;
  }

  public resetPasswordToDefault(userId: string): boolean {
    return this.setPassword(userId, DEFAULT_PASSWORD);
  }

  /** Xóa tài khoản và mật khẩu đi kèm (chỉ ADMIN được gọi qua API) */
  public deleteProfile(userId: string): boolean {
    const index = this.data.profiles.findIndex(p => p.id === userId);
    if (index === -1) return false;

    this.data.profiles.splice(index, 1);
    if (this.data.credentials) {
      delete this.data.credentials[userId];
    }

    // Dọn dữ liệu điểm danh mồ côi của tài khoản đã xóa
    this.data.attendances = this.data.attendances.filter(a => a.user_id !== userId);

    this.save();
    return true;
  }

  /**
   * Tìm tài khoản theo "họ và tên viết tắt".
   * Chấp nhận: mã đoàn viên, username (vd: bladao), email,
   * chữ cái đầu của họ tên (vd: blad / b.l.a.đ), hoặc họ tên đầy đủ không dấu.
   */
  public findProfilesByIdentifier(identifier: string): UserProfile[] {
    const raw = String(identifier || '').trim();
    const key = normalizeKey(raw);
    if (!key) return [];

    // 1. Khớp chính xác & duy nhất: mã đoàn viên / username / email
    const direct = this.data.profiles.filter(p =>
      normalizeKey(p.code) === key ||
      normalizeKey(p.username) === key ||
      p.email.trim().toLowerCase() === raw.toLowerCase()
    );
    if (direct.length > 0) return direct;

    // 2. Khớp theo chữ cái đầu của họ và tên (tên viết tắt)
    const byInitials = this.data.profiles.filter(p => initialsKey(p.full_name) === key);
    if (byInitials.length > 0) return byInitials;

    // 3. Khớp theo họ tên đầy đủ (không phân biệt dấu / khoảng trắng)
    return this.data.profiles.filter(p => normalizeKey(p.full_name) === key);
  }

  // Kiểm tra một tên đăng nhập đã bị dùng bởi mã đoàn viên / username / email khác chưa
  private identityTaken(candidate: string, exceptUserId?: string): boolean {
    const key = normalizeKey(candidate);
    if (!key) return true;
    return this.data.profiles.some(p =>
      p.id !== exceptUserId && (
        normalizeKey(p.code) === key ||
        normalizeKey(p.username) === key ||
        normalizeKey(p.email) === key
      )
    );
  }

  /**
   * Cấp tên đăng nhập tự động từ họ và tên (chữ cái đầu, bỏ dấu).
   * Nếu trùng họ tên hoặc trùng tên đăng nhập đã cấp, tự thêm ký tự đặc biệt:
   *   blad -> blad.2 -> blad.3 ...
   */
  public generateUniqueUsername(fullName: string, fallbackSeed?: string): string {
    const base = initialsKey(fullName) || normalizeKey(fallbackSeed || '') || 'doanvien';
    const duplicatedFullName = this.data.profiles.some(
      p => normalizeKey(p.full_name) === normalizeKey(fullName)
    );

    if (!duplicatedFullName && !this.identityTaken(base)) {
      return base;
    }

    let suffix = 2;
    while (this.identityTaken(`${base}.${suffix}`)) {
      suffix++;
    }
    return `${base}.${suffix}`;
  }

  /** Đảm bảo tên đăng nhập do quản trị viên nhập vào không bị trùng */
  public makeUsernameUnique(desired: string): string {
    const base = normalizeKey(desired) || 'doanvien';
    if (!this.identityTaken(base)) return base;

    let suffix = 2;
    while (this.identityTaken(`${base}.${suffix}`)) {
      suffix++;
    }
    return `${base}.${suffix}`;
  }

  public getProfileByEmailOrUsername(identifier: string): UserProfile | undefined {
    const norm = identifier.trim().toLowerCase();
    return this.data.profiles.find(p => 
      p.email.toLowerCase() === norm || 
      p.username.toLowerCase() === norm || 
      p.code.toLowerCase() === norm
    );
  }

  public createProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'total_ctxh_days'>): UserProfile {
    const id = `usr-${crypto.randomBytes(4).toString('hex')}`;

    // Cấp tên đăng nhập: ưu tiên tên do admin nhập, nếu trống thì sinh từ họ tên.
    // Trùng nhau sẽ tự thêm ký tự đặc biệt (vd: blad.2).
    const loginName = String(profile.username || '').trim()
      ? this.makeUsernameUnique(profile.username)
      : this.generateUniqueUsername(profile.full_name, profile.code);

    const newProfile: UserProfile = {
      ...profile,
      username: loginName,
      id,
      total_ctxh_days: 0,
      created_at: new Date().toISOString(),
    };
    this.data.profiles.push(newProfile);
    // Cấp mật khẩu mặc định Kgc@2410 cho tài khoản mới
    if (!this.data.credentials) this.data.credentials = {};
    this.data.credentials[newProfile.id] = this.createCredential();
    this.save();
    return newProfile;
  }

  public bulkCreateProfiles(profiles: Omit<UserProfile, 'id' | 'created_at' | 'total_ctxh_days'>[]): { added: number; errors: string[]; created: { code: string; full_name: string; username: string }[] } {
    const errors: string[] = [];
    const created: { code: string; full_name: string; username: string }[] = [];
    let added = 0;

    for (const p of profiles) {
      // Check existing code or email
      if (this.data.profiles.some(existing => existing.code.toLowerCase() === p.code.toLowerCase())) {
        errors.push(`Mã đoàn viên "${p.code}" đã tồn tại trong hệ thống.`);
        continue;
      }
      if (this.data.profiles.some(existing => existing.email.toLowerCase() === p.email.toLowerCase())) {
        errors.push(`Email "${p.email}" đã tồn tại.`);
        continue;
      }
      const profile = this.createProfile(p);
      created.push({ code: profile.code, full_name: profile.full_name, username: profile.username });
      added++;
    }

    this.save();
    return { added, errors, created };
  }

  public updateProfileStatus(id: string, status: 'active' | 'locked', actor: UserProfile): UserProfile | null {
    const profile = this.getProfileById(id);
    if (!profile) return null;
    profile.status = status;
    this.logAudit(actor, 'UPDATE_USER_STATUS', 'USER', id, `Thay đổi trạng thái tài khoản ${profile.code} thành: ${status}`);
    this.save();
    return profile;
  }

  // --- Activities ---
  public getActivities(): Activity[] {
    return this.data.activities;
  }

  public getActivityById(id: string): Activity | undefined {
    return this.data.activities.find(a => a.id === id);
  }

  public createActivity(activityData: Omit<Activity, 'id' | 'code' | 'created_at'>, actor: UserProfile): Activity {
    const count = this.data.activities.length + 1;
    const code = `ACT-2026-${String(count).padStart(3, '0')}`;
    const newAct: Activity = {
      ...activityData,
      id: `act-${crypto.randomBytes(4).toString('hex')}`,
      code,
      created_at: new Date().toISOString(),
    };
    this.data.activities.unshift(newAct);
    this.logAudit(actor, 'CREATE_ACTIVITY', 'ACTIVITY', newAct.id, `Tạo hoạt động mới: ${newAct.title} (${newAct.code}), Số ngày CTXH: ${newAct.ctxh_days}`);
    this.save();
    return newAct;
  }

  public updateActivity(id: string, updates: Partial<Activity>, actor: UserProfile): Activity | null {
    const act = this.getActivityById(id);
    if (!act) return null;
    Object.assign(act, updates);
    this.logAudit(actor, 'UPDATE_ACTIVITY', 'ACTIVITY', id, `Cập nhật hoạt động: ${act.title}`);
    this.save();
    return act;
  }

  // --- Dynamic QR Sessions ---
  public startQRSession(activityId: string, createdBy: string, intervalSeconds: 15 | 30 | 60 = 30): QRSession {
    const act = this.getActivityById(activityId);
    if (!act) throw new Error('Không tìm thấy hoạt động.');
    
    act.status = 'checkin_open';
    const now = Date.now();
    const token = this.generateToken(activityId, now);

    const session: QRSession = {
      id: `qrs-${activityId}`,
      activity_id: activityId,
      is_active: true,
      interval_seconds: intervalSeconds,
      current_token: token,
      current_token_created_at: now,
      current_token_expires_at: now + intervalSeconds * 1000,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    };

    this.data.qr_sessions[activityId] = session;
    this.save();
    return session;
  }

  public closeQRSession(activityId: string, actor: UserProfile): void {
    const act = this.getActivityById(activityId);
    if (act) {
      act.status = 'checkin_closed';
    }
    if (this.data.qr_sessions[activityId]) {
      this.data.qr_sessions[activityId].is_active = false;
      this.data.qr_sessions[activityId].current_token = '';
    }
    this.logAudit(actor, 'CLOSE_QR_SESSION', 'ACTIVITY', activityId, `Đóng phiên điểm danh QR của hoạt động ${act?.title}`);
    this.save();
  }

  public getOrRotateQRToken(activityId: string): { 
    token: string; 
    expires_at: number; 
    remaining_seconds: number; 
    interval_seconds: number;
    activity: Activity;
    total_checked_in: number;
  } {
    const act = this.getActivityById(activityId);
    if (!act || act.status !== 'checkin_open') {
      throw new Error('Hoạt động này hiện không mở điểm danh.');
    }

    let session = this.data.qr_sessions[activityId];
    const now = Date.now();

    if (!session || !session.is_active) {
      session = this.startQRSession(activityId, 'system', 30);
    } else if (now >= session.current_token_expires_at) {
      // Token has expired -> rotate token!
      session.current_token = this.generateToken(activityId, now);
      session.current_token_created_at = now;
      session.current_token_expires_at = now + session.interval_seconds * 1000;
      this.save();
    }

    const remaining = Math.max(0, Math.ceil((session.current_token_expires_at - now) / 1000));
    const totalCheckedIn = this.data.attendances.filter(a => a.activity_id === activityId && a.status === 'valid').length;

    return {
      token: session.current_token,
      expires_at: session.current_token_expires_at,
      remaining_seconds: remaining,
      interval_seconds: session.interval_seconds,
      activity: act,
      total_checked_in: totalCheckedIn,
    };
  }

  private generateToken(activityId: string, timestamp: number): string {
    const secret = process.env.QR_SECRET || 'KGC_DOANKHOA_COKHI_QR_2026';
    const payload = `${activityId}_${timestamp}_${crypto.randomBytes(6).toString('hex')}`;
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex').substring(0, 16);
    return `KGCQR_${activityId}_${timestamp}_${hash}`;
  }

  // --- Server-Side Attendance Verification & Recording ---
  public verifyAndRecordAttendance(params: {
    userId: string;
    activityId: string;
    token: string;
    gpsCoords?: { latitude: number; longitude: number; accuracy?: number };
    photoBase64?: string;
  }): { success: boolean; message: string; attendance?: Attendance; awardedDays?: number } {
    const { userId, activityId, token, gpsCoords, photoBase64 } = params;

    // 1. User verification
    const user = this.getProfileById(userId);
    if (!user) {
      return { success: false, message: 'Người dùng không tồn tại trong hệ thống.' };
    }
    if (user.status === 'locked') {
      return { success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Văn phòng Đoàn khoa.' };
    }

    // 2. Activity verification
    const act = this.getActivityById(activityId);
    if (!act) {
      return { success: false, message: 'Hoạt động không tồn tại.' };
    }
    if (act.status !== 'checkin_open') {
      return { success: false, message: 'Hoạt động này hiện đã đóng hoặc chưa mở điểm danh.' };
    }

    // 3. Allowed classes verification
    if (act.allowed_classes && act.allowed_classes.length > 0) {
      const isAllowed = act.allowed_classes.includes(user.class_name) || 
                        act.allowed_classes.includes(user.branch_name);
      if (!isAllowed) {
        return { 
          success: false, 
          message: `Rất tiếc! Hoạt động này chỉ dành cho các lớp: ${act.allowed_classes.join(', ')}. Lớp của bạn là ${user.class_name}.` 
        };
      }
    }

    // 4. Token validation (allow active token and 1-interval grace period)
    const session = this.data.qr_sessions[activityId];
    if (!session || !session.is_active) {
      return { success: false, message: 'Phiên điểm danh QR đã bị đóng hoặc thu hồi.' };
    }

    const now = Date.now();
    const graceWindowMs = 12000; // 12-second grace period for network jitter
    const isCurrentToken = session.current_token === token;
    const isTokenNotExpired = now <= session.current_token_expires_at + graceWindowMs;

    // If token starts with KGCQR_<actId>, verify actId
    if (!token.includes(`KGCQR_${activityId}`)) {
      return { success: false, message: 'Mã QR không khớp với hoạt động này.' };
    }

    if (!isCurrentToken && !isTokenNotExpired) {
      return { success: false, message: 'Mã QR đã hết hạn. Vui lòng hướng camera về màn hình chiếu để quét mã mới nhất!' };
    }

    // 5. ANTI-DUPLICATE CHECK (Database Unique Constraint)
    const existing = this.data.attendances.find(
      a => a.activity_id === activityId && a.user_id === userId && a.status === 'valid'
    );
    if (existing) {
      return { 
        success: false, 
        message: `Bạn đã điểm danh thành công hoạt động này vào lúc ${new Date(existing.checkin_time).toLocaleTimeString('vi-VN')} ngày ${new Date(existing.checkin_time).toLocaleDateString('vi-VN')}. Không thể điểm danh lại!` 
      };
    }

    // 6. GPS VERIFICATION (if required)
    let gpsVerified = false;
    let distanceMeters = 0;

    if (act.gps_required) {
      if (!gpsCoords || typeof gpsCoords.latitude !== 'number' || typeof gpsCoords.longitude !== 'number') {
        return { 
          success: false, 
          message: 'Hoạt động này yêu cầu xác minh vị trí GPS. Vui lòng cấp quyền truy cập vị trí trên trình duyệt và thử lại!' 
        };
      }

      const actLat = act.latitude || KGC_DEFAULT_LAT;
      const actLng = act.longitude || KGC_DEFAULT_LNG;
      const allowedRadius = act.gps_radius_meters || 150;

      distanceMeters = this.calculateHaversineDistance(
        gpsCoords.latitude,
        gpsCoords.longitude,
        actLat,
        actLng
      );

      if (distanceMeters > allowedRadius) {
        return {
          success: false,
          message: `Vị trí của bạn cách địa điểm hoạt động ${Math.round(distanceMeters)}m, vượt quá bán kính cho phép (${allowedRadius}m). Vui lòng di chuyển đến đúng địa điểm tổ chức để điểm danh!`,
        };
      }
      gpsVerified = true;
    }

    // 7. PHOTO PROOF VERIFICATION (if required)
    if (act.photo_required && (!photoBase64 || photoBase64.length < 50)) {
      return {
        success: false,
        message: 'Hoạt động này bắt buộc phải chụp ảnh minh chứng trực tiếp bằng camera tại địa điểm.',
      };
    }

    // 8. ATOMIC RECORDING: Create Attendance & CTXH Point Transaction
    const attId = `att-${activityId}-${userId}`;
    const checkinTime = new Date().toISOString();
    const daysAwarded = act.ctxh_days;

    const newAttendance: Attendance = {
      id: attId,
      activity_id: activityId,
      activity_title: act.title,
      user_id: user.id,
      user_code: user.code,
      user_name: user.full_name,
      class_name: user.class_name,
      branch_name: user.branch_name,
      checkin_time: checkinTime,
      status: 'valid',
      ctxh_days_awarded: daysAwarded,
      gps_verified: gpsVerified,
      gps_latitude: gpsCoords?.latitude,
      gps_longitude: gpsCoords?.longitude,
      gps_distance_meters: Math.round(distanceMeters),
      gps_accuracy_meters: gpsCoords?.accuracy ? Math.round(gpsCoords.accuracy) : undefined,
      photo_url: photoBase64 || '',
      photo_stamped: true,
      server_verified_at: checkinTime,
      notes: 'Máy chủ xác thực thành công tất cả điều kiện quy định.',
    };

    this.data.attendances.unshift(newAttendance);

    // Update student's accumulated CTXH days
    const prevTotal = user.total_ctxh_days || 0;
    const newTotal = Number((prevTotal + daysAwarded).toFixed(2));
    user.total_ctxh_days = newTotal;

    // Record Point Transaction
    const newTx: PointTransaction = {
      id: `tx-${attId}`,
      user_id: user.id,
      user_code: user.code,
      user_name: user.full_name,
      activity_id: act.id,
      activity_title: act.title,
      ctxh_days: daysAwarded,
      previous_total: prevTotal,
      new_total: newTotal,
      transaction_type: 'checkin_award',
      basis: 'Điểm danh QR động & kiểm tra thực địa thành công',
      created_by: 'Máy chủ Điểm Danh Số',
      created_at: checkinTime,
      notes: `Được ghi nhận ${daysAwarded} ngày CTXH theo mức phê duyệt chính thức.`,
    };
    this.data.point_transactions.unshift(newTx);

    // Write audit log
    this.data.audit_logs.unshift({
      id: `log-${crypto.randomBytes(4).toString('hex')}`,
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'CHECK_IN_SUCCESS',
      entity_type: 'ATTENDANCE',
      entity_id: attId,
      details: `Đoàn viên ${user.full_name} (${user.code} - ${user.class_name}) điểm danh thành công ${act.title}. Tích lũy +${daysAwarded} ngày CTXH.`,
      timestamp: checkinTime,
    });

    this.save();

    return {
      success: true,
      message: `Điểm danh thành công! Bạn đã được cộng ${daysAwarded} ngày Công tác xã hội.`,
      attendance: newAttendance,
      awardedDays: daysAwarded,
    };
  }

  // Haversine formula
  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // --- Attendances Queries ---
  public getAttendances(filter?: { activityId?: string; userId?: string }): Attendance[] {
    let result = this.data.attendances;
    if (filter?.activityId) {
      result = result.filter(a => a.activity_id === filter.activityId);
    }
    if (filter?.userId) {
      result = result.filter(a => a.user_id === filter.userId);
    }
    return result;
  }

  public getPointTransactions(userId?: string): PointTransaction[] {
    if (userId) {
      return this.data.point_transactions.filter(t => t.user_id === userId);
    }
    return this.data.point_transactions;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.audit_logs;
  }

  public getDashboardStats(): DashboardStats {
    const total_members = this.data.profiles.filter(p => p.role === 'DVTN').length;
    const total_activities = this.data.activities.length;
    const total_attendances = this.data.attendances.filter(a => a.status === 'valid').length;
    const total_ctxh_days = this.data.attendances
      .filter(a => a.status === 'valid')
      .reduce((sum, a) => sum + (a.ctxh_days_awarded || 0), 0);
    const active_sessions_count = this.data.activities.filter(a => a.status === 'checkin_open').length;

    return {
      total_members,
      total_activities,
      total_attendances,
      total_ctxh_days: Number(total_ctxh_days.toFixed(2)),
      active_sessions_count,
    };
  }

  public logAudit(actor: UserProfile, action: string, entityType: string, entityId: string, details: string): void {
    this.data.audit_logs.unshift({
      id: `log-${crypto.randomBytes(4).toString('hex')}`,
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_role: actor.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      timestamp: new Date().toISOString(),
    });
    this.save();
  }
}

export const db = new DatabaseService();
