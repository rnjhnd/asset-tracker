import React, { useState, useEffect, useRef } from 'react';
import { AssetToolbar } from './AssetToolbar';
import { Pagination } from '../common';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AssetTable } from './AssetTable';
import { RegisterAssetModal } from '../modals/RegisterAssetModal';
import { AssignAssetModal } from '../modals/AssignAssetModal';
import { EditAssetModal } from '../modals/EditAssetModal';
import { AssetHistoryModal } from '../modals/AssetHistoryModal';
import { DeleteModal } from '../modals/DeleteModal';
import toast from 'react-hot-toast';
import { assetApi } from '../../api';
import type { Asset, AssetCategory, AssetStatus, User } from '../../types';

export const AssetsView = ({ user }: { user: User | null }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    maintenance: 0,
    retired: 0,
    categoryStats: [] as any[],
    agingStats: [] as any[],
    timelineStats: [] as any[],
  });
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [assetFilterCategory, setAssetFilterCategory] = useState('ALL');
  const [assetSortBy, setAssetSortBy] = useState('purchaseDate');
  const [assetSortOrder, setAssetSortOrder] = useState('desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignAssetId, setAssignAssetId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [historyAsset, setHistoryAsset] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ id: string; type: 'USER' | 'ASSET' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const isFirstMountAssetSearch = useRef(true);

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
      const res = await assetApi.getAssets({
        page: currentPage,
        limit: 15,
        search: searchQuery,
        status: filterStatus,
        category: assetFilterCategory,
        sortBy: assetSortBy,
        sortOrder: assetSortOrder,
      });
      setAssets(res.data);
      setTotalPages(res.totalPages);
    } catch (error) {
      console.error('Failed to fetch assets');
    }
  };

  const fetchTotals = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const data = await assetApi.getStats();
      setStats(data as any);
    } catch (error) {
      console.error('Failed to fetch KPI stats');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await assetApi.getCategories();
      setCategories(data);
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
        fetchCategories(),
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

  const executeDelete = async () => {
    if (!deleteConfirmInfo) return;
    setIsDeleting(true);
    try {
      await assetApi.deleteAsset(deleteConfirmInfo.id);
      setAssets((prev) => prev.filter((a) => a.id !== deleteConfirmInfo.id));
      toast.success('Asset permanently deleted!');
      fetchAssets();
      fetchTotals();
      setDeleteConfirmInfo(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete asset.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReturnAsset = async (assetId: string) => {
    try {
      await assetApi.returnAsset(assetId);
      fetchAssets();
      fetchTotals();
      toast.success('Asset returned successfully!');
    } catch (error) {
      toast.error('Failed to return asset.');
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    try {
      await assetApi.updateStatus(assetId, status as AssetStatus);
      fetchAssets();
      fetchTotals();
      toast.success(`ASSET MARKED AS ${status}`);
    } catch (error) {
      toast.error('Failed to update asset status.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await assetApi.getAssets({
        limit: 100000,
        search: searchQuery,
        status: filterStatus,
      });
      const dataToExport: any[] = res.data;
      if (dataToExport.length === 0) return toast.error('No data to export.');
      const headers = ['Asset ID', 'Name', 'Serial Number', 'Category', 'Status', 'Assigned User'];
      const rows = dataToExport.map((asset) => [
        asset.id,
        `"${asset.name}"`,
        asset.serialNumber,
        asset.category,
        asset.status,
        asset.assignments && asset.assignments.length > 0
          ? asset.assignments[0].user.name || asset.assignments[0].user.employeeId
          : 'None',
      ]);
      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
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
        const lines = text.split('\n').filter((line) => line.trim());
        const parsedAssets = lines
          .slice(1)
          .map((line) => {
            const values = line.split(',').map((v) => v.trim());
            return {
              name: values[0],
              serialNumber: values[1],
              category: values[2]?.toUpperCase() || 'UNASSIGNED',
              purchaseDate: values[3] || undefined,
            };
          })
          .filter((a) => a.name && a.serialNumber);

        if (parsedAssets.length === 0) return toast.error('No valid rows found in CSV.');
        await assetApi.bulkImport(parsedAssets);
        toast.success(`Bulk import successful!`);
        fetchAssets();
        fetchTotals();
        fetchCategories();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to bulk import assets.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="animate-in fade-in duration-300">
      {user?.role === 'ADMIN' && (
        <AnalyticsCharts
          stats={stats}
          isLoading={isLoading}
          chartColors={['#3b82f6', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#ea580c', '#0d9488']}
        />
      )}

      {user?.role === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
            <p className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-1">Active Devices</p>
            {isLoading ? (
              <div className="h-10 w-16 bg-gray-200 animate-pulse mt-1"></div>
            ) : (
              <p className="text-4xl font-bold font-mono">{assets.length}</p>
            )}
          </div>
          <div className="bg-white border-2 border-green-600 p-6 shadow-[4px_4px_0_0_#16a34a]">
            <p className="font-mono text-sm text-green-600 uppercase tracking-widest mb-1">Account Status</p>
            {isLoading ? (
              <div className="h-8 w-48 bg-green-200 animate-pulse mt-1"></div>
            ) : (
              <p className="text-2xl font-bold font-mono mt-1">ACTIVE - SECURE</p>
            )}
          </div>
        </div>
      )}

      <AssetToolbar
        userRole={user?.role}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filterStatus={filterStatus}
        onFilterStatusChange={(val) => {
          setFilterStatus(val);
          setCurrentPage(1);
        }}
        filterCategory={assetFilterCategory}
        onFilterCategoryChange={(val) => {
          setAssetFilterCategory(val);
          setCurrentPage(1);
        }}
        categories={categories}
        sortBy={assetSortBy}
        onSortByChange={(val) => {
          setAssetSortBy(val);
          setCurrentPage(1);
        }}
        sortOrder={assetSortOrder}
        onSortOrderChange={(val) => {
          setAssetSortOrder(val);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
        onExportCSV={handleExportCSV}
        onBulkImport={handleBulkImport}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <AssetTable
        assets={assets}
        isLoading={isLoading}
        user={user}
        activeDropdownId={activeDropdownId}
        setActiveDropdownId={setActiveDropdownId}
        handleViewHistory={(id, name) => setHistoryAsset({ id, name })}
        setAssignAssetId={(id) => setAssignAssetId(id)}
        setIsAssignModalOpen={() => {}}
        handleReturnAsset={handleReturnAsset}
        setEditingAsset={(asset) => setEditingAsset(asset)}
        setIsEditModalOpen={() => {}}
        handleUpdateStatus={handleUpdateStatus}
        setDeleteConfirmInfo={setDeleteConfirmInfo}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Individual Modals (Zero Token Prop Drilling) */}
      <RegisterAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onAssetCreated={() => {
          fetchAssets();
          fetchTotals();
        }}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />

      <AssignAssetModal
        isOpen={!!assignAssetId}
        onClose={() => setAssignAssetId(null)}
        assetId={assignAssetId || ''}
        onAssetAssigned={() => {
          fetchAssets();
          fetchTotals();
        }}
      />

      <EditAssetModal
        isOpen={!!editingAsset}
        onClose={() => setEditingAsset(null)}
        asset={editingAsset}
        onAssetUpdated={() => {
          fetchAssets();
          fetchTotals();
        }}
      />

      <AssetHistoryModal
        isOpen={!!historyAsset}
        onClose={() => setHistoryAsset(null)}
        assetId={historyAsset?.id || ''}
        assetName={historyAsset?.name || ''}
      />

      {deleteConfirmInfo?.type === 'ASSET' && (
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
