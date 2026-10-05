import apiClient from './client';
import type { User } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (employeeId: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', { employeeId, password });
    return response.data;
  },

  requestReset: async (employeeId: string): Promise<void> => {
    await apiClient.post('/api/auth/request-reset', { employeeId });
  },
};
