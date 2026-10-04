import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, SlidersHorizontal, Key } from 'lucide-react';
import { SelectDropdown } from '../SelectDropdown';
import { UserTable } from './UserTable';
import { UserModals } from '../modals/UserModals';
import { DeleteModal } from '../modals/DeleteModal';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const UsersView = ({ user, token }: { user: any, token: string }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, deactivated: 0, admins: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('ALL');
  const [userFilterStatus, setUserFilterStatus] = useState('ALL');
  const [userSortBy, setUserSortBy] = useState('createdAt');
  const [userSortOrder, setUserSortOrder] = useState('desc');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isForceResetModalOpen, setIsForceResetModalOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState({ id: '', name: '', employeeId: '', role: 'EMPLOYEE', department: '' });
  const [newUser, setNewUser] = useState({ name: '', employeeId: '', password: '', role: 'EMPLOYEE', department: '' });
  const [forceResetUserId, setForceResetUserId] = useState('');
  const [forceResetUserEmployeeId, setForceResetUserEmployeeId] = useState('');
  const [forceNewPassword, setForceNewPassword] = useState('');
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ id: string, type: 'USER' | 'ASSET' } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFirstMountUserSearch = useRef(true);

  const closeAllModals = () => {
    setIsUserModalOpen(false);
    setIsEditUserModalOpen(false);
    setIsForceResetModalOpen(false);
    setEditingUser({ id: '', name: '', employeeId: '', role: 'EMPLOYEE', department: '' });
    setNewUser({ name: '', employeeId: '', password: '', role: 'EMPLOYEE', department: '' });
    setForceResetUserId('');
    setForceResetUserEmployeeId('');
    setForceNewPassword('');
    setDeleteConfirmInfo(null);
  };

  const handleResetFilters = () => {
    setUserSearchQuery('');
    setUserFilterStatus('ALL');
    setUserFilterRole('ALL');
    setUserSortBy('createdAt');
    setUserSortOrder('desc');
    setCurrentPage(1);
  };

  const fetchUsers = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/users?page=${currentPage}&limit=15&search=${userSearchQuery}&role=${userFilterRole}&status=${userFilterStatus}&sortBy=${userSortBy}&sortOrder=${userSortOrder}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/users/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data.data);
      setTotalPages(usersRes.data.totalPages);
      setUserStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch users or stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchUsers();
  }, [currentPage, userFilterRole, userFilterStatus, userSortBy, userSortOrder]);

  useEffect(() => {
    if (isFirstMountUserSearch.current) {
      isFirstMountUserSearch.current = false;
      return;
    }
    setCurrentPage(1);
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, newUser, { headers: { Authorization: `Bearer ${token}` } });
      closeAllModals();
      fetchUsers();
      toast.success('Employee account created!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/users/${editingUser.id}`, editingUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeAllModals();
      fetchUsers();
      toast.success('Employee updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await axios.put(`${API_URL}/api/users/${userId}/status`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status.');
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmInfo) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`${API_URL}/api/users/${deleteConfirmInfo.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmInfo.id));
      toast.success('Employee permanently deleted!');
      fetchUsers();
      setDeleteConfirmInfo(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/users/${forceResetUserId}/force-password`, 
        { newPassword: forceNewPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeAllModals();
      fetchUsers();
      toast.success(`PASSWORD RESET FOR ${forceResetUserEmployeeId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to force reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
    if (raw !== sanitized) toast('Only letters and spaces allowed', { icon: '⚠️', id: 'dept-val-err' });
    setNewUser({...newUser, department: sanitized.toUpperCase()});
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
          <p className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-1">Total Users</p>
          {isLoading ? <div className="h-10 w-16 bg-gray-200 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{userStats?.total ?? '--'}</p>}
        </div>
        <div className="bg-white border-2 border-green-600 p-6 shadow-[4px_4px_0_0_#16a34a]">
          <p className="font-mono text-sm text-green-600 uppercase tracking-widest mb-1">Active Accounts</p>
          {isLoading ? <div className="h-10 w-16 bg-green-100 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{userStats?.active ?? '--'}</p>}
        </div>
        <div className="bg-white border-2 border-red-600 p-6 shadow-[4px_4px_0_0_#dc2626]">
          <p className="font-mono text-sm text-red-600 uppercase tracking-widest mb-1">Deactivated</p>
          {isLoading ? <div className="h-10 w-16 bg-red-100 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{userStats?.deactivated ?? '--'}</p>}
        </div>
        <div className="bg-white border-2 border-purple-600 p-6 shadow-[4px_4px_0_0_#9333ea]">
          <p className="font-mono text-sm text-purple-600 uppercase tracking-widest mb-1">System Admins</p>
          {isLoading ? <div className="h-10 w-16 bg-purple-100 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{userStats?.admins ?? '--'}</p>}
        </div>
      </div>

      <div className="flex flex-col mb-6 gap-4">
        {users.filter(u => u.resetRequested).length > 0 && (
          <div className="bg-red-50 border-2 border-red-600 p-4 mb-2 shadow-[4px_4px_0_0_#dc2626] flex items-center gap-3 animate-in fade-in zoom-in">
            <div className="bg-red-600 text-white p-2 shrink-0">
              <Key size={20} />
            </div>
            <div>
              <h3 className="font-bold text-red-700 uppercase tracking-tight text-lg leading-none mb-1">Password Resets Requested</h3>
              <p className="font-mono text-xs text-red-600 uppercase font-bold">
                {users.filter(u => u.resetRequested).length} employee(s) have requested a password reset. Use the key icon to force reset their passwords.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="bg-gray-900 px-4 sm:px-6 py-2 shadow-[4px_4px_0_0_#d4d4d8]">
            <h2 className="text-xl sm:text-3xl font-bold uppercase tracking-tight text-white">Employee Directory</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Employee ID..."
                value={userSearchQuery}
                onChange={(e) => { setUserSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border-2 border-[#e4e4e7] bg-white font-mono text-sm focus:border-[#3b82f6] outline-none"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full sm:w-auto border-2 px-4 py-2.5 font-mono text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-[#e4e4e7] text-gray-600 hover:bg-gray-50 hover:text-black'}`}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="w-full sm:w-auto bg-gray-900 text-white px-6 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors whitespace-nowrap flex justify-center items-center"
            >
              + Register User
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-50 border-2 border-gray-900 p-4 shadow-[4px_4px_0_0_#111827] flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end mt-2 animate-in slide-in-from-top-2">
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs font-bold uppercase mb-1">Status</label>
              <SelectDropdown
                value={userFilterStatus}
                onChange={(val) => { setUserFilterStatus(val); setCurrentPage(1); }}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'DEACTIVATED', label: 'Deactivated' }
                ]}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs font-bold uppercase mb-1">Role</label>
              <SelectDropdown
                value={userFilterRole}
                onChange={(val) => { setUserFilterRole(val); setCurrentPage(1); }}
                options={[
                  { value: 'ALL', label: 'All Roles' },
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'EMPLOYEE', label: 'Employee' }
                ]}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs font-bold uppercase mb-1">Sort By</label>
              <SelectDropdown
                value={userSortBy}
                onChange={(val) => { setUserSortBy(val); setCurrentPage(1); }}
                options={[
                  { value: 'createdAt', label: 'Date Added' },
                  { value: 'name', label: 'Name' },
                  { value: 'employeeId', label: 'Employee ID' },
                  { value: 'role', label: 'Role' },
                  { value: 'department', label: 'Department' },
                  { value: 'isActive', label: 'Status' }
                ]}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs font-bold uppercase mb-1">Order</label>
              <SelectDropdown
                value={userSortOrder}
                onChange={(val) => { setUserSortOrder(val); setCurrentPage(1); }}
                options={[
                  { value: 'asc', label: 'Ascending' },
                  { value: 'desc', label: 'Descending' }
                ]}
                className="w-full"
              />
            </div>
            <button 
              onClick={handleResetFilters}
              className="w-full sm:w-auto flex-none px-4 py-2 border-2 border-red-500 text-red-500 font-mono text-sm uppercase tracking-wider font-bold hover:bg-red-50 transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <UserTable 
        users={users} isLoading={isLoading} setEditingUser={setEditingUser} setIsEditUserModalOpen={setIsEditUserModalOpen}
        handleToggleUserStatus={handleToggleUserStatus} setForceResetUserId={setForceResetUserId}
        setForceResetUserEmployeeId={setForceResetUserEmployeeId} setIsForceResetModalOpen={setIsForceResetModalOpen}
        setDeleteConfirmInfo={setDeleteConfirmInfo}
      />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mb-12">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-white border-2 border-[#e4e4e7] p-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-mono text-sm font-bold">
            PAGE {currentPage} OF {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="bg-white border-2 border-[#e4e4e7] p-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <UserModals closeAllModals={closeAllModals}
        isUserModalOpen={isUserModalOpen} newUser={newUser} setNewUser={setNewUser}
        handleCreateUser={handleCreateUser} handleDepartmentChange={handleDepartmentChange} isSubmitting={isSubmitting}
        isEditUserModalOpen={isEditUserModalOpen} editingUser={editingUser}
        setEditingUser={setEditingUser} handleEditUser={handleEditUser} isForceResetModalOpen={isForceResetModalOpen}
        forceResetUserEmployeeId={forceResetUserEmployeeId}
        forceNewPassword={forceNewPassword} setForceNewPassword={setForceNewPassword} handleForceResetPassword={handleForceResetPassword}
      />

      {deleteConfirmInfo?.type === 'USER' && (
        <DeleteModal deleteConfirmInfo={deleteConfirmInfo} setDeleteConfirmInfo={setDeleteConfirmInfo} executeDelete={executeDelete} isSubmitting={isSubmitting} />
      )}
    </div>
  );
};
