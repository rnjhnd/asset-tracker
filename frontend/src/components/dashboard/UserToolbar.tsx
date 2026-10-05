import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { SelectDropdown } from '../common';

interface UserToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  filterRole: string;
  onFilterRoleChange: (role: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  sortOrder: string;
  onSortOrderChange: (order: string) => void;
  onResetFilters: () => void;
  onOpenRegisterModal: () => void;
}

export const UserToolbar: React.FC<UserToolbarProps> = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filterStatus,
  onFilterStatusChange,
  filterRole,
  onFilterRoleChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onResetFilters,
  onOpenRegisterModal,
}) => {
  return (
    <div className="flex flex-col mb-6 gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="bg-gray-900 px-4 sm:px-6 py-2 shadow-[4px_4px_0_0_#d4d4d8]">
          <h2 className="text-xl sm:text-3xl font-bold uppercase tracking-tight text-white">
            Employee Directory
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Employee ID..."
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

          <button
            onClick={onOpenRegisterModal}
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
              value={filterStatus}
              onChange={onFilterStatusChange}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DEACTIVATED', label: 'Deactivated' },
              ]}
              className="w-full"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block font-mono text-xs font-bold uppercase mb-1">Role</label>
            <SelectDropdown
              value={filterRole}
              onChange={onFilterRoleChange}
              options={[
                { value: 'ALL', label: 'All Roles' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'EMPLOYEE', label: 'Employee' },
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
                { value: 'createdAt', label: 'Date Added' },
                { value: 'name', label: 'Name' },
                { value: 'employeeId', label: 'Employee ID' },
                { value: 'role', label: 'Role' },
                { value: 'department', label: 'Department' },
                { value: 'isActive', label: 'Status' },
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
