import type { 
  UserProfile, 
  Activity, 
  Attendance, 
  PointTransaction, 
  AuditLog, 
  DashboardStats 
} from '../types/index.ts';

const TOKEN_KEY = 'diemdanhso_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Có lỗi xảy ra trong quá trình xử lý.');
    }
    return data as T;
  },

  // Auth
  async login(identifier: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const data = await this.request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>('/api/auth/me');
  },

  // Users
  async getUsers(): Promise<{ profiles: UserProfile[] }> {
    return this.request<{ profiles: UserProfile[] }>('/api/users');
  },

  async createUser(userData: any): Promise<{ user: UserProfile; defaultPassword?: string }> {
    return this.request<{ user: UserProfile; defaultPassword?: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async bulkCreateUsers(rows: any[]): Promise<{
    added: number;
    errors: string[];
    created: { code: string; full_name: string; username: string }[];
    defaultPassword?: string;
  }> {
    return this.request<{
      added: number;
      errors: string[];
      created: { code: string; full_name: string; username: string }[];
      defaultPassword?: string;
    }>('/api/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  async updateUserStatus(id: string, status: 'active' | 'locked'): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async resetUserPassword(id: string): Promise<{ success: boolean; defaultPassword: string; user: UserProfile }> {
    return this.request<{ success: boolean; defaultPassword: string; user: UserProfile }>(
      `/api/users/${id}/reset-password`,
      { method: 'POST' }
    );
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/users/${id}`, { method: 'DELETE' });
  },

  // Activities
  async getActivities(): Promise<{ activities: Activity[] }> {
    return this.request<{ activities: Activity[] }>('/api/activities');
  },

  async getActivity(id: string): Promise<{ activity: Activity }> {
    return this.request<{ activity: Activity }>(`/api/activities/${id}`);
  },

  async createActivity(activityData: Partial<Activity>): Promise<{ activity: Activity }> {
    return this.request<{ activity: Activity }>('/api/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  },

  async updateActivity(id: string, updates: Partial<Activity>): Promise<{ activity: Activity }> {
    return this.request<{ activity: Activity }>(`/api/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Dynamic QR
  async openQRSession(activity_id: string, interval_seconds: number = 30): Promise<{ session: any }> {
    return this.request<{ session: any }>('/api/qr/open', {
      method: 'POST',
      body: JSON.stringify({ activity_id, interval_seconds }),
    });
  },

  async closeQRSession(activity_id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/qr/close', {
      method: 'POST',
      body: JSON.stringify({ activity_id }),
    });
  },

  async getQRToken(activityId: string): Promise<{
    token: string;
    expires_at: number;
    remaining_seconds: number;
    interval_seconds: number;
    activity: Activity;
    total_checked_in: number;
  }> {
    return this.request(`/api/qr/token/${activityId}`);
  },

  // Attendance
  async checkIn(data: {
    activity_id: string;
    token: string;
    gpsCoords?: { latitude: number; longitude: number; accuracy?: number };
    photoBase64?: string;
  }): Promise<{ success: boolean; message: string; attendance: Attendance; awardedDays: number }> {
    return this.request('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAttendances(params?: { activity_id?: string; user_id?: string }): Promise<{ attendances: Attendance[] }> {
    const query = new URLSearchParams();
    if (params?.activity_id) query.append('activity_id', params.activity_id);
    if (params?.user_id) query.append('user_id', params.user_id);
    return this.request(`/api/attendance?${query.toString()}`);
  },

  // Transactions & Stats
  async getPointTransactions(user_id?: string): Promise<{ transactions: PointTransaction[] }> {
    const query = user_id ? `?user_id=${user_id}` : '';
    return this.request(`/api/point-transactions${query}`);
  },

  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return this.request('/api/audit-logs');
  },

  async getDashboardStats(): Promise<{ stats: DashboardStats }> {
    return this.request('/api/stats/dashboard');
  },

  async getTrafficStats(): Promise<{ stats: any }> {
    return this.request('/api/stats/traffic');
  },

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/demo/reset', {
      method: 'POST',
    });
  },

  getExportCsvUrl(activity_id?: string, class_name?: string): string {
    const query = new URLSearchParams();
    if (activity_id) query.append('activity_id', activity_id);
    if (class_name) query.append('class_name', class_name);
    return `/api/reports/export-csv?${query.toString()}`;
  }
};
