import apiClient from './client';
import type {
  Asset,
  AssetAuditLog,
  AssetCategory,
  AssetStats,
  AssetStatus,
  BulkImportAssetPayload,
  CreateAssetPayload,
  PaginatedResponse,
  UpdateAssetPayload,
} from '../types';

export interface AssetQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const assetApi = {
  getAssets: async (params: AssetQueryParams = {}): Promise<PaginatedResponse<Asset>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<PaginatedResponse<Asset>>(`/api/assets?${query.toString()}`);
    return response.data;
  },

  getStats: async (): Promise<AssetStats> => {
    const response = await apiClient.get<AssetStats>('/api/assets/totals');
    return response.data;
  },

  createAsset: async (payload: CreateAssetPayload): Promise<Asset> => {
    const response = await apiClient.post<Asset>('/api/assets', payload);
    return response.data;
  },

  updateAsset: async (id: string, payload: UpdateAssetPayload): Promise<Asset> => {
    const response = await apiClient.put<Asset>(`/api/assets/${id}`, payload);
    return response.data;
  },

  updateStatus: async (id: string, status: AssetStatus): Promise<Asset> => {
    const response = await apiClient.put<Asset>(`/api/assets/${id}/status`, { status });
    return response.data;
  },

  assignAsset: async (id: string, userId: string): Promise<Asset> => {
    const response = await apiClient.post<Asset>(`/api/assets/${id}/assign`, { userId });
    return response.data;
  },

  returnAsset: async (id: string): Promise<Asset> => {
    const response = await apiClient.post<Asset>(`/api/assets/${id}/return`);
    return response.data;
  },

  deleteAsset: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/assets/${id}`);
  },

  getHistory: async (id: string): Promise<AssetAuditLog[]> => {
    const response = await apiClient.get<AssetAuditLog[]>(`/api/assets/${id}/history`);
    return response.data;
  },

  getCategories: async (): Promise<AssetCategory[]> => {
    const response = await apiClient.get<AssetCategory[]>('/api/categories');
    return response.data;
  },

  createCategory: async (name: string): Promise<AssetCategory> => {
    const response = await apiClient.post<AssetCategory>('/api/categories', { name });
    return response.data;
  },

  bulkImport: async (assets: BulkImportAssetPayload[]): Promise<{ count: number }> => {
    const response = await apiClient.post<{ count: number }>('/api/assets/bulk', assets);
    return response.data;
  },
};
