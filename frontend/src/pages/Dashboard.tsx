import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Laptop, Monitor, Mouse, RefreshCw, X, Search, Filter, Copy, Users, Box, Clock, Download, Wrench, Trash2, CheckCircle, UserX, UserCheck, Smartphone, Tablet, Server, Network, Key, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import API_URL from '../config/api';

type Asset = {
  id: string;
  name: string;
  serialNumber: string;
  category: 'LAPTOP' | 'DESKTOP' | 'MONITOR' | 'TABLET' | 'PHONE' | 'SERVER' | 'NETWORK' | 'ACCESSORY';
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  assignments: { user: { email: string } }[];
};

type UserAccount = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
};

type AuditLog = {
  id: string;
  checkoutDate: string;
  returnDate: string | null;
  user: { email: string };
};

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState({ total: 0, available: 0, assigned: 0, maintenance: 0 });
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, deactivated: 0, admins: 0 });
  const [currentTab, setCurrentTab] = useState<'ASSETS' | 'USERS'>('ASSETS');

  // Search, Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isForceResetModalOpen, setIsForceResetModalOpen] = useState(false);
  
  // Form States
  const [newAsset, setNewAsset] = useState({ name: '', serialNumber: '', category: 'LAPTOP', purchaseDate: new Date().toISOString().split('T')[0] });
  const [assignAssetId, setAssignAssetId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'EMPLOYEE' });
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

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchAssets(),
        user?.role === 'ADMIN' ? fetchTotals() : Promise.resolve(),
        user?.role === 'ADMIN' ? fetchUsers() : Promise.resolve()
      ]);
      setIsLoading(false);
    };
    
    loadAll();
  }, [token, navigate, user?.role, currentPage, filterStatus]);

  // Debounced Search Effect
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on new search
    const delayDebounceFn = setTimeout(() => {
      if (token) fetchAssets();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assets?page=${currentPage}&limit=15&search=${searchQuery}&status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssets(response.data.data);
      setTotalPages(response.data.totalPages);
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
        axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/users/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setUserStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch users or stats');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('SYSTEM DISCONNECTED');
    navigate('/login');
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/assets`, newAsset, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAddModalOpen(false);
      setNewAsset({ name: '', serialNumber: '', category: 'LAPTOP', purchaseDate: new Date().toISOString().split('T')[0] });
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
      setNewUser({ email: '', password: '', role: 'EMPLOYEE' });
      fetchUsers();
      toast.success('Employee account created!');
    } catch (error) {
      toast.error('Failed to create user. Email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/assets/${assignAssetId}/assign`, { userId: assignUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAssignModalOpen(false);
      setAssignUserId('');
      fetchAssets();
      fetchTotals();
      toast.success('Asset assigned successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign asset. Please ensure the UUID is correct.');
    } finally {
      setIsSubmitting(false);
    }
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
      toast.success(`PASSWORD RESET FOR ${forceResetUserEmail}`, { id: 'force-reset' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to force reset password.', { id: 'force-reset-err' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('UUID copied to clipboard!', { id: 'copy-uuid' });
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
        asset.assignments.length > 0 ? asset.assignments[0].user.email : 'None'
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

  return (
    <div className="min-h-screen bg-transparent text-gray-900 font-sans">
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            borderRadius: '0',
            background: '#111827',
            color: '#fff',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            border: '2px solid #000',
            boxShadow: '4px 4px 0 0 #000',
            fontSize: '12px',
            fontWeight: 'bold'
          },
        }}
      />
      <header className="bg-white border-b-4 border-gray-900 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 sticky top-0 shadow-sm">
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
        <div className="flex items-center w-full sm:w-auto gap-3 sm:gap-4 mt-2 sm:mt-0">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-white border-2 border-gray-300 hover:border-gray-900 text-gray-600 hover:text-black font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors shadow-sm"
          >
            <Key size={14} /> Password
          </button>
          <button 
            onClick={handleLogout}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-red-50 border-2 border-red-200 hover:border-red-600 text-red-600 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors shadow-sm"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* Admin Tab Navigation */}
        {user?.role === 'ADMIN' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
            <button 
              onClick={() => setCurrentTab('ASSETS')}
              className={`flex items-center justify-center sm:justify-start gap-2 font-mono text-sm uppercase tracking-wider font-bold transition-colors w-full sm:w-auto px-6 py-3 border-2 ${currentTab === 'ASSETS' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-[#e4e4e7] hover:border-gray-400 hover:text-black'}`}
            >
              <Box size={16} /> Hardware
            </button>
            <button 
              onClick={() => setCurrentTab('USERS')}
              className={`flex items-center justify-center sm:justify-start gap-2 font-mono text-sm uppercase tracking-wider font-bold transition-colors w-full sm:w-auto px-6 py-3 border-2 ${currentTab === 'USERS' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-[#e4e4e7] hover:border-gray-400 hover:text-black'}`}
            >
              <Users size={16} /> Employees
            </button>
          </div>
        )}

        {/* --- ASSETS TAB --- */}
        {currentTab === 'ASSETS' && (
          <>
            {/* KPI Analytics Cards (Admin Only) */}
            {user?.role === 'ADMIN' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
                  <p className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-1">Total Assets</p>
                  <p className="text-4xl font-bold font-mono">{stats.total}</p>
                </div>
                <div className="bg-white border-2 border-blue-600 p-6 shadow-[4px_4px_0_0_#2563eb]">
                  <p className="font-mono text-sm text-blue-600 uppercase tracking-widest mb-1">Deployed</p>
                  <p className="text-4xl font-bold font-mono">{stats.assigned}</p>
                </div>
                <div className="bg-white border-2 border-green-600 p-6 shadow-[4px_4px_0_0_#16a34a]">
                  <p className="font-mono text-sm text-green-600 uppercase tracking-widest mb-1">Available</p>
                  <p className="text-4xl font-bold font-mono">{stats.available}</p>
                </div>
                <div className="bg-white border-2 border-yellow-600 p-6 shadow-[4px_4px_0_0_#ca8a04]">
                  <p className="font-mono text-sm text-yellow-600 uppercase tracking-widest mb-1">Maintenance</p>
                  <p className="text-4xl font-bold font-mono">{stats.maintenance}</p>
                </div>
              </div>
            )}

            {/* Employee Specific KPI Cards */}
            {user?.role === 'EMPLOYEE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
                  <p className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-1">Active Devices</p>
                  <p className="text-4xl font-bold font-mono">{assets.length}</p>
                </div>
                <div className="bg-white border-2 border-green-600 p-6 shadow-[4px_4px_0_0_#16a34a]">
                  <p className="font-mono text-sm text-green-600 uppercase tracking-widest mb-1">Account Status</p>
                  <p className="text-2xl font-bold font-mono mt-1">ACTIVE - SECURE</p>
                </div>
              </div>
            )}

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 gap-4">
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
                  <div className="relative w-full sm:w-auto sm:flex-1 min-w-[150px]">
                    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select 
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-2 border-2 border-[#e4e4e7] font-mono text-sm focus:border-[#3b82f6] outline-none bg-white appearance-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>
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

            <div className="bg-white border border-[#e4e4e7] shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px] relative">
                  <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_#e4e4e7]">
                    <tr className="font-mono text-xs uppercase tracking-wider text-gray-500">
                      <th className="p-4 bg-gray-50">Asset Name</th>
                      <th className="p-4 bg-gray-50">Category</th>
                      <th className="p-4 bg-gray-50">Serial / ID</th>
                      <th className="p-4 bg-gray-50">Status</th>
                      {user?.role === 'ADMIN' && <th className="p-4 bg-gray-50">Assigned To</th>}
                      {user?.role === 'ADMIN' && <th className="p-4 text-right min-w-[250px] bg-gray-50">Actions</th>}
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
                          <td className="p-4 font-mono text-sm">
                            {asset.assignments.length > 0 ? asset.assignments[0].user.email : '--'}
                          </td>
                        )}
                        {user?.role === 'ADMIN' && (
                          <td className="p-4 flex items-center justify-end gap-3 flex-wrap">
                            {/* Log Button */}
                            <button 
                              onClick={() => handleViewHistory(asset.id, asset.name)}
                              className="text-gray-400 hover:text-black transition-colors"
                              title="View Audit Log"
                            >
                              <Clock size={16} />
                            </button>

                            {/* Lifecycle Actions */}
                            <div className="h-4 w-px bg-gray-300 mx-1"></div>
                            
                            {asset.status !== 'AVAILABLE' && (
                              <button 
                                onClick={() => handleUpdateStatus(asset.id, 'AVAILABLE')}
                                className="text-gray-400 hover:text-green-600 transition-colors"
                                title="Make Available / Unretire"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            
                            {asset.status !== 'MAINTENANCE' && asset.status !== 'RETIRED' && (
                              <button 
                                onClick={() => handleUpdateStatus(asset.id, 'MAINTENANCE')}
                                className="text-gray-400 hover:text-yellow-600 transition-colors"
                                title="Send to Maintenance"
                              >
                                <Wrench size={16} />
                              </button>
                            )}
                            
                            {asset.status !== 'RETIRED' && (
                              <button 
                                onClick={() => handleUpdateStatus(asset.id, 'RETIRED')}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Retire Asset"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            
                            {/* Assignment Actions */}
                            {(asset.status === 'AVAILABLE' || asset.status === 'ASSIGNED') && (
                              <div className="h-4 w-px bg-gray-300 mx-1"></div>
                            )}

                            {asset.status === 'AVAILABLE' && (
                              <button 
                                onClick={() => { setAssignAssetId(asset.id); setIsAssignModalOpen(true); }}
                                className="text-[#3b82f6] hover:underline font-mono text-sm uppercase"
                              >
                                Assign
                              </button>
                            )}
                            {asset.status === 'ASSIGNED' && (
                              <button 
                                onClick={() => handleReturnAsset(asset.id)}
                                className="text-orange-500 hover:underline font-mono text-sm uppercase flex items-center gap-1"
                              >
                                <RefreshCw size={14} /> Return
                              </button>
                            )}
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
                            <p className="font-mono text-sm uppercase tracking-widest text-gray-500">
                              {user?.role === 'ADMIN' ? 'No Assets Match Criteria.' : 'You have no assigned equipment.'}
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
                <p className="text-4xl font-bold font-mono">{userStats.total}</p>
              </div>
              <div className="bg-white border-2 border-green-600 p-6 shadow-[4px_4px_0_0_#16a34a]">
                <p className="font-mono text-sm text-green-600 uppercase tracking-widest mb-1">Active Accounts</p>
                <p className="text-4xl font-bold font-mono">{userStats.active}</p>
              </div>
              <div className="bg-white border-2 border-red-600 p-6 shadow-[4px_4px_0_0_#dc2626]">
                <p className="font-mono text-sm text-red-600 uppercase tracking-widest mb-1">Deactivated</p>
                <p className="text-4xl font-bold font-mono">{userStats.deactivated}</p>
              </div>
              <div className="bg-white border-2 border-purple-600 p-6 shadow-[4px_4px_0_0_#9333ea]">
                <p className="font-mono text-sm text-purple-600 uppercase tracking-widest mb-1">System Admins</p>
                <p className="text-4xl font-bold font-mono">{userStats.admins}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
              <div className="bg-gray-900 px-4 sm:px-6 py-2 shadow-[4px_4px_0_0_#d4d4d8]">
                <h2 className="text-xl sm:text-3xl font-bold uppercase tracking-tight text-white">Employee Directory</h2>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(true)}
                className="w-full sm:w-auto bg-gray-900 text-white px-6 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors whitespace-nowrap flex justify-center items-center"
              >
                + Register User
              </button>
            </div>

            <div className="bg-white border border-[#e4e4e7] shadow-sm overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_#e4e4e7]">
                    <tr className="font-mono text-xs uppercase tracking-wider text-gray-500">
                      <th className="p-4 bg-gray-50">Email</th>
                      <th className="p-4 bg-gray-50">Role</th>
                      <th className="p-4 bg-gray-50">Status</th>
                      <th className="p-4 bg-gray-50">Account Created</th>
                      <th className="p-4 text-right bg-gray-50">System ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e4e7]">
                    {!isLoading && users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-all hover:shadow-[inset_4px_0_0_0_#3b82f6] group">
                      <td className="p-4 font-bold">{u.email}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 font-mono text-xs border ${
                          u.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs border rounded-full ${
                          u.isActive ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} font-mono text-sm uppercase transition-colors`}
                          title={u.isActive ? "Deactivate User" : "Reactivate User"}
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
                          onClick={() => copyToClipboard(u.id)}
                          className="text-[#3b82f6] hover:underline font-mono text-sm uppercase flex items-center gap-1"
                          title="Copy UUID"
                        >
                          <Copy size={14} /> Copy UUID
                        </button>
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
                          <p className="font-mono text-sm uppercase tracking-widest text-gray-500">Loading directory...</p>
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
                    <p className="font-bold text-sm mb-1">{log.user.email}</p>
                    <div className="font-mono text-xs text-gray-500 flex flex-col gap-1">
                      <span>CHECKOUT: {new Date(log.checkoutDate).toLocaleString()}</span>
                      {log.returnDate ? (
                        <span className="text-gray-400">RETURNED: {new Date(log.returnDate).toLocaleString()}</span>
                      ) : (
                        <span className="text-green-600 font-bold">STATUS: ACTIVE</span>
                      )}
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
                <select value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value as any})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none bg-white transition-colors">
                  <option value="LAPTOP">Laptop</option>
                  <option value="DESKTOP">Desktop</option>
                  <option value="MONITOR">Monitor</option>
                  <option value="TABLET">Tablet</option>
                  <option value="PHONE">Phone / Mobile</option>
                  <option value="SERVER">Server</option>
                  <option value="NETWORK">Networking Device</option>
                  <option value="ACCESSORY">Accessory / Other</option>
                </select>
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
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Employee UUID</label>
                <input required type="text" value={assignUserId} onChange={e => setAssignUserId(e.target.value)} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="Paste UUID from Employees tab..." />
              </div>
              <button type="submit" className="w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors">Confirm Assignment</button>
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
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Email Address</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="employee@system.com" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Initial Password</label>
                <input required type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="secure_password" />
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

    </div>
  );
};

export default Dashboard;
