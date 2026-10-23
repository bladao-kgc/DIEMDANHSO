import React from 'react';
import type { UserRole } from '../types/index.ts';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  QrCode, 
  Calendar, 
  History, 
  UserCheck,
  BarChart3
} from 'lucide-react';

interface BottomNavProps {
  role: UserRole;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenScanner?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  currentTab,
  onTabChange,
  onOpenScanner,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {role === 'ADMIN' && (
          <>
            <button
              onClick={() => onTabChange('overview')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'overview' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[9px] tracking-tight mt-1 whitespace-nowrap">Tổng quan</span>
            </button>
            <button
              onClick={() => onTabChange('users')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'users' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[9px] tracking-tight mt-1 whitespace-nowrap">Đoàn viên</span>
            </button>
            <button
              onClick={() => onTabChange('reports')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'reports' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[9px] tracking-tight mt-1 whitespace-nowrap">Báo cáo</span>
            </button>
            <button
              onClick={() => onTabChange('traffic')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'traffic' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[9px] tracking-tight mt-1 whitespace-nowrap">Truy cập</span>
            </button>
            <button
              onClick={() => onTabChange('logs')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'logs' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[9px] tracking-tight mt-1 whitespace-nowrap">Nhật ký</span>
            </button>
          </>
        )}

        {role === 'CANBO' && (
          <>
            <button
              onClick={() => onTabChange('activities')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'activities' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Hoạt động</span>
            </button>
            <button
              onClick={() => onTabChange('reports')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'reports' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Báo cáo</span>
            </button>
            <button
              onClick={() => onTabChange('users')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'users' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Đoàn viên</span>
            </button>
            <button
              onClick={() => onTabChange('overview')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'overview' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Tổng quan</span>
            </button>
          </>
        )}

        {role === 'DVTN' && (
          <>
            <button
              onClick={() => onTabChange('my-space')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'my-space' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Cá nhân</span>
            </button>
            <button
              onClick={() => onTabChange('activities')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'activities' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Hoạt động</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-amber-500 font-extrabold"
            >
              <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-400 flex items-center justify-center shadow-xs">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap text-blue-900 font-bold">Quét QR</span>
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                currentTab === 'history' ? 'text-blue-900 font-bold' : 'text-slate-500'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Ngày CTXH</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
