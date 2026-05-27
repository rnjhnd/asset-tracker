import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Laptop, Monitor, Mouse, RefreshCw, X, Search, Users, Box, Clock, Download, Wrench, Trash2, Archive, CheckCircle, UserX, UserCheck, Smartphone, Tablet, Server, Network, Key, Upload, ChevronLeft, ChevronRight, SlidersHorizontal, Edit2, MoreHorizontal, User, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
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
  assignments: { user: { email: string; name: string } }[];
};

type UserAccount = {
  id: string;
  name: string;
  email: string;
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
  user: { email: string; name: string };
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
  const [userFilterStatus, setUserFilterStatus] = useState('ACTIVE');
  const [userSortBy, setUserSortBy] = useState('createdAt');
  const [userSortOrder, setUserSortOrder] = useState('asc');

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
  const [editingAsset, setEditingAsset] = useState({ id: '', name: '', serialNumber: '' });
  const [editingUser, setEditingUser] = useState({ id: '', name: '', email: '', role: 'EMPLOYEE', department: '' });
  const [assignAssetId, setAssignAssetId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE', department: '' });
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, showAbove: false });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [forceResetUserId, setForceResetUserId] = useState('');
  const [forceResetUserEmail, setForceResetUserEmail] = useState('');
  const [forceNewPassword, setForceNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History State
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
  const [activeHistoryAssetName, setActiveHistoryAssetName] = useState('');

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
      setAssetSortOrder('asc');
    } else {
      setUserSearchQuery('');
      setUserFilterStatus('ACTIVE');
      setUserFilterRole('ALL');
      setUserSortBy('createdAt');
      setUserSortOrder('asc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([
        currentTab === 'ASSETS' ? fetchAssets() : Promise.resolve(),
        user?.role === 'ADMIN' && currentTab === 'ASSETS' ? fetchTotals() : Promise.resolve(),
        user?.role === 'ADMIN' ? fetchUsers() : Promise.resolve(),
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
    setCurrentPage(1);
    const delayDebounceFn = setTimeout(() => {
      if (token && currentTab === 'ASSETS') fetchAssets();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    const delayDebounceFn = setTimeout(() => {
      if (token && currentTab === 'USERS') fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

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
      setIsAddModalOpen(false);
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
      setIsUserModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'EMPLOYEE', department: '' });
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
      setIsEditUserModalOpen(false);
      setEditingUser({ id: '', name: '', email: '', role: 'EMPLOYEE', department: '' });
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
        toast.success('Employee permanently deleted!');
        fetchUsers();
      } else {
        await axios.delete(`${API_URL}/api/assets/${deleteConfirmInfo.id}`, { headers: { Authorization: `Bearer ${token}` } });
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
      setIsAssignModalOpen(false);
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
        serialNumber: editingAsset.serialNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditModalOpen(false);
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
      setIsPasswordModalOpen(false);
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
      setIsForceResetModalOpen(false);
      setForceNewPassword('');
      fetchUsers();
      toast.success(`PASSWORD RESET FOR ${forceResetUserEmail}`, { id: 'force-reset' });
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
        asset.assignments.length > 0 ? (asset.assignments[0].user.name || asset.assignments[0].user.email) : 'None'
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
        
        // Very simple CSV parser (Assumes: name,serial,category)
        const parsedAssets = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            name: values[0],
            serialNumber: values[1],
            category: values[2]?.toUpperCase() || 'LAPTOP'
          };
        }).filter(a => a.name && a.serialNumber);

        if (parsedAssets.length === 0) return toast.error('No valid rows found in CSV.');

        await axios.post(`${API_URL}/api/assets/bulk`, parsedAssets, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success(`Bulk import successful!`);
        fetchAssets();
        fetchTotals();
      } catch (error) {
        toast.error('Failed to import CSV. Check format.');
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

  const getIcon = (category: string) => {
    if (category === 'LAPTOP') return <Laptop size={18} />;
    if (category === 'DESKTOP') return <Monitor size={18} />;
    if (category === 'MONITOR') return <Monitor size={18} />;
    if (category === 'TABLET') return <Tablet size={18} />;
    if (category === 'PHONE') return <Smartphone size={18} />;
    if (category === 'SERVER') return <Server size={18} />;
    if (category === 'NETWORK') return <Network size={18} />;
    return <Mouse size={18} />;
  };

  const BrutalistTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] p-3">
          <p className="font-mono font-bold text-sm uppercase">{label || payload[0].name}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="font-mono text-sm uppercase text-gray-700">
              {p.name}: <span className="font-bold text-black">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartColors = ['#3b82f6', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#ea580c', '#0d9488'];

  return (
    <div className="min-h-screen bg-transparent text-gray-900 font-sans">

      <header className="bg-white border-b-4 border-gray-900 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-40 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#3b82f6] text-white flex items-center justify-center font-mono shrink-0 shadow-[4px_4px_0_0_#1e3a8a]">
            <Server size={24} />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tighter text-gray-900 leading-none mb-1">INTERNAL ASSET PORTAL</h1>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest mt-1">
              <span className="flex items-center gap-1.5 text-green-600 font-bold whitespace-nowrap">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                ONLINE
              </span>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <span className="font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[250px]" title={user?.email}>{user?.email}</span>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <span className="bg-gray-100 px-2 py-0.5 border border-gray-300 whitespace-nowrap">{user?.role}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center w-full sm:w-auto mt-2 sm:mt-0 relative profile-dropdown-container">
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="w-full sm:w-auto flex justify-between sm:justify-center items-center gap-2 bg-white border-2 border-gray-900 text-gray-900 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors shadow-[4px_4px_0_0_#111827] hover:bg-gray-50 hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_0_#111827]"
          >
            <div className="flex items-center gap-2">
              <User size={14} /> Hi, {user?.name?.split(' ')[0] || user?.role}
            </div>
            <ChevronDown size={14} className={`transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isProfileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-full sm:w-56 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] flex flex-col p-1 text-left z-50">
              <div className="px-3 py-2 border-b border-gray-200 mb-1">
                <p className="font-mono text-[10px] text-gray-500 uppercase font-bold tracking-widest">Signed in as</p>
                <p className="font-mono text-sm truncate text-gray-900 font-bold" title={user?.name}>{user?.name}</p>
                <p className="font-mono text-xs truncate text-gray-500" title={user?.email}>{user?.email}</p>
              </div>
              <button 
                onClick={() => { setIsPasswordModalOpen(true); setIsProfileDropdownOpen(false); }}
                className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <Key size={14} /> Change Password
              </button>
              <button 
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-mono text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors mt-1"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 1. Asset Distribution */}
                <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2">Asset Distribution</h3>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    {isLoading ? <RefreshCw size={32} className="animate-spin text-gray-400" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryStats}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="#111827"
                            strokeWidth={2}
                          >
                            {stats.categoryStats.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<BrutalistTooltip />} />
                          <Legend iconType="square" wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 2. Status Breakdown */}
                <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2">Status Breakdown ({stats.total} Total)</h3>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    {isLoading ? <RefreshCw size={32} className="animate-spin text-gray-400" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Available', count: stats.available, fill: '#16a34a' },
                          { name: 'Deployed', count: stats.assigned, fill: '#3b82f6' },
                          { name: 'Maintenance', count: stats.maintenance, fill: '#ca8a04' },
                          { name: 'Retired', count: stats.retired, fill: '#dc2626' }
                        ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} />
                          <YAxis tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} />
                          <Tooltip content={<BrutalistTooltip />} cursor={{ fill: '#f3f4f6' }} />
                          <Bar dataKey="count" stroke="#111827" strokeWidth={2} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 3. Hardware Aging */}
                <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2">Hardware Aging (By Purchase Year)</h3>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    {isLoading ? <RefreshCw size={32} className="animate-spin text-gray-400" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.agingStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                          <XAxis dataKey="year" tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} />
                          <YAxis tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<BrutalistTooltip />} cursor={{ fill: '#f3f4f6' }} />
                          <Bar dataKey="count" fill="#9333ea" stroke="#111827" strokeWidth={2} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 4. Utilization Timeline */}
                <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2">Assignments (Last 6 Months)</h3>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    {isLoading ? <RefreshCw size={32} className="animate-spin text-gray-400" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.timelineStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} />
                          <YAxis tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<BrutalistTooltip />} />
                          <Area type="monotone" dataKey="assignments" stroke="#ea580c" strokeWidth={2} fill="#ffedd5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
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
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                <div className="bg-gray-50 border-2 border-gray-900 p-4 shadow-[4px_4px_0_0_#111827] flex flex-col sm:flex-row flex-wrap gap-4 items-end mt-2 animate-in slide-in-from-top-2">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Status</label>
                    <select 
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Category</label>
                    <select 
                      value={assetFilterCategory}
                      onChange={(e) => { setAssetFilterCategory(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white"
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Sort By</label>
                    <select 
                      value={assetSortBy}
                      onChange={(e) => { setAssetSortBy(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white"
                    >
                      <option value="purchaseDate">Purchase Date</option>
                      <option value="name">Name</option>
                      <option value="serialNumber">Serial Number</option>
                      <option value="category">Category</option>
                      <option value="status">Status</option>
                      <option value="employee">Assigned Employee</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Order</label>
                    <select 
                      value={assetSortOrder}
                      onChange={(e) => { setAssetSortOrder(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleResetFilters}
                    className="flex-none px-4 py-2 border-2 border-red-500 text-red-500 font-mono text-sm uppercase tracking-wider font-bold hover:bg-red-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e4e4e7] shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px] relative">
                  <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_#e4e4e7]">
                    <tr className="font-mono text-xs uppercase tracking-wider text-gray-500">
                      <th className="p-4 bg-gray-50">Asset Name</th>
                      <th className="p-4 bg-gray-50">Category</th>
                      <th className="p-4 bg-gray-50">Serial / ID</th>
                      <th className="p-4 bg-gray-50">Purchase Date</th>
                      <th className="p-4 bg-gray-50">Status</th>
                      {user?.role === 'ADMIN' && <th className="p-4 bg-gray-50">Assigned To</th>}
                      {user?.role === 'ADMIN' && <th className="p-4 text-right w-24 bg-gray-50">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e4e7]">
                    {!isLoading && assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-50 transition-all hover:shadow-[inset_4px_0_0_0_#3b82f6] group">
                        <td className="p-4 font-bold flex items-center gap-3">
                          <span className="text-[#3b82f6]">{getIcon(asset.category)}</span>
                          {asset.name}
                        </td>
                        <td className="p-4 font-mono text-sm">{asset.category}</td>
                        <td className="p-4 font-mono text-xs text-gray-500">{asset.serialNumber}</td>
                        <td className="p-4 font-mono text-xs text-gray-600">
                          {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs border rounded-full ${
                            asset.status === 'AVAILABLE' ? 'border-green-300 bg-green-50 text-green-700' :
                            asset.status === 'ASSIGNED' ? 'border-blue-300 bg-blue-50 text-blue-700' :
                            asset.status === 'MAINTENANCE' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                            'border-red-300 bg-red-50 text-red-700'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {asset.status}
                          </span>
                        </td>
                        {user?.role === 'ADMIN' && (
                          <td className="p-4 font-mono text-sm text-gray-900 font-bold">
                            {asset.assignments.length > 0 ? (asset.assignments[0].user.name || asset.assignments[0].user.email) : '--'}
                          </td>
                        )}
                        {user?.role === 'ADMIN' && (
                          <td className="p-4 text-right">
                            <div className="relative inline-block text-left action-dropdown-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const showAbove = (window.innerHeight - rect.bottom) < 260;
                                  
                                  setDropdownPos({ 
                                    top: showAbove ? rect.top + window.scrollY : rect.bottom + window.scrollY, 
                                    left: rect.right + window.scrollX - 192,
                                    showAbove
                                  });
                                  setActiveDropdownId(activeDropdownId === asset.id ? null : asset.id);
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-900 shadow-[2px_2px_0_0_#111827] hover:bg-gray-50 hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_0_#111827] transition-all"
                              >
                                <MoreHorizontal size={16} />
                              </button>

                              {activeDropdownId === asset.id && createPortal(
                                <div 
                                  style={{ 
                                    top: `${dropdownPos.top}px`, 
                                    left: `${dropdownPos.left}px`,
                                    transform: dropdownPos.showAbove ? 'translateY(-100%)' : 'none',
                                    marginTop: dropdownPos.showAbove ? '-8px' : '8px'
                                  }}
                                  className="absolute z-[9999] w-48 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] flex flex-col p-1 text-left action-dropdown-container"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button onClick={() => { handleViewHistory(asset.id, asset.name); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"><Clock size={14}/> Audit Log</button>
                                  
                                  {asset.status === 'AVAILABLE' && <button onClick={() => { setAssignAssetId(asset.id); setIsAssignModalOpen(true); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-[#3b82f6] hover:bg-blue-50 flex items-center gap-3 font-bold uppercase transition-colors"><CheckCircle size={14}/> Assign</button>}
                                  {asset.status === 'ASSIGNED' && <button onClick={() => { handleReturnAsset(asset.id); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-orange-600 hover:bg-orange-50 flex items-center gap-3 font-bold uppercase transition-colors"><RefreshCw size={14}/> Return</button>}
                                  
                                  <div className="h-px bg-gray-200 my-1 mx-2"></div>
                                  
                                  <button onClick={() => { setEditingAsset({ id: asset.id, name: asset.name, serialNumber: asset.serialNumber }); setIsEditModalOpen(true); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"><Edit2 size={14}/> Edit Asset</button>
                                  
                                  {asset.status !== 'AVAILABLE' && <button onClick={() => { handleUpdateStatus(asset.id, 'AVAILABLE'); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-green-600 hover:bg-green-50 flex items-center gap-3 transition-colors"><CheckCircle size={14}/> Make Available</button>}
                                  {asset.status !== 'RETIRED' && <button onClick={() => { handleUpdateStatus(asset.id, 'MAINTENANCE'); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-yellow-600 hover:bg-yellow-50 flex items-center gap-3 transition-colors"><Wrench size={14}/> Maintenance</button>}
                                  {asset.status !== 'RETIRED' && <button onClick={() => { handleUpdateStatus(asset.id, 'RETIRED'); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"><Archive size={14}/> Retire</button>}
                                  <div className="h-px bg-gray-200 my-1 mx-2"></div>
                                  <button onClick={() => { setDeleteConfirmInfo({ id: asset.id, type: 'ASSET' }); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-red-800 hover:bg-red-100 flex items-center gap-3 transition-colors font-bold"><Trash2 size={14}/> Hard Delete</button>
                                </div>,
                                document.body
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {isLoading && (
                      <tr>
                        <td colSpan={user?.role === 'ADMIN' ? 6 : 4} className="p-24 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-900">
                            <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
                            <p className="font-mono text-sm uppercase tracking-widest font-bold">Loading Data...</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!isLoading && assets.length === 0 && (
                      <tr>
                        <td colSpan={user?.role === 'ADMIN' ? 6 : 4} className="p-24 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Box size={48} className="mb-4 opacity-50" />
                            <p className="font-mono text-sm uppercase tracking-widest font-bold text-gray-900">
                              {user?.role === 'ADMIN' ? 'No assets found matching your filters.' : 'You have no assigned equipment.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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
                {isLoading ? <div className="h-10 w-16 bg-gray-200 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{userStats.total}</p>}
              </div>
              <div className="bg-white border-2 border-green-600 p-6 shadow-[4px_4px_0_0_#16a34a]">
                <p className="font-mono text-sm text-green-600 uppercase tracking-widest mb-1">Active Accounts</p>
                {isLoading ? <div className="h-10 w-16 bg-green-100 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{userStats.active}</p>}
              </div>
              <div className="bg-white border-2 border-red-600 p-6 shadow-[4px_4px_0_0_#dc2626]">
                <p className="font-mono text-sm text-red-600 uppercase tracking-widest mb-1">Deactivated</p>
                {isLoading ? <div className="h-10 w-16 bg-red-100 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{userStats.deactivated}</p>}
              </div>
              <div className="bg-white border-2 border-purple-600 p-6 shadow-[4px_4px_0_0_#9333ea]">
                <p className="font-mono text-sm text-purple-600 uppercase tracking-widest mb-1">System Admins</p>
                {isLoading ? <div className="h-10 w-16 bg-purple-100 animate-pulse mt-1"></div> : <p className="text-4xl font-bold font-mono">{userStats.admins}</p>}
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
                      placeholder="Search Email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
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
                <div className="bg-gray-50 border-2 border-gray-900 p-4 shadow-[4px_4px_0_0_#111827] flex flex-col sm:flex-row flex-wrap gap-4 items-end mt-2 animate-in slide-in-from-top-2">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Status</label>
                    <select 
                      value={userFilterStatus}
                      onChange={(e) => { setUserFilterStatus(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="DEACTIVATED">Deactivated</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Role</label>
                    <select 
                      value={userFilterRole}
                      onChange={(e) => { setUserFilterRole(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ADMIN">Admin</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Sort By</label>
                    <select 
                      value={userSortBy}
                      onChange={(e) => { setUserSortBy(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white"
                    >
                      <option value="createdAt">Date Added</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="role">Role</option>
                      <option value="department">Department</option>
                      <option value="isActive">Status</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-mono text-xs font-bold uppercase mb-1">Order</label>
                    <select 
                      value={userSortOrder}
                      onChange={(e) => { setUserSortOrder(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleResetFilters}
                    className="flex-none px-4 py-2 border-2 border-red-500 text-red-500 font-mono text-sm uppercase tracking-wider font-bold hover:bg-red-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e4e4e7] shadow-sm overflow-hidden mb-12">
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
                          <span className="font-mono text-xs text-gray-500 mt-0.5">{u.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 font-mono text-xs border ${
                          u.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm">{u.department}</td>
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
                            onClick={() => {
                              setEditingUser({
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                role: u.role,
                                department: u.department
                              });
                              setIsEditUserModalOpen(true);
                            }}
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
                            onClick={() => {
                              setForceResetUserId(u.id);
                              setForceResetUserEmail(u.email);
                              setIsForceResetModalOpen(true);
                            }}
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
                      <td colSpan={5} className="p-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-900">
                          <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
                          <p className="font-mono text-sm uppercase tracking-widest font-bold">Loading Directory...</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!isLoading && users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-24 text-center">
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
          </>
        )}

      </main>

      {/* --- MODALS --- */}

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Security Settings</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Current Password</label>
                <input required type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">New Password</label>
                <input required type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" />
                <p className="font-mono text-[10px] text-gray-500 mt-2">Must be at least 8 characters long.</p>
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-gray-900 text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-black transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Force Reset Password Modal (Admin Only) */}
      {isForceResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => setIsForceResetModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2 border-b pb-4">Force Reset Password</h3>
            <p className="font-mono text-xs text-gray-500 mb-6 uppercase">Target Account: {forceResetUserEmail}</p>
            <form onSubmit={handleForceResetPassword} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">New Temporary Password</label>
                <input required type="text" value={forceNewPassword} onChange={e => setForceNewPassword(e.target.value)} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. TempPass123!" />
                <p className="font-mono text-[10px] text-gray-500 mt-2">Must be at least 8 characters long.</p>
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-red-600 text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-red-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'OVERRIDE PASSWORD'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-lg relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => setIsHistoryModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2 pr-8">{activeHistoryAssetName}</h3>
            <p className="font-mono text-sm text-gray-500 uppercase mb-6 border-b pb-4">Audit Log & Lifecycle</p>
            
            <div className="overflow-y-auto pr-2 pl-4 space-y-4">
              {historyLogs.length === 0 ? (
                <p className="font-mono text-sm text-gray-400 uppercase text-center py-8">No historical data found.</p>
              ) : (
                historyLogs.map(log => (
                  <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-2 relative">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-4 border-2 border-white ${log.returnDate ? 'bg-gray-400' : 'bg-green-500'}`}></div>
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 p-2 border border-gray-200">
                        <User size={20} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1">{log.user.name || log.user.email}</p>
                        <div className="font-mono text-xs text-gray-500 flex flex-col gap-1">
                          <span>CHECKOUT: {new Date(log.checkoutDate).toLocaleString()}</span>
                          {log.returnDate ? (
                            <span className="text-gray-400">RETURNED: {new Date(log.returnDate).toLocaleString()}</span>
                          ) : (
                            <span className="text-green-600 font-bold">STATUS: ACTIVE</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Register New Hardware</h3>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Asset Name</label>
                <input required type="text" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. MacBook Pro 16" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Serial Number</label>
                <input required type="text" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. MBP-2024-001" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Category</label>
                {isCreatingCategory ? (
                  <div className="flex gap-2">
                    <input required autoFocus type="text" value={newCategoryName} onChange={handleCategoryNameChange} className="flex-1 border-2 border-[#3b82f6] p-3 font-mono text-sm focus:border-blue-600 outline-none transition-colors" placeholder="E.g. VR HEADSET" />
                    <button type="button" onClick={handleCreateCategory} disabled={isSubmitting || !newCategoryName.trim()} className="bg-[#3b82f6] text-white px-4 font-bold hover:bg-blue-600 transition-colors">ADD</button>
                    <button type="button" onClick={() => setIsCreatingCategory(false)} className="bg-gray-200 text-gray-700 px-4 font-bold hover:bg-gray-300 transition-colors">CANCEL</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})} className="flex-1 border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none bg-white transition-colors">
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setIsCreatingCategory(true)} className="bg-gray-900 text-white px-4 font-bold hover:bg-gray-700 transition-colors whitespace-nowrap">+ NEW</button>
                  </div>
                )}
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Deploy to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Asset Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => setIsAssignModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Assign Hardware</h3>
            <form onSubmit={handleAssignAsset} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Search & Select Employee</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={assignSearchQuery}
                    onChange={(e) => {
                      setAssignSearchQuery(e.target.value);
                      setShowAssignDropdown(true);
                      setAssignUserId('');
                    }}
                    onFocus={() => setShowAssignDropdown(true)}
                    className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none bg-white transition-colors"
                    placeholder="Type to search employee..."
                    required={!assignUserId}
                  />
                  {showAssignDropdown && assignSearchQuery.trim().length > 0 && (
                    <ul className="w-full bg-white border-2 border-gray-900 border-t-0 shadow-[4px_4px_0_0_#111827] mt-0 max-h-48 overflow-y-auto">
                      {users.filter(u => u.isActive && u.role !== 'ADMIN' && (u.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(assignSearchQuery.toLowerCase()))).length === 0 ? (
                        <li className="p-3 font-mono text-sm text-gray-500">No employees found.</li>
                      ) : (
                        users.filter(u => u.isActive && u.role !== 'ADMIN' && (u.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(assignSearchQuery.toLowerCase()))).map(u => (
                          <li 
                            key={u.id} 
                            onClick={() => {
                              setAssignUserId(u.id);
                              setAssignSearchQuery(`${u.name} (${u.email})`);
                              setShowAssignDropdown(false);
                            }}
                            className="p-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 cursor-pointer font-mono text-sm transition-colors text-left"
                          >
                            <div className="font-bold text-gray-900">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors">Confirm Assignment</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight uppercase mb-6 flex items-center gap-3">
              <Edit2 className="text-[#3b82f6]" />
              Edit Asset Details
            </h2>
            <form onSubmit={handleUpdateAsset} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Asset Name</label>
                <input required autoFocus type="text" value={editingAsset.name} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Serial Number</label>
                <input required type="text" value={editingAsset.serialNumber} onChange={e => setEditingAsset({...editingAsset, serialNumber: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" />
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Register Employee</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Full Name</label>
                <input 
                  required 
                  type="text" 
                  pattern="^[A-Za-z\s]+$" 
                  title="Only letters and spaces are allowed." 
                  value={newUser.name} 
                  onChange={e => {
                    const rawVal = e.target.value;
                    if (/[^A-Za-z\s]/.test(rawVal)) {
                      toast('Only letters and spaces are allowed for Full Name', { icon: '⚠️', id: 'name-val-err' });
                    }
                    setNewUser({...newUser, name: rawVal.replace(/[^A-Za-z\s]/g, '')});
                  }} 
                  className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" 
                  placeholder="e.g. John Doe" 
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Email Address</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="employee@system.com" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Initial Password</label>
                <div className="relative mb-2">
                  <input required type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. temporary123" />
                </div>
                <p className="font-mono text-[10px] text-gray-500">Must be at least 8 characters long.</p>
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Department</label>
                <input required type="text" value={newUser.department} onChange={handleDepartmentChange} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. ENGINEERING" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">System Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none bg-white transition-colors">
                  <option value="EMPLOYEE">Standard Employee</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => setIsEditUserModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Edit Employee</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={editingUser.name} 
                  onChange={e => {
                    const rawVal = e.target.value;
                    if (/[^A-Za-z\s]/.test(rawVal)) {
                      toast('Only letters and spaces are allowed for Full Name', { icon: '⚠️', id: 'edit-name-val-err' });
                    }
                    setEditingUser({...editingUser, name: rawVal.replace(/[^A-Za-z\s]/g, '')});
                  }} 
                  className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" 
                  placeholder="e.g. John Doe" 
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Email Address</label>
                <input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. john@company.com" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Department</label>
                <input 
                  required 
                  type="text" 
                  value={editingUser.department} 
                  onChange={e => {
                    const raw = e.target.value;
                    const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
                    if (raw !== sanitized) toast('Only letters and spaces allowed', { icon: '⚠️', id: 'edit-dept-val-err' });
                    setEditingUser({...editingUser, department: sanitized.toUpperCase()});
                  }} 
                  className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" 
                  placeholder="e.g. ENGINEERING" 
                />
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    {/* Delete Confirmation Modal */}
      {deleteConfirmInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white border-2 border-red-600 shadow-[8px_8px_0_0_#dc2626] p-6 sm:p-8 w-full max-w-md relative mx-4">
            <div className="flex items-center gap-4 mb-4 text-red-600">
              <Trash2 size={32} />
              <h2 className="text-2xl font-bold font-mono tracking-tight uppercase">Hard Delete</h2>
            </div>
            <p className="text-gray-700 font-mono text-sm mb-6">
              Are you absolutely sure? This will permanently delete this {deleteConfirmInfo.type.toLowerCase()} from the database.
              <br/><br/>
              <span className="font-bold text-red-600">WARNING:</span> This will only succeed if the {deleteConfirmInfo.type.toLowerCase()} has <span className="font-bold underline">ZERO</span> assignment history. Otherwise, you must Retire/Deactivate them instead to preserve audit logs.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirmInfo(null)}
                className="flex-1 bg-gray-100 text-gray-700 border-2 border-gray-300 font-mono uppercase font-bold py-3 hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className={`flex-1 bg-red-600 text-white font-mono uppercase font-bold py-3 hover:bg-red-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'DELETING...' : 'YES, DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
