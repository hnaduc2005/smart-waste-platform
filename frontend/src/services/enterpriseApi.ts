import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api/v1';

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
}

export const enterpriseApi = {
  // Enterprises
  getEnterprises: () => api.get('/enterprises').then(res => res.data),
  createEnterprise: (data: Enterprise) => api.post('/enterprises', data).then(res => res.data),

  // Vehicles
  getVehicles: (status?: string) => {
    const params = status ? { status } : {};
    return api.get('/vehicles', { params }).then(res => res.data);
  },
  registerVehicle: (data: Vehicle) => api.post('/vehicles', data).then(res => res.data),
};
