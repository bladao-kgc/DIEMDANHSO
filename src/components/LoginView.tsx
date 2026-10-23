import React, { useState } from 'react';
import type { UserProfile } from '../types/index.ts';
import { api } from '../services/api.ts';
import { YouthUnionLogo } from './YouthUnionLogo.tsx';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const DEFAULT_PASSWORD = 'Kgc@2410';
const LAST_IDENTIFIER_KEY = 'dds_last_identifier';

const ROLE_GUIDE = [
  {
    code: 'ADMIN',
    label: 'Quản trị viên',
    desc: 'Cấp tài khoản, quản lý đoàn viên, nhật ký hệ thống',
    accent: 'border-red-400/30 bg-red-500/10 text-red-100',
    dot: 'bg-red-400',
  },
  {
    code: 'CANBO',
    label: 'Cán bộ Đoàn',
    desc: 'Tạo hoạt động, mở – đóng điểm danh QR, xuất báo cáo',
    accent: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
    dot: 'bg-sky-400',
  },
  {
    code: 'DVTN',
    label: 'Đoàn viên',
    desc: 'Trang cá nhân, quét QR điểm danh, tra cứu ngày CTXH',
    accent: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
    dot: 'bg-emerald-400',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState<string>(() => {
    try {
      return localStorage.getItem(LAST_IDENTIFIER_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = identifier.trim();

    if (!name) {
      setError('Vui lòng nhập họ và tên viết tắt của bạn.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(name, password);
      try {
        localStorage.setItem(LAST_IDENTIFIER_KEY, name);
      } catch {
        /* ignore */
      }
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* ================= PANEL THƯƠNG HIỆU ================= */}
        <aside className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white px-6 py-8 sm:px-10 lg:px-14 lg:py-12 flex flex-col justify-between">
          {/* Họa tiết nền */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative space-y-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/95 p-2 shadow-lg shadow-blue-950/40">
                <YouthUnionLogo size={44} />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  Đoàn trường Cao đẳng Kiên Giang
                </p>
                <p className="text-sm font-semibold text-blue-100">Đoàn khoa Cơ khí</p>
              </div>
            </div>

            <div className="space-y-3 max-w-lg">
              <h1 className="text-3xl sm:text-4xl font-extrabold uppercase leading-tight tracking-tight">
                Hệ thống <span className="text-amber-300">Điểm danh số</span>
              </h1>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
                Điểm danh QR động, xác thực GPS thực địa và ảnh minh chứng — quản lý ngày
                Công tác xã hội minh bạch, chính xác cho đoàn viên khoa Cơ khí.
              </p>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg text-[13px]">
              {[
                { icon: QrCode, text: 'Mã QR động đổi liên tục' },
                { icon: MapPin, text: 'Xác thực GPS trong bán kính' },
                { icon: Camera, text: 'Ảnh minh chứng có dấu thời gian' },
                { icon: ShieldCheck, text: 'Phân quyền theo tài khoản được cấp' },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4 shrink-0 text-amber-300" />
                  <span className="text-blue-50">{text}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 max-w-lg">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/70">
                Hệ thống tự nhận diện quyền truy cập
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLE_GUIDE.map((role) => (
                  <div
                    key={role.code}
                    className={`rounded-xl border px-3 py-2.5 backdrop-blur-sm ${role.accent}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">{role.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug opacity-80">{role.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-8 hidden lg:block">
            <p className="text-xs font-semibold text-blue-200/80">
              ★ Kết nối đoàn viên – Số hóa hoạt động ★
            </p>
          </div>
        </aside>

        {/* ================= FORM ĐĂNG NHẬP ================= */}
        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md space-y-5">
            {/* Logo cho mobile */}
            <div className="flex items-center gap-3 lg:hidden">
              <YouthUnionLogo size={40} />
              <div className="leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                  Đoàn khoa Cơ khí
                </p>
                <p className="text-lg font-extrabold uppercase text-blue-900">Điểm danh số</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-800">
                  <KeyRound className="h-3 w-3" />
                  Cổng đăng nhập tài khoản
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Đăng nhập hệ thống
                </h2>
                <p className="text-xs text-slate-500">
                  Dành cho tài khoản đã được Đoàn khoa cấp. Vai trò và quyền hạn được xác định
                  tự động theo tài khoản.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                {/* Họ tên viết tắt */}
                <div>
                  <label htmlFor="identifier" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Họ và tên viết tắt
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="identifier"
                      type="text"
                      inputMode="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Ví dụ: bladao, thtkha, blad"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm font-medium transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Nhập tên tài khoản được cấp hoặc chữ cái đầu họ tên (bỏ dấu, không cách).
                  </span>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-11 text-sm font-medium transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                    <Info className="h-3 w-3" />
                    Mật khẩu mặc định do Đoàn khoa cấp:
                    <strong className="font-semibold text-slate-600">{DEFAULT_PASSWORD}</strong>
                  </span>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60"
                >
                  {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Phân quyền sau khi đăng nhập
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Hệ thống đối chiếu tài khoản với danh sách đã cấp và tự mở đúng không gian làm việc:
                  <strong className="text-slate-700"> Quản trị viên</strong>,
                  <strong className="text-slate-700"> Cán bộ Đoàn</strong> hoặc
                  <strong className="text-slate-700"> Đoàn viên</strong>.
                </p>
              </div>
            </div>

            <div className="text-center text-[11px] leading-relaxed text-slate-500">
              <p>
                Quên hoặc cần cấp lại mật khẩu? Liên hệ Văn phòng Đoàn khoa Cơ khí
                <br />
                để được hỗ trợ cấp lại mật khẩu mặc định.
              </p>
              <p className="mt-2 text-[10px] text-slate-400">
                Được phát triển bởi Đoàn khoa Cơ khí – Đoàn trường Cao đẳng Kiên Giang.
              </p>
            </div>
          </div>
<<<<<<< HEAD
        </main>
      </div>
=======
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
>>>>>>> 9c6c94357c6fdb244f9f4fe7c559adab50907a32
    </div>
  );
};
