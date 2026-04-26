import api from './authApi';

export const notificationApi = {
  getMine: () => api.get('/notifications/my').then(r => r.data),
  
  create: (data: any) => api.post('/notifications', data).then(r => r.data),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  
  markAllAsRead: () => api.patch('/notifications/read-all').then(r => r.data),
  
  delete: (id: string) => api.delete(`/notifications/${id}`).then(r => r.data)
};
