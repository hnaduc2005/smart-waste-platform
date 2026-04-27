import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = '/api/v1/rewards';

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
  amount: number;
  reason: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  citizenId: string;
  citizenName: string;
  totalPoints: number;
  rank: number;
}

export const rewardApi = {
  getLeaderboard: (): Promise<LeaderboardEntry[]> => 
    api.get('/leaderboard').then(res => res.data),
    
  getHistory: (citizenId: string): Promise<RewardHistory[]> => 
    api.get(`/${citizenId}/history`).then(res => res.data),

  redeemReward: (data: { citizenId: string, cost: number, rewardTitle: string }): Promise<any> =>
    api.post('/redeem', data).then(res => res.data),
};
