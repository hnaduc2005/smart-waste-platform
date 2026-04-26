import axios from 'axios';
import { tokenStore } from './tokenStore';

const API_BASE = '/api/v1';

// ── Axios instance ────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → clear tokens (token expired or blacklisted)
// Skip redirect if already on /login (e.g. wrong credentials on login form)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      tokenStore.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Helper: extract error message ────────────────────────────────
export const extractError = (err: any) => {
  const data = err?.response?.data;
  return {
    message:  data?.message || err.message || 'Lỗi không xác định',
    details:  data?.details || null,
    status:   err?.response?.status,
  };
};

// ── Auth API ─────────────────────────────────────────────────────
export const authApi = {
  register: ({ username, email, password, role }: any) =>
    api.post('/auth/register', { username, email, password, role }).then(r => r.data),

  login: ({ username, password }: any) =>
    api.post('/auth/login', { username, password }).then(r => r.data),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh-token', { refreshToken }).then(r => r.data),

  logout: () =>
    api.post('/auth/logout').then(r => r.data).catch(() => {}),

  getMe: () =>
    api.get('/auth/me').then(r => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: ({ email, otp, newPassword }: any) =>
    api.post('/auth/reset-password', { email, otp, newPassword }).then(r => r.data),
};

export default api;
