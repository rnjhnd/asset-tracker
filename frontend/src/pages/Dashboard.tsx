import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Search, Users, Box, Download, Upload, ChevronLeft, ChevronRight, SlidersHorizontal, Key } from 'lucide-react';
import { SelectDropdown } from '../components/SelectDropdown';
import { AnalyticsCharts } from '../components/dashboard/AnalyticsCharts';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AssetTable } from '../components/dashboard/AssetTable';
import { UserTable } from '../components/dashboard/UserTable';
import { UserModals } from '../components/modals/UserModals';
import { AssetModals } from '../components/modals/AssetModals';
import { DeleteModal } from '../components/modals/DeleteModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_URL from '../config/api';

type Asset = {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  purchaseDate: string;
  assignments: { user: { employeeId: string; name: string } }[];
};

type UserAccount = {
  id: string;
  name: string;
  employeeId: string;
  role: string;
  department: string;
  createdAt: string;
  isActive: boolean;
  resetRequested?: boolean;
};

type AuditLog = {
  id: string;
  checkoutDate: string;
  returnDate: string | null;
  user: { employeeId: string; name: string };
};

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState({ 
    total: 0, available: 0, assigned: 0, maintenance: 0, retired: 0,
    categoryStats: [] as any[], agingStats: [] as any[], timelineStats: [] as any[]
  });
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, deactivated: 0, admins: 0 });
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [currentTab, setCurrentTab] = useState<'ASSETS' | 'USERS'>('ASSETS');

  // Shared Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filter/Sort State - ASSETS
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [assetFilterCategory, setAssetFilterCategory] = useState('ALL');
  const [assetSortBy, setAssetSortBy] = useState('purchaseDate');
  const [assetSortOrder, setAssetSortOrder] = useState('desc');

  // Advanced Filter/Sort State - USERS
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('ALL');
  const [userFilterStatus, setUserFilterStatus] = useState('ALL');
  const [userSortBy, setUserSortBy] = useState('createdAt');
  const [userSortOrder, setUserSortOrder] = useState('desc');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isForceResetModalOpen, setIsForceResetModalOpen] = useState(false);
  
  // Form States
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ id: string, type: 'USER' | 'ASSET' } | null>(null);
  const [newAsset, setNewAsset] = useState({ name: '', serialNumber: '', category: '', purchaseDate: new Date().toISOString().split('T')[0] });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingAsset, setEditingAsset] = useState({ id: '', name: '', serialNumber: '', purchaseDate: '', category: '' });
  const [editingUser, setEditingUser] = useState({ id: '', name: '', employeeId: '', role: 'EMPLOYEE', department: '' });
  const [assignAssetId, setAssignAssetId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignSearchResults, setAssignSearchResults] = useState<any[]>([]);
  const [isSearchingAssign, setIsSearchingAssign] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', employeeId: '', password: '', role: 'EMPLOYEE', department: '' });
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, showAbove: false });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [forceResetUserId, setForceResetUserId] = useState('');
  const [forceResetUserEmployeeId, setForceResetUserEmployeeId] = useState('');
  const [forceNewPassword, setForceNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstMountAssetSearch = useRef(true);
  const isFirstMountUserSearch = useRef(true);

  // History State
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
  const [activeHistoryAssetName, setActiveHistoryAssetName] = useState('');

  const closeAllModals = () => {
    setIsAddModalOpen(false);
    setIsAssignModalOpen(false);
    setIsEditModalOpen(false);
    setIsUserModalOpen(false);
    setIsEditUserModalOpen(false);
    setIsHistoryModalOpen(false);
    setIsPasswordModalOpen(false);
    setIsForceResetModalOpen(false);
    
    setNewAsset({ name: '', serialNumber: '', category: '', purchaseDate: new Date().toISOString().split('T')[0] });
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setEditingAsset({ id: '', name: '', serialNumber: '', purchaseDate: '', category: '' });
    setEditingUser({ id: '', name: '', employeeId: '', role: 'EMPLOYEE', department: '' });
    setAssignAssetId('');
    setAssignUserId('');
    setAssignSearchQuery('');
    setNewUser({ name: '', employeeId: '', password: '', role: 'EMPLOYEE', department: '' });
    setPasswordForm({ currentPassword: '', newPassword: '' });
    setForceResetUserId('');
    setForceResetUserEmployeeId('');
    setForceNewPassword('');
  };

  // Tab switching helper
  const handleTabSwitch = (tab: 'ASSETS' | 'USERS') => {
    setCurrentTab(tab);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    if (currentTab === 'ASSETS') {
      setSearchQuery('');
      setFilterStatus('ALL');
      setAssetFilterCategory('ALL');
      setAssetSortBy('purchaseDate');
      setAssetSortOrder('desc');
    } else {
      setUserSearchQuery('');
      setUserFilterStatus('ALL');
      setUserFilterRole('ALL');
      setUserSortBy('createdAt');
      setUserSortOrder('desc');
    }
    setCurrentPage(1);
  };
  const anyModalOpen = isAddModalOpen || isEditModalOpen || isAssignModalOpen || isUserModalOpen || isEditUserModalOpen || isHistoryModalOpen || isPasswordModalOpen || isForceResetModalOpen;

  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [anyModalOpen]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    const loadAll = async () => {
      // Only show the big loading spinner if we literally have 0 data in memory
      // This allows instant tab switching using cached data while it refreshes silently in the background
      const isInitialLoad = (currentTab === 'ASSETS' && assets.length === 0) || (currentTab === 'USERS' && users.length === 0);
      if (isInitialLoad) setIsLoading(true);

      await Promise.all([
        currentTab === 'ASSETS' ? fetchAssets() : Promise.resolve(),
        user?.role === 'ADMIN' && currentTab === 'ASSETS' ? fetchTotals() : Promise.resolve(),
        user?.role === 'ADMIN' && currentTab === 'USERS' ? fetchUsers() : Promise.resolve(),
        fetchCategories()
      ]);
      
      setIsLoading(false);
    };
    
    loadAll();
  }, [
    token, navigate, user?.role, currentTab, currentPage, 
    filterStatus, assetFilterCategory, assetSortBy, assetSortOrder,
    userFilterRole, userFilterStatus, userSortBy, userSortOrder
  ]);

  // Debounced Search Effects
  useEffect(() => {
    if (isFirstMountAssetSearch.current) {
      isFirstMountAssetSearch.current = false;
      return;
    }
    setCurrentPage(1);
    const delayDebounceFn = setTimeout(() => {
      if (token && currentTab === 'ASSETS') fetchAssets();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (isFirstMountUserSearch.current) {
      isFirstMountUserSearch.current = false;
      return;
    }
    setCurrentPage(1);
    const delayDebounceFn = setTimeout(() => {
      if (token && currentTab === 'USERS') fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  useEffect(() => {
    if (!assignSearchQuery) {
      setAssignSearchResults([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingAssign(true);
      try {
        const res = await axios.get(`${API_URL}/api/users?search=${assignSearchQuery}&limit=20&status=ACTIVE`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignSearchResults(res.data.data.filter((u: any) => u.role !== 'ADMIN'));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingAssign(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [assignSearchQuery, token]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories`, { headers: { Authorization: `Bearer ${token}` } });
      setCategories(res.data);
      if (res.data.length > 0 && !newAsset.category) {
        setNewAsset(prev => ({ ...prev, category: res.data[0].name }));
      }
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assets?page=${currentPage}&limit=15&search=${searchQuery}&status=${filterStatus}&category=${assetFilterCategory}&sortBy=${assetSortBy}&sortOrder=${assetSortOrder}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssets(response.data.data);
      if (currentTab === 'ASSETS') setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch assets');
    }
  };

  const fetchTotals = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const response = await axios.get(`${API_URL}/api/assets/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch KPI stats');
    }
  };

  const fetchUsers = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/users?page=${currentPage}&limit=15&search=${userSearchQuery}&role=${userFilterRole}&status=${userFilterStatus}&sortBy=${userSortBy}&sortOrder=${userSortOrder}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/users/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data.data);
      if (currentTab === 'USERS') setTotalPages(usersRes.data.totalPages);
      setUserStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch users or stats');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('LOGGED OUT SUCCESSFULLY', { id: 'logout-toast' });
    navigate('/login');
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error('Session expired. Please log in again.', { id: 'session-expired' });
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-dropdown-container')) {
        setActiveDropdownId(null);
      }
      if (!target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/assets`, newAsset, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeAllModals();
      setNewAsset({ name: '', serialNumber: '', category: categories.length > 0 ? categories[0].name : '', purchaseDate: new Date().toISOString().split('T')[0] });
      fetchAssets();
      fetchTotals();
      toast.success('Hardware registered successfully!');
    } catch (error) {
      toast.error('Failed to create asset. Check serial number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, newUser);
      closeAllModals();
      setNewUser({ name: '', employeeId: '', password: '', role: 'EMPLOYEE', department: '' });
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
      setEditingUser({ id: '', name: '', employeeId: '', role: 'EMPLOYEE', department: '' });
      fetchUsers();
      toast.success('Employee updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmInfo) return;
    setIsSubmitting(true);
    try {
      if (deleteConfirmInfo.type === 'USER') {
        await axios.delete(`${API_URL}/api/users/${deleteConfirmInfo.id}`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(prev => prev.filter(u => u.id !== deleteConfirmInfo.id));
        toast.success('Employee permanently deleted!');
        fetchUsers();
      } else {
        await axios.delete(`${API_URL}/api/assets/${deleteConfirmInfo.id}`, { headers: { Authorization: `Bearer ${token}` } });
        setAssets(prev => prev.filter(a => a.id !== deleteConfirmInfo.id));
        toast.success('Asset permanently deleted!');
        fetchAssets();
        fetchTotals();
      }
      setDeleteConfirmInfo(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to delete ${deleteConfirmInfo.type.toLowerCase()}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/categories`, { name: newCategoryName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories([...categories, res.data]);
      setNewAsset({ ...newAsset, category: res.data.name });
      setNewCategoryName('');
      setIsCreatingCategory(false);
      toast.success('Category created!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (!assignUserId) {
      toast.error('Please select a valid employee from the list');
      setIsSubmitting(false);
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/assets/${assignAssetId}/assign`, { userId: assignUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeAllModals();
      setAssignAssetId('');
      setAssignUserId('');
      setAssignSearchQuery('');
      fetchAssets();
      fetchTotals();
      toast.success('Asset assigned successfully!');
    } catch (error) {
      toast.error('Failed to assign asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/assets/${editingAsset.id}`, {
        name: editingAsset.name,
        serialNumber: editingAsset.serialNumber,
        purchaseDate: editingAsset.purchaseDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeAllModals();
      fetchAssets();
      toast.success('Asset updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
    if (raw !== sanitized) toast('Only letters and spaces allowed', { icon: '⚠️', id: 'category-val-err' });
    setNewCategoryName(sanitized.toUpperCase());
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
    if (raw !== sanitized) toast('Only letters and spaces allowed', { icon: '⚠️', id: 'dept-val-err' });
    setNewUser({...newUser, department: sanitized.toUpperCase()});
  };

  const handleReturnAsset = async (assetId: string) => {
    try {
      await axios.post(`${API_URL}/api/assets/${assetId}/return`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssets();
      fetchTotals();
      toast.success('Asset returned successfully!', { id: `return-${assetId}` });
    } catch (error) {
      toast.error('Failed to return asset.', { id: `return-err-${assetId}` });
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    try {
      await axios.put(`${API_URL}/api/assets/${assetId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssets();
      fetchTotals();
      toast.success(`ASSET MARKED AS ${status}`, { id: `status-${assetId}` });
    } catch (error) {
      toast.error('Failed to update asset status.', { id: `status-err-${assetId}` });
    }
  };

  const handleViewHistory = async (assetId: string, assetName: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/assets/${assetId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryLogs(response.data);
      setActiveHistoryAssetName(assetName);
      setIsHistoryModalOpen(true);
    } catch (error) {
      toast.error('Failed to load asset history.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/auth/password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeAllModals();
      setPasswordForm({ currentPassword: '', newPassword: '' });
      toast.success('Password changed securely.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password.');
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
      setForceNewPassword('');
      fetchUsers();
      toast.success(`PASSWORD RESET FOR ${forceResetUserEmployeeId}`, { id: 'force-reset' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to force reset password.', { id: 'force-reset-err' });
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assets?limit=100000&search=${searchQuery}&status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const dataToExport: Asset[] = response.data.data;
      if (dataToExport.length === 0) return toast.error('No data to export.');
      
      const headers = ['Asset ID', 'Name', 'Serial Number', 'Category', 'Status', 'Assigned User'];
      const rows = dataToExport.map(asset => [
        asset.id,
        `"${asset.name}"`,
        asset.serialNumber,
        asset.category,
        asset.status,
        asset.assignments.length > 0 ? (asset.assignments[0].user.name || asset.assignments[0].user.employeeId) : 'None'
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate export data.');
    }
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
          // Very simple CSV parser (Assumes: name,serial,category,purchaseDate)
          const parsedAssets = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
              name: values[0],
              serialNumber: values[1],
              category: values[2]?.toUpperCase() || 'UNASSIGNED',
              purchaseDate: values[3] || undefined
            };
          }).filter(a => a.name && a.serialNumber);

        if (parsedAssets.length === 0) return toast.error('No valid rows found in CSV.');

        await axios.post(`${API_URL}/api/assets/bulk`, parsedAssets, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success(`Bulk import successful!`);
        fetchAssets();
        fetchTotals();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to import CSV. Check format.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      await axios.put(`${API_URL}/api/users/${userId}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      toast.success(targetUser?.isActive ? 'USER ACCOUNT DEACTIVATED' : 'USER ACCOUNT REACTIVATED', { id: `user-status-${userId}` });
    } catch (error) {
      toast.error('Failed to update user status.', { id: `user-status-err-${userId}` });
    }
  };



  return (
    <div className="min-h-screen bg-transparent text-gray-900 font-sans">

      <DashboardHeader 
        user={user}
        isProfileDropdownOpen={isProfileDropdownOpen}
        setIsProfileDropdownOpen={setIsProfileDropdownOpen}
        setIsPasswordModalOpen={setIsPasswordModalOpen}
        handleLogout={handleLogout}
      />

      <main className="p-4 sm:p-8 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* Admin Tab Navigation */}
        {user?.role === 'ADMIN' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
            <button 
              onClick={() => handleTabSwitch('ASSETS')}
              className={`flex items-center justify-center sm:justify-start gap-2 font-mono text-sm uppercase tracking-wider font-bold transition-colors w-full sm:w-auto px-6 py-3 border-2 ${currentTab === 'ASSETS' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-[#e4e4e7] hover:border-gray-400 hover:text-black'}`}
            >
              <Box size={16} /> Hardware
            </button>
            <button 
              onClick={() => handleTabSwitch('USERS')}
              className={`flex items-center justify-center sm:justify-start gap-2 font-mono text-sm uppercase tracking-wider font-bold transition-colors w-full sm:w-auto px-6 py-3 border-2 ${currentTab === 'USERS' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-[#e4e4e7] hover:border-gray-400 hover:text-black'}`}
            >
              <Users size={16} /> Employees
            </button>
          </div>
        )}

        {/* --- ASSETS TAB --- */}
        {currentTab === 'ASSETS' && (
          <>


            {/* Analytics Grid */}
            {user?.role === 'ADMIN' && (
              <AnalyticsCharts 
                stats={stats} 
                isLoading={isLoading} 
                chartColors={['#3b82f6', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#ea580c', '#0d9488']}
              />
            )}

            {/* Employee Specific KPI Cards */}
            {user?.role === 'EMPLOYEE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
                  <p className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-1">Active Devices</p>
                  {isLoading ? <div className="h-10 w-16 bg-gray-200 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{assets.length}</p>}
                </div>
                <div className="bg-white border-2 border-green-600 p-6 shadow-[4px_4px_0_0_#16a34a]">
                  <p className="font-mono text-sm text-green-600 uppercase tracking-widest mb-1">Account Status</p>
                  {isLoading ? <div className="h-8 w-48 bg-green-200 animate-pulse mt-1"></div> : <p className="text-2xl font-bold font-mono mt-1">ACTIVE - SECURE</p>}
                </div>
              </div>
            )}

            <div className="flex flex-col mb-6 gap-4">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                <div className="bg-gray-900 px-4 sm:px-6 py-2 shadow-[4px_4px_0_0_#d4d4d8]">
                  <h2 className="text-xl sm:text-3xl font-bold uppercase tracking-tight whitespace-nowrap text-white">
                    {user?.role === 'ADMIN' ? 'Inventory Log' : 'My Equipment'}
                  </h2>
                </div>
                
                {user?.role === 'ADMIN' && (
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-4 w-full xl:w-auto">
                    <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search SN or Name..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border-2 border-[#e4e4e7] bg-white font-mono text-sm focus:border-[#3b82f6] outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`w-full sm:w-auto border-2 px-4 py-2.5 font-mono text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-[#e4e4e7] text-gray-600 hover:bg-gray-50 hover:text-black'}`}
                    >
                      <SlidersHorizontal size={16} /> Filters
                    </button>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleBulkImport} className="hidden" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto bg-white border-2 border-[#e4e4e7] text-gray-600 px-4 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors flex items-center justify-center gap-2"
                        title="Bulk Import CSV"
                      >
                        <Upload size={16} /> Import
                      </button>
                      <button 
                        onClick={handleExportCSV}
                        className="w-full sm:w-auto bg-white border-2 border-[#e4e4e7] text-gray-600 px-4 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors flex items-center justify-center gap-2"
                        title="Export CSV"
                      >
                        <Download size={16} /> Export
                      </button>
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full sm:w-auto bg-gray-900 text-white px-6 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors whitespace-nowrap flex justify-center items-center"
                      >
                        + Register Asset
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Filters Panel - ASSETS */}
              {user?.role === 'ADMIN' && showFilters && (
                <div className="bg-gray-50 border-2 border-gray-900 p-4 shadow-[4px_4px_0_0_#111827] flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end mt-2 animate-in slide-in-from-top-2">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Status</label>
                    <SelectDropdown
                      value={filterStatus}
                      onChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
                      options={[
                        { value: 'ALL', label: 'All Statuses' },
                        { value: 'AVAILABLE', label: 'Available' },
                        { value: 'ASSIGNED', label: 'Assigned' },
                        { value: 'MAINTENANCE', label: 'Maintenance' },
                        { value: 'RETIRED', label: 'Retired' }
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Category</label>
                    <SelectDropdown
                      value={assetFilterCategory}
                      onChange={(val) => { setAssetFilterCategory(val); setCurrentPage(1); }}
                      options={[
                        { value: 'ALL', label: 'All Categories' },
                        ...categories.map(c => ({ value: c.name, label: c.name }))
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Sort By</label>
                    <SelectDropdown
                      value={assetSortBy}
                      onChange={(val) => { setAssetSortBy(val); setCurrentPage(1); }}
                      options={[
                        { value: 'purchaseDate', label: 'Purchase Date' },
                        { value: 'name', label: 'Name' },
                        { value: 'serialNumber', label: 'Serial Number' },
                        { value: 'category', label: 'Category' },
                        { value: 'status', label: 'Status' },
                        { value: 'employee', label: 'Assigned Employee' }
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Order</label>
                    <SelectDropdown
                      value={assetSortOrder}
                      onChange={(val) => { setAssetSortOrder(val); setCurrentPage(1); }}
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

            <AssetTable 
              assets={assets} isLoading={isLoading} user={user}
              activeDropdownId={activeDropdownId} setActiveDropdownId={setActiveDropdownId}
              dropdownPos={dropdownPos} setDropdownPos={setDropdownPos}
              handleViewHistory={handleViewHistory} setAssignAssetId={setAssignAssetId} setIsAssignModalOpen={setIsAssignModalOpen}
              handleReturnAsset={handleReturnAsset} setEditingAsset={setEditingAsset} setIsEditModalOpen={setIsEditModalOpen}
              handleUpdateStatus={handleUpdateStatus} setDeleteConfirmInfo={setDeleteConfirmInfo}
            />

            {/* Pagination Controls */}
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
          </>
        )}

        {/* --- USERS TAB --- */}
        {currentTab === 'USERS' && user?.role === 'ADMIN' && (
          <>
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
              {/* Reset Requests Banner */}
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

              {/* Advanced Filters Panel - USERS */}
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

            {/* Pagination Controls */}
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
          </>
        )}

      </main>

      {/* --- MODALS --- */}

      <UserModals 
        isUserModalOpen={isUserModalOpen} newUser={newUser} setNewUser={setNewUser} handleCreateUser={handleCreateUser} handleDepartmentChange={handleDepartmentChange}
        isEditUserModalOpen={isEditUserModalOpen} editingUser={editingUser} setEditingUser={setEditingUser} handleEditUser={handleEditUser}
        isPasswordModalOpen={isPasswordModalOpen} passwordForm={passwordForm} setPasswordForm={setPasswordForm} handleUpdatePassword={handleUpdatePassword}
        isForceResetModalOpen={isForceResetModalOpen} forceResetUserEmployeeId={forceResetUserEmployeeId} forceNewPassword={forceNewPassword} setForceNewPassword={setForceNewPassword} handleForceResetPassword={handleForceResetPassword}
        closeAllModals={closeAllModals} isSubmitting={isSubmitting}
      />
      <AssetModals 
        isAddModalOpen={isAddModalOpen} newAsset={newAsset} setNewAsset={setNewAsset} handleCreateAsset={handleCreateAsset}
        isCreatingCategory={isCreatingCategory} setIsCreatingCategory={setIsCreatingCategory} newCategoryName={newCategoryName} handleCategoryNameChange={handleCategoryNameChange} handleCreateCategory={handleCreateCategory} categories={categories}
        isAssignModalOpen={isAssignModalOpen} assignSearchQuery={assignSearchQuery} setAssignSearchQuery={setAssignSearchQuery} showAssignDropdown={showAssignDropdown} setShowAssignDropdown={setShowAssignDropdown} assignUserId={assignUserId} setAssignUserId={setAssignUserId} isSearchingAssign={isSearchingAssign} assignSearchResults={assignSearchResults} handleAssignAsset={handleAssignAsset}
        isEditModalOpen={isEditModalOpen} editingAsset={editingAsset} setEditingAsset={setEditingAsset} handleUpdateAsset={handleUpdateAsset}
        isHistoryModalOpen={isHistoryModalOpen} activeHistoryAssetName={activeHistoryAssetName} historyLogs={historyLogs}
        closeAllModals={closeAllModals} isSubmitting={isSubmitting}
      />
      <DeleteModal deleteConfirmInfo={deleteConfirmInfo} setDeleteConfirmInfo={setDeleteConfirmInfo} executeDelete={executeDelete} isSubmitting={isSubmitting} />

    </div>
  );
};

export default Dashboard;
