import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = 'http://localhost:8084/api/v1/rewards';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(config => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface RewardHistory {
  id: string;
  citizenId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  citizenId: string;
  username: string; // May need to fetch from user-service or reward-service returns it
  totalPoints: number;
  rank: number;
}

export const rewardApi = {
  getLeaderboard: (): Promise<LeaderboardEntry[]> => 
    api.get('/leaderboard').then(res => res.data),
    
  getHistory: (citizenId: string): Promise<RewardHistory[]> => 
    api.get(`/${citizenId}/history`).then(res => res.data),
};
