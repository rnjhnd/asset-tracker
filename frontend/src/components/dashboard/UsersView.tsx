import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserStatsCards } from './UserStatsCards';
import { UserToolbar } from './UserToolbar';
import { UserTable } from './UserTable';
import { RegisterUserModal } from '../modals/RegisterUserModal';
import { EditUserModal, type UserToEdit } from '../modals/EditUserModal';
import { ForceResetPasswordModal, type ForceResetUserTarget } from '../modals/ForceResetPasswordModal';
import { DeleteModal } from '../modals/DeleteModal';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';
import { Pagination } from '../Pagination';

export const UsersView = ({ user, token }: { user: any; token: string }) => {
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

  // Modal Triggers
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserToEdit | null>(null);
  const [forceResetUser, setForceResetUser] = useState<ForceResetUserTarget | null>(null);
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ id: string; type: 'USER' | 'ASSET' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isFirstMountUserSearch = useRef(true);

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
        axios.get(
          `${API_URL}/api/users?page=${currentPage}&limit=15&search=${userSearchQuery}&role=${userFilterRole}&status=${userFilterStatus}&sortBy=${userSortBy}&sortOrder=${userSortOrder}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(`${API_URL}/api/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
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

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await axios.put(
        `${API_URL}/api/users/${userId}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status.');
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmInfo) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/users/${deleteConfirmInfo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmInfo.id));
      toast.success('Employee permanently deleted!');
      fetchUsers();
      setDeleteConfirmInfo(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="animate-in fade-in duration-300">
      <UserStatsCards
        stats={userStats}
        isLoading={isLoading}
        resetRequestedCount={users.filter((u) => u.resetRequested).length}
      />

      <UserToolbar
        searchQuery={userSearchQuery}
        onSearchChange={(val) => {
          setUserSearchQuery(val);
          setCurrentPage(1);
        }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filterStatus={userFilterStatus}
        onFilterStatusChange={(val) => {
          setUserFilterStatus(val);
          setCurrentPage(1);
        }}
        filterRole={userFilterRole}
        onFilterRoleChange={(val) => {
          setUserFilterRole(val);
          setCurrentPage(1);
        }}
        sortBy={userSortBy}
        onSortByChange={(val) => {
          setUserSortBy(val);
          setCurrentPage(1);
        }}
        sortOrder={userSortOrder}
        onSortOrderChange={(val) => {
          setUserSortOrder(val);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
      />

      <UserTable
        users={users}
        isLoading={isLoading}
        onEditUser={(u) => setEditingUser(u)}
        handleToggleUserStatus={handleToggleUserStatus}
        onForceReset={(target) => setForceResetUser(target)}
        setDeleteConfirmInfo={setDeleteConfirmInfo}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Individual, Self-Contained User Modals */}
      <RegisterUserModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        token={token}
        onUserCreated={fetchUsers}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        token={token}
        user={editingUser}
        onUserUpdated={fetchUsers}
      />

      <ForceResetPasswordModal
        isOpen={!!forceResetUser}
        onClose={() => setForceResetUser(null)}
        token={token}
        user={forceResetUser}
        onPasswordReset={fetchUsers}
      />

      {deleteConfirmInfo?.type === 'USER' && (
        <DeleteModal
          deleteConfirmInfo={deleteConfirmInfo}
          setDeleteConfirmInfo={setDeleteConfirmInfo}
          executeDelete={executeDelete}
          isSubmitting={isDeleting}
        />
      )}
    </div>
  );
};
