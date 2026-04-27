import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(config => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Vehicle {
  id?: number;
  licensePlate: string;
  maxPayload: number;
  currentStatus: 'AVAILABLE' | 'ON_DUTY' | 'MAINTENANCE';
  enterpriseId?: number;
}

export interface Enterprise {
  id?: number;
  name: string;
  licenseNumber: string;
  address: string;
  dailyCapacity: number;
  serviceArea?: string;
  acceptedWasteTypes?: string;
  phone?: string;
  email?: string;
  ownerUserId?: string;
}

export const enterpriseApi = {
  // Enterprises
  getEnterprises: () => api.get('/enterprises').then(res => res.data),
  getMyEnterprise: (userId: string) => api.get(`/enterprises/owner/${userId}`).then(res => res.data),
  createEnterprise: (data: Enterprise) => api.post('/enterprises', data).then(res => res.data),
  updateEnterprise: (id: number, data: Partial<Enterprise>) => api.put(`/enterprises/${id}`, data).then(res => res.data),
  getCapacity: (id: number) => api.get(`/enterprises/${id}/capacity`).then(res => res.data),
  getOverview: () => api.get('/enterprises/overview').then(res => res.data),

  // Vehicles
  getVehicles: (status?: string) => {
    const params = status ? { status } : {};
    return api.get('/vehicles', { params }).then(res => res.data);
  },
  registerVehicle: (data: Vehicle) => api.post('/vehicles', data).then(res => res.data),
  updateVehicle: (id: number, data: Partial<Vehicle>) => api.put(`/vehicles/${id}`, data).then(res => res.data),
  deleteVehicle: (id: number) => api.delete(`/vehicles/${id}`).then(res => res.data),

  // Reward rules
  getRewardRules: () => api.get('/rewards/rules').then(res => res.data),
  updateRewardRule: (wasteType: string, pointsPerKg: number) =>
    api.put(`/rewards/rules/${wasteType}`, { pointsPerKg }).then(res => res.data),
};
