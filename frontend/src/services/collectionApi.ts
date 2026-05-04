import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = '/api/v1/collections';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(config => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const collectionApi = {
  createRequest: (data: { citizenId: string; type: string; location: string; description?: string; imageUrl?: string }) => 
    api.post('/request', data).then(res => res.data),

  createRequestWithImage: (citizenId: string, location: string, description: string, image: File) => {
    const formData = new FormData();
    formData.append('citizenId', citizenId);
    formData.append('location', location);
    if (description) formData.append('description', description);
    formData.append('image', image);
    return api.post('/requests/with-image', formData).then(res => res.data);
  },
    
  getCitizenRequests: (citizenId: string) => 
    api.get(`/requests/citizen/${citizenId}`).then(res => res.data),

  getCitizenCompletedTasks: (citizenId: string) =>
    api.get(`/tasks/citizen/${citizenId}/history`).then(res => res.data),

  getAllRequests: (status?: string, district?: string) => {
    const params: any = {};
    if (status) params.status = status;
    if (district) params.district = district;
    return api.get('/requests', { params }).then(res => res.data);
  },

  rejectRequest: (requestId: string) =>
    api.patch(`/requests/${requestId}/reject`).then(res => res.data),
    
  getPendingRequests: () => 
    api.get('/requests/pending').then(res => res.data),
    
  assignTask: (data: { requestId: string; collectorId: string; enterpriseName?: string }) => 
    api.post('/tasks/assign', data).then(res => res.data),
    
  getCollectorTasks: (collectorId: string) => 
    api.get(`/tasks/collector/${collectorId}`).then(r => r.data),

  getCollectorHistory: (collectorId: string) =>
    api.get(`/tasks/collector/${collectorId}/history`).then(r => r.data),

  getEnterpriseHistory: (enterpriseName: string, collectorIds?: string[]) => {
    const params = new URLSearchParams();
    if (collectorIds && collectorIds.length > 0) {
      collectorIds.forEach(id => params.append('collectorIds', id));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/tasks/enterprise/${encodeURIComponent(enterpriseName)}/history${query}`).then(r => r.data);
  },
    
  updateTaskStatus: (taskId: string, status: string) =>
    api.patch(`/tasks/${taskId}/status?status=${status}`).then(r => r.data),
    
  confirmCollection: (taskId: string, data: { photoUrl: string; weight: number; isValid?: boolean }) => 
    api.post(`/tasks/${taskId}/confirm`, data).then(res => res.data),

  /** Lấy tất cả task đang ON_THE_WAY — dùng cho enterprise fleet status */
  getActiveTasks: () =>
    api.get('/tasks/active').then(r => r.data),
};
