export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  employeeId: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  resetRequested?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  total: number;
  active: number;
  deactivated: number;
  admins: number;
}

export interface RegisterUserPayload {
  name: string;
  employeeId: string;
  password: string;
  role: string;
  department?: string;
}

export interface UpdateUserPayload {
  name: string;
  department?: string;
  role?: string;
  employeeId?: string;
}

export interface ForceResetUserTarget {
  id: string;
  employeeId: string;
}

export interface UserToEdit {
  id: string;
  name: string;
  employeeId: string;
  role: string;
  department?: string;
}
