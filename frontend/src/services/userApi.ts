import axios from 'axios';
import { tokenStore } from './tokenStore';

const API_BASE = 'http://localhost:8082/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const userApi = {
  getProfile: (userId: string) =>
    api.get(`/users/${userId}`).then(r => r.data),

  updateProfile: (userId: string, data: any) =>
    api.put(`/users/${userId}`, data).then(r => r.data),
};

export default api;
