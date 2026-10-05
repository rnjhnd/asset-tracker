import apiClient from './client';
import type {
  PaginatedResponse,
  RegisterUserPayload,
  UpdateUserPayload,
  User,
  UserStats,
} from '../types';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const userApi = {
  getUsers: async (params: UserQueryParams = {}): Promise<PaginatedResponse<User>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.role && params.role !== 'ALL') query.append('role', params.role);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<PaginatedResponse<User>>(`/api/users?${query.toString()}`);
    return response.data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<UserStats>('/api/users/stats');
    return response.data;
  },

  registerUser: async (payload: RegisterUserPayload): Promise<User> => {
    const response = await apiClient.post<User>('/api/auth/register', payload);
    return response.data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const response = await apiClient.put<User>(`/api/users/${id}`, payload);
    return response.data;
  },

  toggleStatus: async (id: string): Promise<User> => {
    const response = await apiClient.put<User>(`/api/users/${id}/status`, {});
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },

  forceResetPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.put(`/api/users/${id}/force-password`, { newPassword });
  },

  updateOwnPassword: async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put('/api/auth/password', payload);
  },
};
