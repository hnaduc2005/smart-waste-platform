import axios from 'axios';
import { tokenStore } from './tokenStore';

const API_BASE = '/api/v1';

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

  getUser: (userId: string) =>
    api.get(`/users/${userId}`).then(r => r.data),

  getCollectors: () =>
    api.get(`/users/collectors`).then(r => r.data),
};

export default api;
