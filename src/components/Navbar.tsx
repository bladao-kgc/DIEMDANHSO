import React from 'react';
import type { UserProfile, UserRole } from '../types/index.ts';
import { YouthUnionLogo } from './YouthUnionLogo.tsx';
import { LogOut, UserCheck, Shield, Award, Users } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onTabChange,
  onLogout,
}) => {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Quản trị viên (Bí thư)', bg: 'bg-red-50 text-red-700 border border-red-200' };
      case 'CANBO':
        return { label: 'Cán bộ Đoàn', bg: 'bg-blue-50 text-blue-700 border border-blue-200' };
      case 'DVTN':
        return { label: 'Đoàn viên thanh niên', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single Brand element */}
        <div className="flex items-center gap-3 shrink-0">
          <YouthUnionLogo size={36} />
          <div className="flex flex-col">
            <span className="font-extrabold text-blue-900 text-base sm:text-lg leading-tight tracking-tight uppercase">
              Điểm Danh Số
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              Đoàn khoa Cơ khí · CĐ Kiên Giang
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links based on role */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {user.role === 'ADMIN' && (
            <>
              <button
                onClick={() => onTabChange('overview')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'overview' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Tổng quan & Hoạt động
              </button>
              <button
                onClick={() => onTabChange('users')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'users' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Quản lý Đoàn viên
              </button>
              <button
                onClick={() => onTabChange('reports')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'reports' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Báo cáo & CTXH
              </button>
              <button
                onClick={() => onTabChange('logs')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'logs' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Nhật ký & Hệ thống
              </button>
            </>
          )}

          {user.role === 'CANBO' && (
            <>
              <button
                onClick={() => onTabChange('activities')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'activities' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Hoạt động được giao
              </button>
              <button
                onClick={() => onTabChange('reports')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'reports' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Báo cáo & Danh sách tham gia
              </button>
            </>
          )}

          {user.role === 'DVTN' && (
            <>
              <button
                onClick={() => onTabChange('my-space')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'my-space' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Trang cá nhân
              </button>
              <button
                onClick={() => onTabChange('activities')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'activities' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Hoạt động Đoàn
              </button>
              <button
                onClick={() => onTabChange('history')}
                className={`py-1 hover:text-blue-900 transition-colors whitespace-nowrap ${
                  currentTab === 'history' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
                }`}
              >
                Lịch sử ngày CTXH
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Active User & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {user.full_name}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.bg}`}>
                {badge.label}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{user.code}</span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-300 font-bold text-xs flex items-center justify-center shadow-xs border border-blue-800">
            {user.full_name.charAt(0)}
          </div>

          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
