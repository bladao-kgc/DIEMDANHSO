import React, { useState, useEffect } from 'react';
import type { 
  UserProfile, 
  Activity, 
  Attendance, 
  DashboardStats, 
  AuditLog 
} from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  Users, 
  Calendar, 
  Award, 
  CheckCircle, 
  Plus, 
  QrCode, 
  Download, 
  Upload, 
  Lock, 
  Unlock, 
  Search, 
  FileSpreadsheet, 
  RefreshCw, 
  Image as ImageIcon, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle,
  History,
  X
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  currentTab: string;
  onOpenQRProjector: (act: Activity) => void;
  onTabChange: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  currentTab,
  onOpenQRProjector,
  onTabChange,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [userSearch, setUserSearch] = useState<string>('');
  const [userClassFilter, setUserClassFilter] = useState<string>('all');
  const [reportActivityFilter, setReportActivityFilter] = useState<string>('all');
  const [reportClassFilter, setReportClassFilter] = useState<string>('');

  // Modals
  const [showCreateActivityModal, setShowCreateActivityModal] = useState<boolean>(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState<boolean>(false);
  const [selectedPhotoProof, setSelectedPhotoProof] = useState<Attendance | null>(null);

  // Form states
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    title: '',
    description: '',
    organizing_unit: 'Đoàn khoa Cơ khí',
    manager_name: currentUser.full_name,
    location: 'Cơ sở 425 Mạc Cửu, P. Vĩnh Thanh, Rạch Giá, Kiên Giang',
    latitude: 10.01254,
    longitude: 105.08092,
    ctxh_days: 1.0,
    gps_required: true,
    gps_radius_meters: 150,
    photo_required: true,
    status: 'scheduled',
    allowed_classes: [],
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 16),
    checkin_start: new Date().toISOString().slice(0, 16),
    checkin_end: new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16),
  });

  const [newSingleUser, setNewSingleUser] = useState({
    code: '',
    full_name: '',
    email: '',
    role: 'DVTN' as const,
    class_name: 'CĐ CKM K23',
    branch_name: 'Chi đoàn CĐ Cơ khí chế tạo K23',
    phone: '',
  });

  // Bulk import state
  const [bulkInputText, setBulkInputText] = useState<string>('');
  const [bulkParsedRows, setBulkParsedRows] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, uRes, attRes, logRes] = await Promise.all([
        api.getDashboardStats(),
        api.getActivities(),
        api.getUsers(),
        api.getAttendances(),
        api.getAuditLogs(),
      ]);
      setStats(sRes.stats);
      setActivities(aRes.activities);
      setUsers(uRes.profiles);
      setAttendances(attRes.attendances);
      setAuditLogs(logRes.logs);
    } catch (e: any) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.code.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesClass = userClassFilter === 'all' || u.class_name === userClassFilter;
    return matchesSearch && matchesClass;
  });

  // Filtered Attendances
  const filteredAttendances = attendances.filter((att) => {
    const matchesAct = reportActivityFilter === 'all' || att.activity_id === reportActivityFilter;
    const matchesClass = !reportClassFilter || att.class_name.toLowerCase().includes(reportClassFilter.toLowerCase());
    return matchesAct && matchesClass;
  });

  // Unique Classes list for filter
  const uniqueClasses = Array.from(new Set(users.map((u) => u.class_name).filter(Boolean)));

  // Handlers
  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'locked' : 'active';
    const confirmMsg = newStatus === 'locked' 
      ? `Bạn có chắc muốn KHÓA tài khoản ${user.full_name} (${user.code})?`
      : `Bạn có chắc muốn MỞ KHÓA tài khoản ${user.full_name} (${user.code})?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateUserStatus(user.id, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái.');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createActivity(newActivity);
      setShowCreateActivityModal(false);
      loadData();
      alert('Đã tạo hoạt động mới thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo hoạt động.');
    }
  };

  const handleCreateSingleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newSingleUser);
      setShowCreateUserModal(false);
      setNewSingleUser({
        code: '',
        full_name: '',
        email: '',
        role: 'DVTN',
        class_name: 'CĐ CKM K23',
        branch_name: 'Chi đoàn CĐ Cơ khí chế tạo K23',
        phone: '',
      });
      loadData();
      alert('Tạo tài khoản thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo tài khoản.');
    }
  };

  // Bulk import parser
  const handleParseBulkData = () => {
    const lines = bulkInputText.trim().split('\n');
    const parsed: any[] = [];
    const errors: string[] = [];
    const existingCodes = new Set(users.map((u) => u.code.toLowerCase()));
    const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));
    const seenCodes = new Set<string>();

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      // Tab or comma separated
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length < 3) {
        errors.push(`Dòng ${index + 1}: Thiếu cột (Cần tối thiểu: Mã ĐV, Họ tên, Lớp)`);
        return;
      }

      const code = parts[0]?.trim();
      const full_name = parts[1]?.trim();
      const class_name = parts[2]?.trim();
      const branch_name = parts[3]?.trim() || `Chi đoàn ${class_name}`;
      const email = parts[4]?.trim() || `${code.toLowerCase()}@kgc.edu.vn`;

      if (!code || !full_name) {
        errors.push(`Dòng ${index + 1}: Mã ĐV hoặc Họ tên trống.`);
        return;
      }

      if (existingCodes.has(code.toLowerCase())) {
        errors.push(`Dòng ${index + 1}: Mã ĐV "${code}" đã có trong hệ thống.`);
        return;
      }
      if (seenCodes.has(code.toLowerCase())) {
        errors.push(`Dòng ${index + 1}: Mã ĐV "${code}" bị trùng lặp trong danh sách nhập.`);
        return;
      }
      seenCodes.add(code.toLowerCase());

      parsed.push({
        code,
        full_name,
        class_name,
        branch_name,
        email,
        role: 'DVTN',
      });
    });

    setBulkParsedRows(parsed);
    setBulkErrors(errors);
  };

  const handleConfirmBulkImport = async () => {
    if (bulkParsedRows.length === 0) return;
    try {
      const res = await api.bulkCreateUsers(bulkParsedRows);
      alert(`Đã nhập thành công ${res.added} tài khoản đoàn viên!`);
      setShowBulkImportModal(false);
      setBulkInputText('');
      setBulkParsedRows([]);
      setBulkErrors([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi nhập danh sách.');
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Khôi phục toàn bộ dữ liệu mẫu theo chuẩn quy chế Đoàn khoa Cơ khí? Thao tác này sẽ đặt lại danh sách 20 đoàn viên và 5 hoạt động mẫu.')) {
      return;
    }
    try {
      await api.resetDemoData();
      alert('Đã khôi phục dữ liệu mẫu ban đầu thành công!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khôi phục dữ liệu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 CORE KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Tổng số đoàn viên
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-900 font-mono mt-1 block">
              {stats?.total_members || 0}
            </span>
            <span className="text-[11px] text-slate-400">Khoa Cơ khí</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Tổng số hoạt động
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-900 font-mono mt-1 block">
              {stats?.total_activities || 0}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {stats?.active_sessions_count || 0} đang mở QR
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Lượt tham gia hợp lệ
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-900 font-mono mt-1 block">
              {stats?.total_attendances || 0}
            </span>
            <span className="text-[11px] text-slate-400">Điểm danh máy chủ</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Ngày CTXH ghi nhận
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1 block">
              {stats?.total_ctxh_days || 0}
            </span>
            <span className="text-[11px] text-slate-400">Đã tích lũy</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TAB: TỔNG QUAN & HOẠT ĐỘNG */}
      {(currentTab === 'overview' || currentTab === 'activities') && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Danh sách Hoạt động Đoàn khoa Cơ khí
              </h3>
              <p className="text-xs text-slate-500">
                Quản lý các đợt phong trào, thiết lập ngày CTXH và kích hoạt điểm danh QR động
              </p>
            </div>

            <button
              onClick={() => setShowCreateActivityModal(true)}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Tạo hoạt động mới
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Chưa có hoạt động nào trong hệ thống.
              </div>
            ) : (
              activities.map((act) => {
                const checkedInCount = attendances.filter(
                  (a) => a.activity_id === act.id && a.status === 'valid'
                ).length;

                return (
                  <div
                    key={act.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-500">{act.code}</span>
                        <span className="text-slate-300">·</span>
                        {act.status === 'checkin_open' && (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Đang mở điểm danh
                          </span>
                        )}
                        {act.status === 'scheduled' && (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Đã lên lịch
                          </span>
                        )}
                        {act.status === 'completed' && (
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Hoàn thành
                          </span>
                        )}
                        {act.status === 'checkin_closed' && (
                          <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            Đã đóng điểm danh
                          </span>
                        )}
                        {act.status === 'draft' && (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Bản nháp
                          </span>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-amber-700">+{act.ctxh_days} ngày CTXH</span>
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                        {act.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {act.location}
                        </span>
                        <span>Đã tham gia: <strong className="text-slate-800">{checkedInCount} đoàn viên</strong></span>
                        {act.gps_required && (
                          <span className="text-blue-700 font-medium">GPS ({act.gps_radius_meters}m)</span>
                        )}
                        {act.photo_required && (
                          <span className="text-amber-700 font-medium">Ảnh minh chứng</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                      {act.status === 'checkin_open' ? (
                        <button
                          onClick={() => onOpenQRProjector(act)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
                        >
                          <QrCode className="w-4 h-4" />
                          Chiếu mã QR động
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            await api.openQRSession(act.id, 30);
                            loadData();
                            onOpenQRProjector(act);
                          }}
                          className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
                        >
                          <QrCode className="w-4 h-4" />
                          Mở điểm danh QR
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: QUẢN LÝ ĐOÀN VIÊN */}
      {currentTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Danh sách Đoàn viên Khoa Cơ khí ({filteredUsers.length} tài khoản)
              </h3>
              <p className="text-xs text-slate-500">
                Quản lý hồ sơ, lớp, mã đoàn viên, tích lũy ngày CTXH và trạng thái hoạt động
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Nhập từ CSV / Excel
              </button>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm đoàn viên
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo họ tên, mã ĐV, email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <select
              value={userClassFilter}
              onChange={(e) => setUserClassFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả lớp ({users.length})</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã ĐV / Cán bộ</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4 text-right">Tổng ngày CTXH</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy đoàn viên nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{u.full_name}</td>
                      <td className="py-3 px-4 text-slate-600">{u.class_name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-red-50 text-red-700' :
                          u.role === 'CANBO' ? 'bg-blue-50 text-blue-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {u.role === 'ADMIN' ? 'Bí thư (Admin)' : u.role === 'CANBO' ? 'Cán bộ Đoàn' : 'Đoàn viên'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">
                        {u.total_ctxh_days} ngày
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.status === 'active' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                        }`}>
                          {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                          >
                            {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: BÁO CÁO ĐIỂM DANH & CTXH */}
      {currentTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Báo cáo Điểm danh & Ghi nhận Ngày Công tác xã hội
              </h3>
              <p className="text-xs text-slate-500">
                Dữ liệu thời gian thực được xác minh phía máy chủ với bằng chứng GPS & ảnh camera
              </p>
            </div>

            <a
              href={api.getExportCsvUrl(
                reportActivityFilter !== 'all' ? reportActivityFilter : undefined,
                reportClassFilter || undefined
              )}
              download
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              Xuất CSV (Excel UTF-8 BOM)
            </a>
          </div>

          {/* Filters */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <select
              value={reportActivityFilter}
              onChange={(e) => setReportActivityFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả hoạt động ({activities.length})</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.code} - {a.title}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Lọc theo lớp..."
              value={reportClassFilter}
              onChange={(e) => setReportClassFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Mã ĐV</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Hoạt động</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Ngày CTXH</th>
                  <th className="py-3 px-4 text-center">Xác minh GPS</th>
                  <th className="py-3 px-4 text-center">Minh chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      Chưa có lượt điểm danh nào thỏa mãn bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((att, idx) => (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{att.user_code}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{att.user_name}</td>
                      <td className="py-3 px-4 text-slate-600">{att.class_name}</td>
                      <td className="py-3 px-4 max-w-xs truncate" title={att.activity_title}>
                        {att.activity_title}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(att.checkin_time).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                        +{att.ctxh_days_awarded}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {att.gps_verified ? (
                          <span className="text-emerald-700 font-semibold">
                            Đạt ({att.gps_distance_meters}m)
                          </span>
                        ) : (
                          <span className="text-slate-400">Không bắt buộc</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {att.photo_url ? (
                          <button
                            onClick={() => setSelectedPhotoProof(att)}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold underline"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Xem ảnh
                          </button>
                        ) : (
                          <span className="text-slate-400">Không có</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: NHẬT KÝ VÀ CÀI ĐẶT */}
      {currentTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Nhật ký Thao tác (Audit Logs)</h3>
                <p className="text-xs text-slate-500">Ghi nhận minh bạch mọi thao tác quản trị và điểm danh trên máy chủ</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 px-5 flex items-start justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.actor_name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Data Reset Box */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Khôi phục Dữ liệu Mẫu (Demo Data)
              </h4>
              <p className="text-xs text-amber-900/80 mt-1">
                Thiết lập lại danh sách 20 đoàn viên cơ khí, 5 hoạt động mẫu và các mốc ngày CTXH theo chuẩn quy chế.
              </p>
            </div>
            <button
              onClick={handleResetDemo}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
            >
              Khôi phục dữ liệu ban đầu
            </button>
          </div>
        </div>
      )}

      {/* MODAL: TẠO HOẠT ĐỘNG MỚI */}
      {showCreateActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Tạo Hoạt động Đoàn mới</h3>
              <button
                onClick={() => setShowCreateActivityModal(false)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Tên hoạt động *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hiến máu tình nguyện đợt 2/2026..."
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Nội dung tóm tắt</label>
                <textarea
                  rows={2}
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Mức ngày CTXH chính thức *</label>
                  <select
                    value={newActivity.ctxh_days}
                    onChange={(e) => setNewActivity({ ...newActivity, ctxh_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-blue-900"
                  >
                    <option value={0.25}>0.25 ngày (Hoạt động lễ tân, lao động 1 buổi)</option>
                    <option value={0.5}>0.5 ngày (Chủ nhật xanh, hỗ trợ học tập 1 buổi)</option>
                    <option value={1.0}>1.0 ngày (Chủ nhật xanh đầy đủ, về nguồn)</option>
                    <option value={1.5}>1.5 ngày (Hỗ trợ tốt nghiệp, tư vấn tuyển sinh)</option>
                    <option value={2.0}>2.0 ngày (Hiến máu tình nguyện, cán bộ Đoàn xuất sắc)</option>
                    <option value={10.0}>10.0 ngày (Chiến dịch Mùa hè xanh trọn đợt)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Trạng thái ban đầu</label>
                  <select
                    value={newActivity.status}
                    onChange={(e) => setNewActivity({ ...newActivity, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="checkin_open">Mở điểm danh ngay</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Địa điểm tổ chức *</label>
                <input
                  type="text"
                  required
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              {/* GPS & Photo switches */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newActivity.gps_required}
                    onChange={(e) => setNewActivity({ ...newActivity, gps_required: e.target.checked })}
                    className="rounded text-blue-900"
                  />
                  Bật yêu cầu xác minh vị trí GPS thực địa
                </label>
                {newActivity.gps_required && (
                  <div className="pl-6 grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Bán kính cho phép (mét)</span>
                      <input
                        type="number"
                        value={newActivity.gps_radius_meters}
                        onChange={(e) => setNewActivity({ ...newActivity, gps_radius_meters: Number(e.target.value) })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tọa độ mẫu KGC</span>
                      <span className="text-[10px] font-mono text-slate-600 block mt-1.5">
                        {newActivity.latitude}, {newActivity.longitude}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newActivity.photo_required}
                    onChange={(e) => setNewActivity({ ...newActivity, photo_required: e.target.checked })}
                    className="rounded text-blue-900"
                  />
                  Bắt buộc chụp ảnh minh chứng trực tiếp bằng camera tại địa điểm
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateActivityModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Lưu hoạt động
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM ĐOÀN VIÊN THỦ CÔNG */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
            <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Thêm Đoàn viên mới</h3>
              <button onClick={() => setShowCreateUserModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleUser} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Mã đoàn viên *</label>
                <input
                  type="text"
                  required
                  placeholder="CK2411"
                  value={newSingleUser.code}
                  onChange={(e) => setNewSingleUser({ ...newSingleUser, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={newSingleUser.full_name}
                  onChange={(e) => setNewSingleUser({ ...newSingleUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Lớp *</label>
                <input
                  type="text"
                  required
                  placeholder="CĐ CKM K24"
                  value={newSingleUser.class_name}
                  onChange={(e) => setNewSingleUser({ ...newSingleUser, class_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="a.ck2411@kgc.edu.vn"
                  value={newSingleUser.email}
                  onChange={(e) => setNewSingleUser({ ...newSingleUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NHẬP HÀNG LOẠT CSV / EXCEL */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Nhập tài khoản Đoàn viên hàng loạt</h3>
              <button onClick={() => setShowBulkImportModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900">
                <strong>Hướng dẫn:</strong> Sao chép và dán các cột từ Microsoft Excel hoặc Google Sheets theo thứ tự:
                <br />
                <code className="font-mono font-bold mt-1 inline-block">
                  Mã đoàn viên | Họ và tên | Lớp | Chi đoàn | Email (Tùy chọn)
                </code>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Dán dữ liệu từ bảng tính:</label>
                <textarea
                  rows={5}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  placeholder={`CK2411\tNguyễn Văn An\tCĐ CKM K24\tChi đoàn CKM K24\nan.ck2411@kgc.edu.vn\nCK2412\tTrần Thị Bình\tCĐ CKT K24\tChi đoàn CKT K24`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleParseBulkData}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors"
              >
                Kiểm tra & Xem trước dữ liệu ({bulkParsedRows.length} dòng hợp lệ)
              </button>

              {bulkErrors.length > 0 && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 space-y-1">
                  <strong>Các dòng bị lỗi hoặc trùng lặp (sẽ bỏ qua):</strong>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {bulkErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bulkParsedRows.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 block mb-2">Xem trước danh sách chuẩn bị nhập:</span>
                  <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Mã ĐV</th>
                          <th className="p-2">Họ tên</th>
                          <th className="p-2">Lớp</th>
                          <th className="p-2">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkParsedRows.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono font-bold">{r.code}</td>
                            <td className="p-2">{r.full_name}</td>
                            <td className="p-2">{r.class_name}</td>
                            <td className="p-2 font-mono text-slate-500">{r.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={bulkParsedRows.length === 0}
                  onClick={handleConfirmBulkImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-40"
                >
                  Xác nhận nhập {bulkParsedRows.length} đoàn viên
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX: XEM ẢNH MINH CHỨNG */}
      {selectedPhotoProof && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
            <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Ảnh minh chứng điểm danh thực địa</h3>
                <span className="text-[11px] text-blue-200">
                  {selectedPhotoProof.user_name} ({selectedPhotoProof.user_code}) · {selectedPhotoProof.class_name}
                </span>
              </div>
              <button onClick={() => setSelectedPhotoProof(null)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center">
              <div className="w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                {selectedPhotoProof.photo_url ? (
                  <img
                    src={selectedPhotoProof.photo_url}
                    alt="Proof Photo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-slate-400 text-xs">Không có ảnh</span>
                )}
              </div>

              <div className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700">
                <div><strong>Hoạt động:</strong> {selectedPhotoProof.activity_title}</div>
                <div><strong>Thời gian điểm danh:</strong> {new Date(selectedPhotoProof.checkin_time).toLocaleString('vi-VN')}</div>
                <div><strong>Ghi nhận ngày CTXH:</strong> <span className="font-bold text-amber-700">+{selectedPhotoProof.ctxh_days_awarded} ngày</span></div>
                {selectedPhotoProof.gps_verified && (
                  <div><strong>Vị trí GPS:</strong> Hợp lệ (cách {selectedPhotoProof.gps_distance_meters}m)</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
