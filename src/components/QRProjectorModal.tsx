import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import type { Activity, Attendance } from '../types/index.ts';
import { api } from '../services/api.ts';
import { Maximize2, Minimize2, X, RefreshCw, Users, ShieldAlert, Clock, MapPin, Award } from 'lucide-react';

interface QRProjectorModalProps {
  activity: Activity;
  onClose: () => void;
  onSessionEnded: () => void;
}

export const QRProjectorModal: React.FC<QRProjectorModalProps> = ({
  activity,
  onClose,
  onSessionEnded,
}) => {
  const [token, setToken] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(30);
  const [totalCheckedIn, setTotalCheckedIn] = useState<number>(0);
  const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch token and attendances periodically
  const fetchQRState = async () => {
    try {
      const data = await api.getQRToken(activity.id);
      setToken(data.token);
      setRemainingSeconds(data.remaining_seconds);
      setIntervalSeconds(data.interval_seconds);
      setTotalCheckedIn(data.total_checked_in);

      // Generate QR image
      const dataUrl = await QRCode.toDataURL(data.token, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);

      // Fetch live attendances
      const attRes = await api.getAttendances({ activity_id: activity.id });
      setRecentAttendances(attRes.attendances.slice(0, 5));
      setLoading(false);
    } catch (err: any) {
      console.error('Error getting dynamic QR:', err);
    }
  };

  useEffect(() => {
    fetchQRState();

    // 1-second countdown interval
    const countdownTimer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          fetchQRState(); // Expired -> refresh token
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    // Live refresh every 4 seconds for attendees list
    const syncInterval = setInterval(() => {
      fetchQRState();
    }, 4000);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(syncInterval);
    };
  }, [activity.id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCloseSession = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn ĐÓNG điểm danh? Mã QR sẽ bị thu hồi và không thể tiếp tục quét!')) {
      return;
    }
    setIsClosing(true);
    try {
      await api.closeQRSession(activity.id);
      onSessionEnded();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đóng điểm danh.');
    } finally {
      setIsClosing(false);
    }
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (remainingSeconds / intervalSeconds) * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        ref={containerRef}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh]"
      >
        {/* Header Bar */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black">
              QR
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">
                MÀN HÌNH ĐIỂM DANH TRÌNH CHIẾU · ĐOÀN KHOA CƠ KHÍ
              </span>
              <h2 className="text-lg sm:text-xl font-bold leading-tight line-clamp-1">
                {activity.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình trình chiếu'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center flex-1 overflow-y-auto">
          {/* Left: QR Display & Countdown */}
          <div className="md:col-span-7 flex flex-col items-center text-center">
            {/* QR Container */}
            <div className="relative p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-lg mb-4">
              {loading || !qrDataUrl ? (
                <div className="w-64 h-64 sm:w-80 sm:h-80 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-sm">Đang tạo mã QR động...</span>
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt="Dynamic QR Code"
                  className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-xl select-none"
                />
              )}

              {/* Watermark brand inside QR center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/95 border-2 border-blue-900 shadow-md flex items-center justify-center">
                  <span className="text-[10px] font-black text-blue-900">KGC</span>
                </div>
              </div>
            </div>

            {/* Countdown Ring & Timer */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-2xl">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    stroke="#e2e8f0"
                    strokeWidth="3.5"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    stroke={remainingSeconds <= 5 ? '#ef4444' : '#2563eb'}
                    strokeWidth="3.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 19}
                    strokeDashoffset={2 * Math.PI * 19 - (remainingSeconds / intervalSeconds) * 2 * Math.PI * 19}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="absolute font-mono font-bold text-sm text-slate-800">
                  {remainingSeconds}s
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-800 block">
                  Mã QR tự động đổi sau {intervalSeconds} giây
                </span>
                <span className="text-[11px] text-slate-500">
                  Chống chia sẻ ảnh chụp và quét lại mã cũ
                </span>
              </div>
            </div>
          </div>

          {/* Right: Activity Details & Realtime Participants */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {/* Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium text-slate-900">{activity.location}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Ghi nhận: <strong className="text-blue-900 font-bold text-sm">+{activity.ctxh_days} ngày CTXH</strong>
                </span>
              </div>

              {activity.gps_required && (
                <div className="text-[11px] text-slate-500 bg-blue-50/80 p-2 rounded-lg border border-blue-100">
                  <strong>Bắt buộc GPS:</strong> Bán kính {activity.gps_radius_meters}m quanh địa điểm tổ chức.
                </div>
              )}

              {activity.photo_required && (
                <div className="text-[11px] text-slate-500 bg-amber-50/80 p-2 rounded-lg border border-amber-100">
                  <strong>Bắt buộc ảnh:</strong> Chụp trực tiếp qua camera ứng dụng tại địa điểm.
                </div>
              )}
            </div>

            {/* Attendance Counter */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 block uppercase">
                  Đã điểm danh hợp lệ
                </span>
                <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                  {totalCheckedIn} <span className="text-sm font-normal text-emerald-600">đoàn viên</span>
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Live Feed */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Vừa điểm danh gần nhất
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {recentAttendances.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Chưa có lượt điểm danh nào.
                  </div>
                ) : (
                  recentAttendances.map((att) => (
                    <div
                      key={att.id}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{att.user_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {att.user_code} · {att.class_name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-600 font-medium">
                        {new Date(att.checkin_time).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Close */}
            <button
              onClick={handleCloseSession}
              disabled={isClosing}
              className="mt-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" />
              {isClosing ? 'Đang đóng...' : 'Đóng điểm danh & Thu hồi mã QR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
