import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = 'http://localhost:8080/api/v1/analytics';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(config => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const analyticsApi = {
  getDashboardData: () => api.get('/dashboard').then(res => res.data),
  getUserStats: (userId: string) => api.get(`/user/${userId}`).then(res => res.data),
};
