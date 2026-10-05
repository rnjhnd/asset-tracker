export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';

export interface AssetAssignment {
  id: string;
  checkoutDate: string;
  returnDate: string | null;
  user: {
    id?: string;
    name: string;
    employeeId: string;
    department?: string;
  };
}

export interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  status: AssetStatus;
  purchaseDate: string;
  categoryId?: string;
  assignments?: AssetAssignment[];
  currentUserId?: string | null;
  currentUser?: {
    id: string;
    name: string;
    employeeId: string;
    department?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetCategory {
  id: string;
  name: string;
}

export interface AssetAuditLog {
  id: string;
  assetId: string;
  userId: string;
  checkoutDate: string;
  returnDate: string | null;
  user: {
    name: string;
    employeeId: string;
  };
}

export interface AssetStats {
  inStorage?: number;
  available?: number;
  assigned: number;
  maintenance: number;
  retired: number;
  total: number;
  categoryStats?: any[];
  agingStats?: any[];
  timelineStats?: any[];
}

export interface CreateAssetPayload {
  name: string;
  serialNumber: string;
  category: string;
  purchaseDate: string;
}

export interface UpdateAssetPayload {
  name?: string;
  serialNumber?: string;
  purchaseDate?: string;
}

export interface BulkImportAssetPayload {
  name: string;
  serialNumber: string;
  category: string;
  purchaseDate?: string;
}
