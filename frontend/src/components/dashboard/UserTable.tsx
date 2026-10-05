import React from 'react';
import { Edit2, UserX, UserCheck, Key, Trash2, RefreshCw, Users } from 'lucide-react';
import type { User, ForceResetUserTarget } from '../../types';

type UserTableProps = {
  users: User[];
  isLoading: boolean;
  onEditUser: (user: User) => void;
  handleToggleUserStatus: (id: string) => void;
  onForceReset: (user: ForceResetUserTarget) => void;
  setDeleteConfirmInfo: (info: { id: string; type: 'USER' | 'ASSET' } | null) => void;
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onEditUser,
  handleToggleUserStatus,
  onForceReset,
  setDeleteConfirmInfo,
}) => {
  return (
    <div className="bg-white border border-[#e4e4e7] shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_#e4e4e7]">
            <tr className="font-mono text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 bg-gray-50">Employee</th>
              <th className="p-4 bg-gray-50">Role</th>
              <th className="p-4 bg-gray-50">Department</th>
              <th className="p-4 bg-gray-50">Status</th>
              <th className="p-4 bg-gray-50">Account Created</th>
              <th className="p-4 text-right bg-gray-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {!isLoading && users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-all hover:shadow-[inset_4px_0_0_0_#3b82f6] group">
              <td className="p-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{u.name}</span>
                    {u.resetRequested && (
                      <span className="bg-red-100 text-red-700 border border-red-300 font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 whitespace-nowrap animate-pulse">
                        Reset Req
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-gray-500 mt-0.5">{u.employeeId}</span>
                </div>
              </td>
              <td className="p-4">
                <span className={`inline-block px-2 py-1 font-mono text-xs border ${
                  u.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}>
                  {u.role}
                </span>
              </td>
              <td className="p-4 font-mono text-sm">{u.role === 'ADMIN' ? '--' : u.department}</td>
              <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs border rounded-full ${
                  u.isActive ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                </span>
              </td>
              <td className="p-4 font-mono text-sm text-gray-500 align-middle">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="p-4 align-middle">
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => onEditUser(u)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Edit User"
                  >
                    <Edit2 size={16} />
                  </button>
                  <div className="h-4 w-px bg-gray-300 mx-1"></div>
                  <button 
                    onClick={() => handleToggleUserStatus(u.id)}
                    disabled={u.role === 'ADMIN' && u.isActive}
                    className={`${u.role === 'ADMIN' && u.isActive ? 'text-gray-300 cursor-not-allowed' : (u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700')} font-mono text-sm uppercase transition-colors`}
                    title={u.role === 'ADMIN' && u.isActive ? "Cannot deactivate ADMIN" : (u.isActive ? "Deactivate User" : "Reactivate User")}
                  >
                    {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                  <div className="h-4 w-px bg-gray-300 mx-1"></div>
                  <button 
                    onClick={() => onForceReset({ id: u.id, employeeId: u.employeeId })}
                    className="text-[#ca8a04] hover:text-yellow-600 transition-colors"
                    title="Force Reset Password"
                  >
                    <Key size={16} />
                  </button>
                  <div className="h-4 w-px bg-gray-300 mx-1"></div>
                  <button 
                    onClick={() => setDeleteConfirmInfo({ id: u.id, type: 'USER' })}
                    className="text-red-800 hover:text-red-900 transition-colors"
                    title="Hard Delete Employee"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-900">
                    <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
                    <p className="font-mono text-sm uppercase tracking-widest font-bold">Loading Directory...</p>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Users size={48} className="mb-4 opacity-50" />
                    <p className="font-mono text-sm uppercase tracking-widest font-bold text-gray-900">No users found matching your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
