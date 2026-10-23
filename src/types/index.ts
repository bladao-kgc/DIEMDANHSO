export type UserRole = 'ADMIN' | 'CANBO' | 'DVTN';

export type UserStatus = 'active' | 'locked';

export interface UserProfile {
  id: string;
  code: string; // Mã đoàn viên hoặc mã cán bộ (vd: CK2301, CB01, AD01)
  full_name: string;
  email: string;
  username: string;
  role: UserRole;
  class_name: string; // vd: CĐ CKM K23, Ban Chấp hành
  branch_name: string; // Chi đoàn vd: Chi đoàn CĐ CKM K23
  unit: string; // 'Đoàn khoa Cơ khí - CĐ Kiên Giang'
  status: UserStatus;
  avatar_url?: string;
  phone?: string;
  total_ctxh_days: number; // Tổng số ngày CTXH đã tích lũy
  created_at: string;
}

export type ActivityStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'checkin_open' 
  | 'checkin_closed' 
  | 'completed' 
  | 'cancelled';

export interface Activity {
  id: string;
  code: string; // Mã hoạt động tự động (vd: HD-2026-001)
  title: string;
  description: string;
  organizing_unit: string; // Đơn vị tổ chức
  manager_name: string; // Người phụ trách
  manager_id: string;
  location: string; // Địa điểm diễn ra
  latitude?: number; // Vĩ độ nếu yêu cầu GPS
  longitude?: number; // Kinh độ nếu yêu cầu GPS
  start_time: string; // ISO string
  end_time: string; // ISO string
  checkin_start: string; // Thời gian mở điểm danh
  checkin_end: string; // Thời gian đóng điểm danh
  target_audience: string; // Đối tượng tham gia
  allowed_classes: string[]; // Các lớp/chi đoàn được áp dụng (trống = tất cả)
  ctxh_days: number; // Số ngày CTXH được duyệt (vd: 0.25, 0.5, 1.0, 2.0, 10.0)
  gps_required: boolean;
  gps_radius_meters: number; // Bán kính cho phép tính bằng mét (vd: 100, 200)
  photo_required: boolean; // Yêu cầu ảnh minh chứng trực tiếp
  status: ActivityStatus;
  created_at: string;
}

export interface QRSession {
  id: string;
  activity_id: string;
  is_active: boolean;
  interval_seconds: 15 | 30 | 60; // Chu kỳ đổi token
  current_token: string;
  current_token_created_at: number;
  current_token_expires_at: number;
  created_by: string;
  created_at: string;
}

export type AttendanceStatus = 'valid' | 'invalid' | 'pending_review';

export interface Attendance {
  id: string;
  activity_id: string;
  activity_title: string;
  user_id: string;
  user_code: string;
  user_name: string;
  class_name: string;
  branch_name: string;
  checkin_time: string;
  status: AttendanceStatus;
  ctxh_days_awarded: number;
  gps_verified: boolean;
  gps_latitude?: number;
  gps_longitude?: number;
  gps_distance_meters?: number;
  gps_accuracy_meters?: number;
  photo_url?: string;
  photo_stamped: boolean;
  server_verified_at: string;
  notes?: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  user_code: string;
  user_name: string;
  activity_id: string;
  activity_title: string;
  ctxh_days: number;
  previous_total: number;
  new_total: number;
  transaction_type: 'checkin_award' | 'admin_adjust';
  basis: string; // Căn cứ ghi nhận (vd: "Điểm danh QR hợp lệ", "Điều chỉnh bổ sung minh chứng")
  created_by: string;
  created_at: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  total_members: number;
  total_activities: number;
  total_attendances: number;
  total_ctxh_days: number;
  active_sessions_count: number;
}
