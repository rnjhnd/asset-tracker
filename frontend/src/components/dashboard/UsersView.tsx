import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserStatsCards } from './UserStatsCards';
import { UserToolbar } from './UserToolbar';
import { UserTable } from './UserTable';
import { UserModals } from '../modals/UserModals';
import { DeleteModal } from '../modals/DeleteModal';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';
import { Pagination } from '../Pagination';

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
      <UserStatsCards 
        stats={userStats}
        isLoading={isLoading}
        resetRequestedCount={users.filter(u => u.resetRequested).length}
      />

      <UserToolbar 
        searchQuery={userSearchQuery}
        onSearchChange={(val) => { setUserSearchQuery(val); setCurrentPage(1); }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filterStatus={userFilterStatus}
        onFilterStatusChange={(val) => { setUserFilterStatus(val); setCurrentPage(1); }}
        filterRole={userFilterRole}
        onFilterRoleChange={(val) => { setUserFilterRole(val); setCurrentPage(1); }}
        sortBy={userSortBy}
        onSortByChange={(val) => { setUserSortBy(val); setCurrentPage(1); }}
        sortOrder={userSortOrder}
        onSortOrderChange={(val) => { setUserSortOrder(val); setCurrentPage(1); }}
        onResetFilters={handleResetFilters}
        onOpenRegisterModal={() => setIsUserModalOpen(true)}
      />

      <UserTable 
        users={users} isLoading={isLoading} setEditingUser={setEditingUser} setIsEditUserModalOpen={setIsEditUserModalOpen}
        handleToggleUserStatus={handleToggleUserStatus} setForceResetUserId={setForceResetUserId}
        setForceResetUserEmployeeId={setForceResetUserEmployeeId} setIsForceResetModalOpen={setIsForceResetModalOpen}
        setDeleteConfirmInfo={setDeleteConfirmInfo}
      />

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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
