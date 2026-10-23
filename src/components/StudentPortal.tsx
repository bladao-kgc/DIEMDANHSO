import React, { useState, useEffect } from 'react';
import type { UserProfile, Activity, Attendance, PointTransaction } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  Award, 
  QrCode, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';

interface StudentPortalProps {
  user: UserProfile;
  currentTab: string;
  onOpenScanner: () => void;
  onRefreshUser: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  user,
  currentTab,
  onOpenScanner,
  onRefreshUser,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [myAttendances, setMyAttendances] = useState<Attendance[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [actRes, attRes, txRes] = await Promise.all([
        api.getActivities(),
        api.getAttendances({ user_id: user.id }),
        api.getPointTransactions(user.id),
      ]);
      setActivities(actRes.activities);
      setMyAttendances(attRes.attendances);
      setTransactions(txRes.transactions);
    } catch (e: any) {
      console.error('Error loading student data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user.id]);

  const openActivities = activities.filter((a) => a.status === 'checkin_open');
  const upcomingActivities = activities.filter((a) => a.status === 'scheduled');
  const completedActivities = activities.filter((a) => a.status === 'completed' || a.status === 'checkin_closed');

  // Check which activities this student has already checked into
  const checkedInActivityIds = new Set(myAttendances.map((a) => a.activity_id));

  // Minimum benchmark for semester accreditation (e.g. 15 days CTXH)
  const targetDays = 15.0;
  const progressPercent = Math.min(100, Math.round((user.total_ctxh_days / targetDays) * 100));

  return (
    <div className="space-y-6">
      {/* STUDENT PROFILE & CTXH ACCUMULATION HERO CARD */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Identity info */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-amber-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              Đoàn viên Đoàn khoa Cơ khí
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user.full_name}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <span>Mã ĐV: <strong className="text-white font-mono">{user.code}</strong></span>
              <span>·</span>
              <span>Lớp: <strong className="text-white">{user.class_name}</strong></span>
              <span>·</span>
              <span>{user.branch_name}</span>
            </div>
          </div>

          {/* Accumulated CTXH Days Ring / Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex items-center gap-5 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs text-amber-300 uppercase font-bold tracking-wider block">
                Tổng ngày Công tác xã hội
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                  {user.total_ctxh_days}
                </span>
                <span className="text-xs font-semibold text-slate-300">ngày</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Đã tham gia {myAttendances.length} hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar towards term benchmark */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
          <div className="flex flex-wrap justify-between gap-1 text-xs font-medium text-slate-300">
            <span>Tiến độ tích lũy ngày CTXH năm học (Mục tiêu: {targetDays} ngày)</span>
            <span className="font-mono text-amber-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Big Scanner Button on Hero */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenScanner}
            className="w-full sm:w-auto px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98"
          >
            <QrCode className="w-5 h-5" />
            QUÉT MÃ QR ĐIỂM DANH NGAY
          </button>
          <span className="text-xs text-slate-300">
            {openActivities.length > 0
              ? `🔥 Đang có ${openActivities.length} hoạt động mở điểm danh trực tiếp!`
              : 'Hiện chưa có hoạt động nào phát mã QR.'}
          </span>
        </div>
      </div>

      {/* ACTIVITIES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-900" />
            Hoạt động phong trào Đoàn
          </h3>
          <span className="text-xs text-slate-500">
            Tổng cộng: {activities.length} hoạt động
          </span>
        </div>

        {/* Active Open Activities List */}
        {openActivities.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide block">
              Hoạt động đang mở điểm danh
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openActivities.map((act) => {
                const isCheckedIn = checkedInActivityIds.has(act.id);
                return (
                  <div
                    key={act.id}
                    className="bg-white border-2 border-emerald-500/40 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-500">{act.code}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Đang mở QR
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 leading-snug">
                        {act.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {act.description}
                      </p>

                      <div className="text-xs text-slate-500 space-y-1 pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{act.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-amber-700">
                          <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Mức ghi nhận: +{act.ctxh_days} ngày CTXH</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {isCheckedIn ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          Đã điểm danh hợp lệ
                        </div>
                      ) : (
                        <button
                          onClick={onOpenScanner}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                        >
                          <QrCode className="w-4 h-4" />
                          Quét mã điểm danh
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Activities */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <h4 className="font-bold text-sm text-slate-900">
              Hoạt động sắp diễn ra & đã hoàn thành
            </h4>
          </div>

          <div className="divide-y divide-slate-100">
            {activities
              .filter((a) => a.status !== 'checkin_open')
              .map((act) => {
                const isCheckedIn = checkedInActivityIds.has(act.id);
                return (
                  <div key={act.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold">{act.code}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-amber-700">+{act.ctxh_days} ngày CTXH</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">
                          {act.status === 'scheduled' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm">{act.title}</h5>
                      <span className="text-slate-500 block">{act.location}</span>
                    </div>

                    <div className="shrink-0">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã ghi nhận
                        </span>
                      ) : (
                        <span className="text-slate-400">Chưa tham gia</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* CTXH LEDGER / HISTORY */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-900" />
            <h3 className="font-bold text-base text-slate-900">
              Lịch sử Tích lũy Ngày Công tác xã hội ({transactions.length} giao dịch)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-blue-900">
            Hiện có: {user.total_ctxh_days} ngày
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Chưa có giao dịch tích lũy ngày CTXH nào. Hãy tham gia hoạt động Đoàn để nhận ngày CTXH!
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
                <div className="min-w-0 space-y-0.5">
                  <span className="font-bold text-slate-900 block text-sm">
                    {tx.activity_title}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                    <span className="font-mono">{new Date(tx.created_at).toLocaleString('vi-VN')}</span>
                    <span>·</span>
                    <span>{tx.basis}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-extrabold text-sm text-emerald-700 block">
                    +{tx.ctxh_days} ngày
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Lũy kế: {tx.new_total} ngày
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
