import React from 'react';
import { createPortal } from 'react-dom';
import { Mouse, Laptop, Monitor, Tablet, Smartphone, Server, Network, MoreHorizontal, Clock, CheckCircle, RefreshCw, Edit2, Wrench, Archive, Trash2, Box } from 'lucide-react';

type AssetTableProps = {
  assets: any[];
  isLoading: boolean;
  user: any;
  activeDropdownId: string | null;
  setActiveDropdownId: (id: string | null) => void;
  dropdownPos: { top: number; left: number; showAbove: boolean };
  setDropdownPos: (pos: { top: number; left: number; showAbove: boolean }) => void;
  handleViewHistory: (assetId: string, assetName: string) => void;
  setAssignAssetId: (id: string) => void;
  setIsAssignModalOpen: (val: boolean) => void;
  handleReturnAsset: (assetId: string) => void;
  setEditingAsset: (asset: any) => void;
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
  assets, isLoading, user, activeDropdownId, setActiveDropdownId, dropdownPos, setDropdownPos,
  handleViewHistory, setAssignAssetId, setIsAssignModalOpen, handleReturnAsset, setEditingAsset,
  setIsEditModalOpen, handleUpdateStatus, setDeleteConfirmInfo
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
                    {asset.assignments.length > 0 ? (asset.assignments[0].user.name || asset.assignments[0].user.employeeId) : '--'}
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
                          
                          <button onClick={() => { setEditingAsset({ id: asset.id, name: asset.name, serialNumber: asset.serialNumber, category: asset.category, purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '' }); setIsEditModalOpen(true); setActiveDropdownId(null); }} className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"><Edit2 size={14}/> Edit Asset</button>
                          
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
  );
};
