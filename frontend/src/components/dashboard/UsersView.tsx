import { useState, useEffect, useRef } from 'react';
import { UserStatsCards } from './UserStatsCards';
import { UserToolbar } from './UserToolbar';
import { UserTable } from './UserTable';
import { Pagination } from '../common';
import { RegisterUserModal } from '../modals/RegisterUserModal';
import { EditUserModal } from '../modals/EditUserModal';
import { ForceResetPasswordModal } from '../modals/ForceResetPasswordModal';
import { DeleteModal } from '../modals/DeleteModal';
import toast from 'react-hot-toast';
import { userApi } from '../../api';
import type { ForceResetUserTarget, User, UserStats, UserToEdit } from '../../types';

export const UsersView = ({ user }: { user: User | null }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, active: 0, deactivated: 0, admins: 0 });
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
        userApi.getUsers({
          page: currentPage,
          limit: 15,
          search: userSearchQuery,
          role: userFilterRole,
          status: userFilterStatus,
          sortBy: userSortBy,
          sortOrder: userSortOrder,
        }),
        userApi.getStats(),
      ]);
      setUsers(usersRes.data);
      setTotalPages(usersRes.totalPages);
      setUserStats(statsRes);
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
      await userApi.toggleStatus(userId);
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
      await userApi.deleteUser(deleteConfirmInfo.id);
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

      {/* Individual Modals (Zero Token Prop Drilling) */}
      <RegisterUserModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onUserCreated={fetchUsers}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onUserUpdated={fetchUsers}
      />

      <ForceResetPasswordModal
        isOpen={!!forceResetUser}
        onClose={() => setForceResetUser(null)}
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
