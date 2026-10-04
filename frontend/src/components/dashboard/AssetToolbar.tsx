import React, { useRef } from 'react';
import { Search, Download, Upload, SlidersHorizontal } from 'lucide-react';
import { SelectDropdown } from '../SelectDropdown';

interface AssetToolbarProps {
  userRole?: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (val: string) => void;
  categories: { id: string; name: string }[];
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: string) => void;
  onResetFilters: () => void;
  onExportCSV: () => void;
  onBulkImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenAddModal: () => void;
}

export const AssetToolbar: React.FC<AssetToolbarProps> = ({
  userRole,
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filterStatus,
  onFilterStatusChange,
  filterCategory,
  onFilterCategoryChange,
  categories,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onResetFilters,
  onExportCSV,
  onBulkImport,
  onOpenAddModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col mb-6 gap-4">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div className="bg-gray-900 px-4 sm:px-6 py-2 shadow-[4px_4px_0_0_#d4d4d8]">
          <h2 className="text-xl sm:text-3xl font-bold uppercase tracking-tight whitespace-nowrap text-white">
            {userRole === 'ADMIN' ? 'Hardware Inventory' : 'My Equipment'}
          </h2>
        </div>

        {userRole === 'ADMIN' && (
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-4 w-full xl:w-auto">
            <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search SN or Name..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-[#e4e4e7] bg-white font-mono text-sm focus:border-[#3b82f6] outline-none"
              />
            </div>

            <button
              onClick={onToggleFilters}
              className={`w-full sm:w-auto border-2 px-4 py-2.5 font-mono text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                showFilters
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white border-[#e4e4e7] text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={onBulkImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto bg-white border-2 border-[#e4e4e7] text-gray-600 px-4 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} /> Import
              </button>

              <button
                onClick={onExportCSV}
                className="w-full sm:w-auto bg-white border-2 border-[#e4e4e7] text-gray-600 px-4 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} /> Export
              </button>

              <button
                onClick={onOpenAddModal}
                className="w-full sm:w-auto bg-gray-900 text-white px-6 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors whitespace-nowrap flex justify-center items-center"
              >
                + Register Asset
              </button>
            </div>
          </div>
        )}
      </div>

      {userRole === 'ADMIN' && showFilters && (
        <div className="bg-gray-50 border-2 border-gray-900 p-4 shadow-[4px_4px_0_0_#111827] flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end mt-2 animate-in slide-in-from-top-2">
          <div className="flex-1 min-w-[150px]">
            <label className="block font-mono text-xs font-bold uppercase mb-1">Status</label>
            <SelectDropdown
              value={filterStatus}
              onChange={onFilterStatusChange}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'RETIRED', label: 'Retired' },
              ]}
              className="w-full"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block font-mono text-xs font-bold uppercase mb-1">Category</label>
            <SelectDropdown
              value={filterCategory}
              onChange={onFilterCategoryChange}
              options={[
                { value: 'ALL', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
              className="w-full"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block font-mono text-xs font-bold uppercase mb-1">Sort By</label>
            <SelectDropdown
              value={sortBy}
              onChange={onSortByChange}
              options={[
                { value: 'purchaseDate', label: 'Purchase Date' },
                { value: 'name', label: 'Name' },
                { value: 'serialNumber', label: 'Serial Number' },
                { value: 'category', label: 'Category' },
                { value: 'status', label: 'Status' },
                { value: 'employee', label: 'Assigned Employee' },
              ]}
              className="w-full"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block font-mono text-xs font-bold uppercase mb-1">Order</label>
            <SelectDropdown
              value={sortOrder}
              onChange={onSortOrderChange}
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
              ]}
              className="w-full"
            />
          </div>

          <button
            onClick={onResetFilters}
            className="w-full sm:w-auto flex-none px-4 py-2 border-2 border-red-500 text-red-500 font-mono text-sm uppercase tracking-wider font-bold hover:bg-red-50 transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
