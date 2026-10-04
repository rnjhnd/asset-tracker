import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Download, Upload, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { SelectDropdown } from '../../components/SelectDropdown';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AssetTable } from './AssetTable';
import { AssetModals } from '../modals/AssetModals';
import { DeleteModal } from '../modals/DeleteModal';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';

export const AssetsView = ({ user, token }: { user: any, token: string }) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    total: 0, available: 0, assigned: 0, maintenance: 0, retired: 0,
    categoryStats: [] as any[], agingStats: [] as any[], timelineStats: [] as any[]
  });
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [assetFilterCategory, setAssetFilterCategory] = useState('ALL');
  const [assetSortBy, setAssetSortBy] = useState('purchaseDate');
  const [assetSortOrder, setAssetSortOrder] = useState('desc');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ id: string, type: 'USER' | 'ASSET' } | null>(null);
  const [newAsset, setNewAsset] = useState({ name: '', serialNumber: '', category: '', purchaseDate: new Date().toISOString().split('T')[0] });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingAsset, setEditingAsset] = useState({ id: '', name: '', serialNumber: '', purchaseDate: '', category: '' });
  const [assignAssetId, setAssignAssetId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignSearchResults, setAssignSearchResults] = useState<any[]>([]);
  const [isSearchingAssign, setIsSearchingAssign] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, showAbove: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [activeHistoryAssetName, setActiveHistoryAssetName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstMountAssetSearch = useRef(true);

  const closeAllModals = () => {
    setIsAddModalOpen(false);
    setIsAssignModalOpen(false);
    setIsEditModalOpen(false);
    setIsHistoryModalOpen(false);
    setNewAsset({ name: '', serialNumber: '', category: categories.length > 0 ? categories[0].name : '', purchaseDate: new Date().toISOString().split('T')[0] });
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setEditingAsset({ id: '', name: '', serialNumber: '', purchaseDate: '', category: '' });
    setAssignAssetId('');
    setAssignUserId('');
    setAssignSearchQuery('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setAssetFilterCategory('ALL');
    setAssetSortBy('purchaseDate');
    setAssetSortOrder('desc');
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assets?page=${currentPage}&limit=15&search=${searchQuery}&status=${filterStatus}&category=${assetFilterCategory}&sortBy=${assetSortBy}&sortOrder=${assetSortOrder}`, {
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

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchAssets(),
        user?.role === 'ADMIN' ? fetchTotals() : Promise.resolve(),
        fetchCategories()
      ]);
      setIsLoading(false);
    };
    loadAll();
  }, [currentPage, filterStatus, assetFilterCategory, assetSortBy, assetSortOrder]);

  useEffect(() => {
    if (isFirstMountAssetSearch.current) {
      isFirstMountAssetSearch.current = false;
      return;
    }
    setCurrentPage(1);
    const delayDebounceFn = setTimeout(() => {
      fetchAssets();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  const executeDelete = async () => {
    if (!deleteConfirmInfo) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`${API_URL}/api/assets/${deleteConfirmInfo.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAssets(prev => prev.filter(a => a.id !== deleteConfirmInfo.id));
      toast.success('Asset permanently deleted!');
      fetchAssets();
      fetchTotals();
      setDeleteConfirmInfo(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete asset.');
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
      fetchAssets();
      fetchTotals();
      toast.success('Asset assigned successfully!');
    } catch (error) {
      toast.error('Failed to assign asset');
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
      toast.success('Asset returned successfully!');
    } catch (error) {
      toast.error('Failed to return asset.');
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    try {
      await axios.put(`${API_URL}/api/assets/${assetId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssets();
      fetchTotals();
      toast.success(`ASSET MARKED AS ${status}`);
    } catch (error) {
      toast.error('Failed to update asset status.');
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

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
    if (raw !== sanitized) toast('Only letters and spaces allowed', { icon: '⚠️', id: 'category-val-err' });
    setNewCategoryName(sanitized.toUpperCase());
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assets?limit=100000&search=${searchQuery}&status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataToExport: any[] = response.data.data;
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
        await axios.post(`${API_URL}/api/assets/bulk`, parsedAssets, { headers: { Authorization: `Bearer ${token}` } });
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

  return (
    <div className="animate-in fade-in duration-300">
      {user?.role === 'ADMIN' && (
        <AnalyticsCharts stats={stats} isLoading={isLoading} chartColors={['#3b82f6', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#ea580c', '#0d9488']} />
      )}
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
                <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto bg-white border-2 border-[#e4e4e7] text-gray-600 px-4 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors flex items-center justify-center gap-2">
                  <Upload size={16} /> Import
                </button>
                <button onClick={handleExportCSV} className="w-full sm:w-auto bg-white border-2 border-[#e4e4e7] text-gray-600 px-4 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors flex items-center justify-center gap-2">
                  <Download size={16} /> Export
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto bg-gray-900 text-white px-6 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors whitespace-nowrap flex justify-center items-center">
                  + Register Asset
                </button>
              </div>
            </div>
          )}
        </div>
        {user?.role === 'ADMIN' && showFilters && (
          <div className="bg-gray-50 border-2 border-gray-900 p-4 shadow-[4px_4px_0_0_#111827] flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end mt-2 animate-in slide-in-from-top-2">
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs font-bold uppercase mb-1">Status</label>
              <SelectDropdown value={filterStatus} onChange={(val: any) => { setFilterStatus(val); setCurrentPage(1); }} options={[{ value: 'ALL', label: 'All Statuses' }, { value: 'AVAILABLE', label: 'Available' }, { value: 'ASSIGNED', label: 'Assigned' }, { value: 'MAINTENANCE', label: 'Maintenance' }, { value: 'RETIRED', label: 'Retired' }]} className="w-full" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs font-bold uppercase mb-1">Category</label>
              <SelectDropdown value={assetFilterCategory} onChange={(val: any) => { setAssetFilterCategory(val); setCurrentPage(1); }} options={[{ value: 'ALL', label: 'All Categories' }, ...categories.map(c => ({ value: c.name, label: c.name }))]} className="w-full" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs font-bold uppercase mb-1">Sort By</label>
              <SelectDropdown value={assetSortBy} onChange={(val: any) => { setAssetSortBy(val); setCurrentPage(1); }} options={[{ value: 'purchaseDate', label: 'Purchase Date' }, { value: 'name', label: 'Name' }, { value: 'serialNumber', label: 'Serial Number' }, { value: 'category', label: 'Category' }, { value: 'status', label: 'Status' }, { value: 'employee', label: 'Assigned Employee' }]} className="w-full" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs font-bold uppercase mb-1">Order</label>
              <SelectDropdown value={assetSortOrder} onChange={(val: any) => { setAssetSortOrder(val); setCurrentPage(1); }} options={[{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }]} className="w-full" />
            </div>
            <button onClick={handleResetFilters} className="w-full sm:w-auto flex-none px-4 py-2 border-2 border-red-500 text-red-500 font-mono text-sm uppercase tracking-wider font-bold hover:bg-red-50 transition-colors">Reset</button>
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mb-12">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="bg-white border-2 border-[#e4e4e7] p-2 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-mono text-sm font-bold">PAGE {currentPage} OF {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="bg-white border-2 border-[#e4e4e7] p-2 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <AssetModals 
        isAddModalOpen={isAddModalOpen} newAsset={newAsset} setNewAsset={setNewAsset} categories={categories}
        isCreatingCategory={isCreatingCategory} setIsCreatingCategory={setIsCreatingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleCategoryNameChange={handleCategoryNameChange}
        handleCreateCategory={handleCreateCategory} handleCreateAsset={handleCreateAsset} isSubmitting={isSubmitting} isAssignModalOpen={isAssignModalOpen}
        assignUserId={assignUserId} setAssignUserId={setAssignUserId} assignSearchQuery={assignSearchQuery} setAssignSearchQuery={setAssignSearchQuery}
        isSearchingAssign={isSearchingAssign} assignSearchResults={assignSearchResults} showAssignDropdown={showAssignDropdown} setShowAssignDropdown={setShowAssignDropdown}
        handleAssignAsset={handleAssignAsset} isEditModalOpen={isEditModalOpen} editingAsset={editingAsset} setEditingAsset={setEditingAsset}
        handleUpdateAsset={handleUpdateAsset} isHistoryModalOpen={isHistoryModalOpen} historyLogs={historyLogs} activeHistoryAssetName={activeHistoryAssetName} closeAllModals={closeAllModals}
      />

      {deleteConfirmInfo?.type === 'ASSET' && (
        <DeleteModal deleteConfirmInfo={deleteConfirmInfo} setDeleteConfirmInfo={setDeleteConfirmInfo} executeDelete={executeDelete} isSubmitting={isSubmitting} />
      )}
    </div>
  );
};
