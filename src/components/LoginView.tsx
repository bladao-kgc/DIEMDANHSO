import React, { useState } from 'react';
import type { UserProfile } from '../types/index.ts';
import { api } from '../services/api.ts';
import { YouthUnionLogo } from './YouthUnionLogo.tsx';
import { Shield, Users, Award, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(identifier.trim());
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(demoId);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto my-auto space-y-6">
        {/* Brand & Emblem Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <YouthUnionLogo size={68} />
          </div>

          <div>
            <span className="text-xs font-bold text-amber-600 tracking-wider uppercase block">
              Đoàn trường Cao đẳng Kiên Giang
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight uppercase mt-0.5">
              ĐIỂM DANH SỐ
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Hệ thống điểm danh QR động & Quản lý ngày Công tác xã hội
              <br />
              <strong className="text-slate-700">Đoàn khoa Cơ khí</strong>
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1.5">
                Tài khoản Đoàn viên / Cán bộ
              </label>
              <input
                type="text"
                required
                placeholder="Nhập mã ĐV (vd: CK2301) hoặc email KGC..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Hệ thống tự động xác định vai trò sau khi xác thực.
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wide text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                DỮ LIỆU DEMO KIỂM THỬ
              </span>
              <span className="text-[11px]">Bấm vào để thử nghiệm ngay:</span>
            </div>

            <div className="space-y-2">
              {/* ADMIN Quick Login */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('bladao@kgc.edu.vn')}
                className="w-full p-2.5 bg-slate-50 hover:bg-red-50/70 border border-slate-200 hover:border-red-200 rounded-xl flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                    AD
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      Bành Lê Anh Đào · Bí thư Đoàn khoa
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Vai trò ADMIN · bladao@kgc.edu.vn
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-900">Vào quản trị</span>
              </button>

              {/* CANBO Quick Login */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('thtkha@kgc.edu.vn')}
                className="w-full p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 rounded-xl flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    CB
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      Trương Hoàng Trung Kha · Cán bộ Đoàn
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Vai trò CANBO · Quản lý hoạt động & QR
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-900">Vào điều hành</span>
              </button>

              {/* DVTN Quick Login Options from User List */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Đoàn viên thanh niên (Danh sách chính thức cấp tài khoản):
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('CK24KL3135')}
                    className="w-full p-2 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-200 rounded-xl flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        ĐV
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Danh Minh Trí</span>
                        <span className="text-[10px] text-slate-500 font-mono">CK24KL3135 · Lớp CGKL 9+K5</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">Đăng nhập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('CK24OT3319')}
                    className="w-full p-2 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-200 rounded-xl flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        ĐV
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Bùi Vĩ Khiêm</span>
                        <span className="text-[10px] text-slate-500 font-mono">CK24OT3319 · Lớp CN ÔTÔ 3 9+K5</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">Đăng nhập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('CX26OT2208')}
                    className="w-full p-2 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-200 rounded-xl flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        ĐV
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Nguyễn Minh Hiếu</span>
                        <span className="text-[10px] text-slate-500 font-mono">CX26OT2208 · Lớp CN ÔTÔ 2 K20</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">Đăng nhập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('CK26LTOT53')}
                    className="w-full p-2 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-200 rounded-xl flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        ĐV
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Phạm Chí Nghĩa</span>
                        <span className="text-[10px] text-slate-500 font-mono">CK26LTOT53 · Lớp CN ÔTÔ 2 9+K4 (LT)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">Đăng nhập</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slogan */}
        <div className="text-center">
          <span className="text-[14pt] font-bold text-blue-900 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 inline-block leading-normal">
            Kết nối đoàn viên - Số hóa hoạt động
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 max-w-2xl mx-auto">
        <p className="font-semibold text-slate-700 text-[14pt] leading-relaxed">
          Được phát triển bởi Đoàn khoa Cơ khí trực thuộc Đoàn trường Cao đẳng Kiên Giang.
        </p>
      </footer>
    </div>
  );
};
