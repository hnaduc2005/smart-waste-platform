import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = 'http://localhost:8080/api/v1/collections';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(config => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const collectionApi = {
  createRequest: (data: { citizenId: string; type: string; location: string; imageUrl?: string }) => 
    api.post('/request', data).then(res => res.data),

  createRequestWithImage: (citizenId: string, location: string, image: File) => {
    const formData = new FormData();
    formData.append('citizenId', citizenId);
    formData.append('location', location);
    formData.append('image', image);
    return api.post('/requests/with-image', formData).then(res => res.data);
  },
    
  getCitizenRequests: (citizenId: string) => 
    api.get(`/requests/citizen/${citizenId}`).then(res => res.data),
    
  getPendingRequests: () => 
    api.get('/requests/pending').then(res => res.data),
    
  assignTask: (data: { requestId: string; collectorId: string }) => 
    api.post('/tasks/assign', data).then(res => res.data),
    
  getCollectorTasks: (collectorId: string) => 
    api.get(`/tasks/collector/${collectorId}`).then(res => res.data),
    
  confirmCollection: (taskId: string, data: { photoUrl: string; weight: number }) => 
    api.post(`/tasks/${taskId}/confirm`, data).then(res => res.data),
};
