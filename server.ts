import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser with 15MB limit for photo proof base64
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to authenticate user from header
const getAuthUser = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  return db.getProfileById(token) || null;
};

// --- AUTH API ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Vui lòng nhập mã đoàn viên, email hoặc tên đăng nhập.' });
  }

  const profile = db.getProfileByEmailOrUsername(identifier);
  if (!profile) {
    return res.status(401).json({ error: 'Không tìm thấy tài khoản trong hệ thống. Vui lòng kiểm tra lại thông tin.' });
  }

  if (profile.status === 'locked') {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Văn phòng Đoàn khoa.' });
  }

  // Record audit log
  db.logAudit(profile, 'LOGIN', 'USER', profile.id, `Đăng nhập thành công với vai trò: ${profile.role}`);

  res.json({
    user: profile,
    token: profile.id, // Lightweight secure session token
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' });
  }
  // Refresh latest user data
  const fresh = db.getProfileById(user.id);
  res.json({ user: fresh });
});

// --- USER MANAGEMENT API ---
app.get('/api/users', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'CANBO')) {
    return res.status(403).json({ error: 'Bạn không có quyền xem danh sách người dùng.' });
  }
  const profiles = db.getProfiles();
  res.json({ profiles });
});

app.post('/api/users', (req: Request, res: Response) => {
  const actor = getAuthUser(req);
  if (!actor || actor.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới được tạo tài khoản người dùng.' });
  }

  const { code, full_name, email, username, role, class_name, branch_name, phone } = req.body;
  if (!code || !full_name || !email) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ Mã đoàn viên, Họ và tên và Email.' });
  }

  // Check duplicates
  if (db.getProfileByEmailOrUsername(code)) {
    return res.status(400).json({ error: `Mã đoàn viên "${code}" đã tồn tại.` });
  }
  if (db.getProfileByEmailOrUsername(email)) {
    return res.status(400).json({ error: `Email "${email}" đã tồn tại trong hệ thống.` });
  }

  const newProfile = db.createProfile({
    code: code.trim().toUpperCase(),
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    username: (username || code).trim().toLowerCase(),
    role: role || 'DVTN',
    class_name: class_name || 'Đoàn khoa Cơ khí',
    branch_name: branch_name || 'Chi đoàn Cơ khí',
    unit: 'Đoàn khoa Cơ khí',
    status: 'active',
    phone: phone || '',
  });

  db.logAudit(actor, 'CREATE_USER', 'USER', newProfile.id, `Tạo tài khoản mới: ${newProfile.full_name} (${newProfile.code})`);
  res.json({ user: newProfile });
});

app.post('/api/users/bulk', (req: Request, res: Response) => {
  const actor = getAuthUser(req);
  if (!actor || actor.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền nhập tài khoản hàng loạt.' });
  }

  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Dữ liệu nhập vào không hợp lệ hoặc trống.' });
  }

  const profilesToCreate = rows.map((r: any) => ({
    code: String(r.code || '').trim().toUpperCase(),
    full_name: String(r.full_name || '').trim(),
    email: String(r.email || '').trim().toLowerCase(),
    username: String(r.username || r.code || '').trim().toLowerCase(),
    role: (r.role === 'CANBO' || r.role === 'ADMIN' ? r.role : 'DVTN') as any,
    class_name: String(r.class_name || 'CĐ Cơ khí').trim(),
    branch_name: String(r.branch_name || 'Chi đoàn Cơ khí').trim(),
    unit: 'Đoàn khoa Cơ khí',
    status: 'active' as const,
    phone: String(r.phone || '').trim(),
  }));

  const result = db.bulkCreateProfiles(profilesToCreate);
  db.logAudit(actor, 'BULK_IMPORT_USERS', 'USER', 'BULK', `Nhập hàng loạt thành công ${result.added} tài khoản đoàn viên.`);
  res.json(result);
});

app.patch('/api/users/:id/status', (req: Request, res: Response) => {
  const actor = getAuthUser(req);
  if (!actor || actor.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền khóa/mở tài khoản.' });
  }

  const { status } = req.body;
  if (status !== 'active' && status !== 'locked') {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  }

  const updated = db.updateProfileStatus(req.params.id, status, actor);
  if (!updated) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  }
  res.json({ user: updated });
});

// --- ACTIVITIES API ---
app.get('/api/activities', (_req: Request, res: Response) => {
  const activities = db.getActivities();
  res.json({ activities });
});

app.get('/api/activities/:id', (req: Request, res: Response) => {
  const activity = db.getActivityById(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: 'Không tìm thấy hoạt động.' });
  }
  res.json({ activity });
});

app.post('/api/activities', (req: Request, res: Response) => {
  const actor = getAuthUser(req);
  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'CANBO')) {
    return res.status(403).json({ error: 'Bạn không có quyền tạo hoạt động.' });
  }

  const {
    title,
    description,
    organizing_unit,
    manager_name,
    location,
    latitude,
    longitude,
    start_time,
    end_time,
    checkin_start,
    checkin_end,
    target_audience,
    allowed_classes,
    ctxh_days,
    gps_required,
    gps_radius_meters,
    photo_required,
    status,
  } = req.body;

  if (!title || !location || ctxh_days === undefined) {
    return res.status(400).json({ error: 'Vui lòng nhập Tên hoạt động, Địa điểm và Số ngày CTXH.' });
  }

  const newAct = db.createActivity({
    title: title.trim(),
    description: description ? description.trim() : '',
    organizing_unit: organizing_unit || 'Đoàn khoa Cơ khí',
    manager_name: manager_name || actor.full_name,
    manager_id: actor.id,
    location: location.trim(),
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    start_time: start_time || new Date().toISOString(),
    end_time: end_time || new Date(Date.now() + 4 * 3600000).toISOString(),
    checkin_start: checkin_start || new Date().toISOString(),
    checkin_end: checkin_end || new Date(Date.now() + 2 * 3600000).toISOString(),
    target_audience: target_audience || 'Đoàn viên thanh niên',
    allowed_classes: Array.isArray(allowed_classes) ? allowed_classes : [],
    ctxh_days: Number(ctxh_days),
    gps_required: !!gps_required,
    gps_radius_meters: Number(gps_radius_meters) || 150,
    photo_required: !!photo_required,
    status: status || 'scheduled',
  }, actor);

  res.json({ activity: newAct });
});

app.patch('/api/activities/:id', (req: Request, res: Response) => {
  const actor = getAuthUser(req);
  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'CANBO')) {
    return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa hoạt động.' });
  }

  const updated = db.updateActivity(req.params.id, req.body, actor);
  if (!updated) {
    return res.status(404).json({ error: 'Không tìm thấy hoạt động.' });
  }
  res.json({ activity: updated });
});

// --- DYNAMIC QR CODES API ---
app.post('/api/qr/open', (req: Request, res: Response) => {
  const actor = getAuthUser(req);
  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'CANBO')) {
    return res.status(403).json({ error: 'Bạn không có quyền mở điểm danh QR.' });
  }

  const { activity_id, interval_seconds } = req.body;
  if (!activity_id) {
    return res.status(400).json({ error: 'Thiếu mã hoạt động.' });
  }

  try {
    const session = db.startQRSession(activity_id, actor.id, interval_seconds || 30);
    db.logAudit(actor, 'OPEN_QR_SESSION', 'ACTIVITY', activity_id, `Mở điểm danh phát mã QR động (Chu kỳ: ${session.interval_seconds}s)`);
    res.json({ session });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Lỗi khi mở phiên điểm danh QR.' });
  }
});

app.post('/api/qr/close', (req: Request, res: Response) => {
  const actor = getAuthUser(req);
  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'CANBO')) {
    return res.status(403).json({ error: 'Bạn không có quyền đóng điểm danh.' });
  }

  const { activity_id } = req.body;
  if (!activity_id) {
    return res.status(400).json({ error: 'Thiếu mã hoạt động.' });
  }

  db.closeQRSession(activity_id, actor);
  res.json({ success: true, message: 'Đã đóng phiên điểm danh và thu hồi mã QR.' });
});

app.get('/api/qr/token/:activityId', (req: Request, res: Response) => {
  try {
    const tokenInfo = db.getOrRotateQRToken(req.params.activityId);
    res.json(tokenInfo);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Không thể lấy mã QR.' });
  }
});

// --- ATTENDANCE VERIFICATION & CHECK-IN API ---
app.post('/api/attendance/check-in', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để thực hiện điểm danh.' });
  }

  const { activity_id, token, gpsCoords, photoBase64 } = req.body;
  if (!activity_id || !token) {
    return res.status(400).json({ error: 'Thiếu thông tin hoạt động hoặc mã token QR.' });
  }

  const result = db.verifyAndRecordAttendance({
    userId: user.id,
    activityId: activity_id,
    token,
    gpsCoords,
    photoBase64,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({
    success: true,
    message: result.message,
    attendance: result.attendance,
    awardedDays: result.awardedDays,
  });
});

app.get('/api/attendance', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
  }

  const { activity_id, user_id } = req.query;

  // Non-admins can only view their own attendance or if canbo views their assigned activity
  if (user.role === 'DVTN' && user_id && user_id !== user.id) {
    return res.status(403).json({ error: 'Bạn không có quyền xem thông tin điểm danh của người khác.' });
  }

  const filter = {
    activityId: activity_id ? String(activity_id) : undefined,
    userId: user.role === 'DVTN' ? user.id : (user_id ? String(user_id) : undefined),
  };

  const attendances = db.getAttendances(filter);
  res.json({ attendances });
});

// --- POINT TRANSACTIONS & AUDIT LOGS ---
app.get('/api/point-transactions', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
  }
  const userId = user.role === 'DVTN' ? user.id : (req.query.user_id ? String(req.query.user_id) : undefined);
  const transactions = db.getPointTransactions(userId);
  res.json({ transactions });
});

app.get('/api/audit-logs', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới được xem nhật ký thao tác.' });
  }
  const logs = db.getAuditLogs();
  res.json({ logs });
});

app.get('/api/stats/dashboard', (_req: Request, res: Response) => {
  const stats = db.getDashboardStats();
  res.json({ stats });
});

// --- CSV EXPORT WITH UTF-8 BOM ---
app.get('/api/reports/export-csv', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'CANBO')) {
    return res.status(403).json({ error: 'Bạn không có quyền xuất báo cáo.' });
  }

  const { activity_id, class_name } = req.query;
  let attendances = db.getAttendances({ activityId: activity_id ? String(activity_id) : undefined });

  if (class_name) {
    attendances = attendances.filter(a => a.class_name.toLowerCase().includes(String(class_name).toLowerCase()));
  }

  // Generate CSV Header & rows
  const headers = [
    'STT',
    'Mã đoàn viên',
    'Họ và tên',
    'Lớp',
    'Chi đoàn',
    'Tên hoạt động',
    'Thời gian điểm danh',
    'Số ngày CTXH',
    'Trạng thái',
    'Xác minh GPS',
    'Khoảng cách GPS (m)',
    'Ảnh minh chứng',
    'Thời gian máy chủ xác thực'
  ];

  const escapeCSV = (val: any) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = attendances.map((att, idx) => [
    idx + 1,
    escapeCSV(att.user_code),
    escapeCSV(att.user_name),
    escapeCSV(att.class_name),
    escapeCSV(att.branch_name),
    escapeCSV(att.activity_title),
    escapeCSV(new Date(att.checkin_time).toLocaleString('vi-VN')),
    att.ctxh_days_awarded,
    escapeCSV(att.status === 'valid' ? 'Hợp lệ' : 'Chưa hợp lệ'),
    escapeCSV(att.gps_verified ? 'Đạt' : 'Không yêu cầu/Không đạt'),
    att.gps_distance_meters !== undefined ? att.gps_distance_meters : '',
    escapeCSV(att.photo_url ? 'Có ảnh camera' : 'Không yêu cầu'),
    escapeCSV(att.server_verified_at ? new Date(att.server_verified_at).toLocaleString('vi-VN') : '')
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Bao_cao_diem_danh_CTXH_${Date.now()}.csv"`);
  res.send(csvContent);
});

// --- RESET DEMO DATA ---
app.post('/api/demo/reset', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới được thiết lập lại dữ liệu demo.' });
  }

  db.resetToDemo();
  db.logAudit(user, 'RESET_DEMO_DATA', 'SYSTEM', 'GLOBAL', 'Khôi phục toàn bộ dữ liệu mẫu ban đầu theo chuẩn quy chế.');
  res.json({ success: true, message: 'Đã khôi phục dữ liệu mẫu thành công.' });
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ĐIỂM DANH SỐ server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
