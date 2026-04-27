import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = '/api/v1/analytics';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface DistrictStat {
  name: string;
  total: number;
  efficiency: number;
}

export interface WeeklyDay {
  name: string;       // "T2" ... "CN"
  organic: number;
  recycle: number;
  hazardous: number;
  electronic?: number;
  bulky?: number;
}

export interface DashboardData {
  districts: DistrictStat[];
  weekly: WeeklyDay[];
}

export interface PersonalDistributionItem {
  name: string;   // "Tái chế" | "Hữu cơ" | "Độc hại"
  value: number;
}

export interface ComparisonItem {
  name: string;
  user: number;
  average: number;
}

export interface UserAnalyticsData {
  personalDistribution: PersonalDistributionItem[];
  totalWeight: number;
  co2Saved: number;
  comparisonData: ComparisonItem[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  totalWeight: number;
}

export const analyticsApi = {
  /** Lấy dữ liệu tổng quan hệ thống (admin/enterprise dashboard) */
  getDashboardData: (): Promise<DashboardData> =>
    api.get('/dashboard').then(res => res.data),

  /** Lấy phân tích cá nhân cho một Citizen */
  getUserStats: (userId: string): Promise<UserAnalyticsData> =>
    api.get(`/user/${userId}`).then(res => res.data),

  /**
   * Lấy bảng xếp hạng Top 10 người dùng.
   * @param district tên quận để lọc (ví dụ "Q1"), hoặc undefined để lấy toàn hệ thống.
   */
  getLeaderboard: (district?: string): Promise<LeaderboardEntry[]> =>
    api.get('/leaderboard', { params: district ? { district } : undefined })
       .then(res => res.data),
};
