import axios from 'axios';
import { tokenStore } from './tokenStore';

const api = axios.create({ baseURL: '/api/v1' });
api.interceptors.request.use(cfg => {
  const t = tokenStore.getAccessToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const adminApi = {
  // Dashboard
  getStats: () => api.get('/admin/dashboard/stats').then(r => r.data),
  getCharts: () => api.get('/admin/dashboard/charts').then(r => r.data),
  getRecentUsers: () => api.get('/admin/dashboard/users/recent').then(r => r.data),

  // Users — từ auth-service (có email, createdAt, status, role đầy đủ)
  getAllUsers: (role = 'ALL') => api.get('/admin/dashboard/users', { params: { role } }).then(r => r.data),
  lockUser: (userId: string, locked: boolean) =>
    api.put(`/admin/dashboard/users/${userId}/lock`, { locked }).then(r => r.data),
  changeRole: (userId: string, role: string) =>
    api.put(`/admin/dashboard/users/${userId}/role`, { role }).then(r => r.data),

  // Complaints
  getComplaints: () => api.get('/complaints').then(r => r.data),
  createComplaint: (data: any) => api.post('/complaints', data).then(r => r.data),
  resolveComplaint: (id: string, adminNote: string, status = 'RESOLVED', resolvedBy?: string) =>
    api.put(`/complaints/${id}/resolve`, { adminNote, status, resolvedBy }).then(r => r.data),
  getMyCitizenComplaints: (citizenId: string) =>
    api.get(`/complaints/me/${citizenId}`).then(r => r.data),

  // Enterprise info (for contact panel)
  getEnterprises: () => api.get('/users/enterprises').then(r => r.data),
};
