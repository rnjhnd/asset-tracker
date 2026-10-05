import React from 'react';
import { Mouse, Laptop, Monitor, Tablet, Smartphone, Server, Network, RefreshCw } from 'lucide-react';
import { AssetActionDropdown } from './AssetActionDropdown';
import type { Asset, User } from '../../types';

type AssetTableProps = {
  assets: Asset[];
  isLoading: boolean;
  user: User | null;
  activeDropdownId: string | null;
  setActiveDropdownId: (id: string | null) => void;
  handleViewHistory: (assetId: string, assetName: string) => void;
  setAssignAssetId: (id: string) => void;
  setIsAssignModalOpen: (val: boolean) => void;
  handleReturnAsset: (assetId: string) => void;
  setEditingAsset: (asset: Asset) => void;
  setIsEditModalOpen: (val: boolean) => void;
  handleUpdateStatus: (assetId: string, status: string) => void;
  setDeleteConfirmInfo: (info: { id: string, type: 'USER' | 'ASSET' } | null) => void;
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

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  isLoading,
  user,
  activeDropdownId,
  setActiveDropdownId,
  handleViewHistory,
  setAssignAssetId,
  setIsAssignModalOpen,
  handleReturnAsset,
  setEditingAsset,
  setIsEditModalOpen,
  handleUpdateStatus,
  setDeleteConfirmInfo,
}) => {
  return (
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
                    {asset.assignments && asset.assignments.length > 0
                      ? asset.assignments[0].user.name || asset.assignments[0].user.employeeId
                      : '--'}
                  </td>
                )}
                {user?.role === 'ADMIN' && (
                  <td className="p-4 text-right">
                    <AssetActionDropdown
                      asset={asset}
                      isOpen={activeDropdownId === asset.id}
                      onToggle={() => setActiveDropdownId(activeDropdownId === asset.id ? null : asset.id)}
                      onClose={() => setActiveDropdownId(null)}
                      onViewHistory={handleViewHistory}
                      onAssign={(id) => {
                        setAssignAssetId(id);
                        setIsAssignModalOpen(true);
                      }}
                      onReturn={handleReturnAsset}
                      onEdit={(a) => {
                        setEditingAsset(a);
                        setIsEditModalOpen(true);
                      }}
                      onUpdateStatus={handleUpdateStatus}
                      onDelete={(id) => setDeleteConfirmInfo({ id, type: 'ASSET' })}
                    />
                  </td>
                )}
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={user?.role === 'ADMIN' ? 7 : 5} className="p-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-900">
                    <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
                    <p className="font-mono text-sm uppercase tracking-widest font-bold">Loading Data...</p>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && assets.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'ADMIN' ? 7 : 5} className="p-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-900">
                    <p className="font-mono text-sm uppercase tracking-widest font-bold">No assets found</p>
                    <p className="font-mono text-xs text-gray-400 mt-2">Adjust your search or filter parameters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
