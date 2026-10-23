import React, { useState, useEffect } from 'react';
import type { UserProfile, UserRole, Activity, Attendance } from './types/index.ts';
import { api } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { LoginView } from './components/LoginView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { StudentPortal } from './components/StudentPortal.tsx';
import { QRProjectorModal } from './components/QRProjectorModal.tsx';
import { StudentScannerModal } from './components/StudentScannerModal.tsx';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Modals
  const [projectorActivity, setProjectorActivity] = useState<Activity | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [activeActivities, setActiveActivities] = useState<Activity[]>([]);

  // Check current session on mount
  const checkSession = async () => {
    setLoading(true);
    try {
      if (api.getToken()) {
        const res = await api.getMe();
        setCurrentUser(res.user);
        setInitialTabForRole(res.user.role);
      } else {
        // Default to admin demo user for immediate review, or let user log in
        const res = await api.login('bladao@kgc.edu.vn');
        setCurrentUser(res.user);
        setInitialTabForRole(res.user.role);
      }
    } catch {
      api.removeToken();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const setInitialTabForRole = (role: UserRole) => {
    if (role === 'ADMIN') setCurrentTab('overview');
    else if (role === 'CANBO') setCurrentTab('activities');
    else setCurrentTab('my-space');
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Fetch active activities for scanner
  const fetchActiveActivities = async () => {
    try {
      const res = await api.getActivities();
      setActiveActivities(res.activities.filter((a) => a.status === 'checkin_open'));
    } catch (e) {
      console.error('Error fetching activities:', e);
    }
  };

  useEffect(() => {
    fetchActiveActivities();
  }, [currentUser]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setInitialTabForRole(user.role);
    fetchActiveActivities();
  };

  const handleLogout = () => {
    api.removeToken();
    setCurrentUser(null);
  };

  const handleSwitchDemoRole = async (targetRole: UserRole) => {
    try {
      let identifier = 'bladao@kgc.edu.vn'; // ADMIN
      if (targetRole === 'CANBO') identifier = 'thtkha@kgc.edu.vn';
      if (targetRole === 'DVTN') identifier = 'CK2301';

      const res = await api.login(identifier);
      setCurrentUser(res.user);
      setInitialTabForRole(res.user.role);
      fetchActiveActivities();
    } catch (e: any) {
      alert(e.message || 'Lỗi chuyển vai trò demo.');
    }
  };

  const handleOpenScanner = async () => {
    await fetchActiveActivities();
    setIsScannerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
        <span className="text-xs font-semibold text-slate-600">
          Đang tải hệ thống Điểm Danh Số...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <div>
        {/* Top Navbar */}
        <Navbar
          user={currentUser}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onLogout={handleLogout}
          onSwitchDemoRole={handleSwitchDemoRole}
        />

        {/* Main Content Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-12">
          {currentUser.role === 'ADMIN' && (
            <AdminDashboard
              currentUser={currentUser}
              currentTab={currentTab}
              onOpenQRProjector={(act) => setProjectorActivity(act)}
              onTabChange={setCurrentTab}
            />
          )}

          {currentUser.role === 'CANBO' && (
            <AdminDashboard
              currentUser={currentUser}
              currentTab={currentTab}
              onOpenQRProjector={(act) => setProjectorActivity(act)}
              onTabChange={setCurrentTab}
            />
          )}

          {currentUser.role === 'DVTN' && (
            <StudentPortal
              user={currentUser}
              currentTab={currentTab}
              onOpenScanner={handleOpenScanner}
              onRefreshUser={async () => {
                const res = await api.getMe();
                setCurrentUser(res.user);
              }}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Được phát triển bởi Đoàn khoa Cơ khí trực thuộc Đoàn trường Cao đẳng Kiên Giang.
          </p>
          <p className="text-slate-400 font-medium">
            Khẩu hiệu: <span className="text-blue-900 font-bold">Kết nối đoàn viên - Số hóa hoạt động</span>
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Hệ thống điểm danh QR động và quản lý ngày Công tác xã hội · Tương thích Microsoft Excel
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        role={currentUser.role}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenScanner={handleOpenScanner}
      />

      {/* MODAL: MÀN HÌNH CHIẾU QR ĐỘNG CHO CÁN BỘ / ADMIN */}
      {projectorActivity && (
        <QRProjectorModal
          activity={projectorActivity}
          onClose={() => setProjectorActivity(null)}
          onSessionEnded={() => {
            fetchActiveActivities();
          }}
        />
      )}

      {/* MODAL: QUÉT QR & KIỂM TRA THỰC ĐỊA CHO ĐOÀN VIÊN */}
      {isScannerOpen && (
        <StudentScannerModal
          user={currentUser}
          activeActivities={activeActivities}
          onClose={() => setIsScannerOpen(false)}
          onSuccess={async (att, days) => {
            // Refresh user profile to reflect newly awarded CTXH days
            const res = await api.getMe();
            setCurrentUser(res.user);
          }}
        />
      )}
    </div>
  );
}
