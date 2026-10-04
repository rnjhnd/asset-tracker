import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Clock, CheckCircle, RefreshCw, Edit2, Wrench, Archive, Trash2 } from 'lucide-react';

interface AssetActionDropdownProps {
  asset: any;
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onClose: () => void;
  onViewHistory: (assetId: string, assetName: string) => void;
  onAssign: (assetId: string) => void;
  onReturn: (assetId: string) => void;
  onEdit: (asset: any) => void;
  onUpdateStatus: (assetId: string, status: string) => void;
  onDelete: (assetId: string) => void;
}

export const AssetActionDropdown: React.FC<AssetActionDropdownProps> = ({
  asset,
  isOpen,
  onToggle,
  onClose,
  onViewHistory,
  onAssign,
  onReturn,
  onEdit,
  onUpdateStatus,
  onDelete,
}) => {
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, showAbove: false });

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const showAbove = window.innerHeight - rect.bottom < 260;

    setDropdownPos({
      top: showAbove ? rect.top + window.scrollY : rect.bottom + window.scrollY,
      left: rect.right + window.scrollX - 192,
      showAbove,
    });

    onToggle(e);
  };

  return (
    <div className="relative inline-block text-left action-dropdown-container">
      <button
        onClick={handleButtonClick}
        aria-label="Asset Actions"
        className="inline-flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-900 shadow-[2px_2px_0_0_#111827] hover:bg-gray-50 hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_0_#111827] transition-all"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen &&
        createPortal(
          <div
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              transform: dropdownPos.showAbove ? 'translateY(-100%)' : 'none',
              marginTop: dropdownPos.showAbove ? '-8px' : '8px',
            }}
            className="absolute z-[9999] w-48 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] flex flex-col p-1 text-left action-dropdown-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onViewHistory(asset.id, asset.name);
                onClose();
              }}
              className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <Clock size={14} /> Audit Log
            </button>

            {asset.status === 'AVAILABLE' && (
              <button
                onClick={() => {
                  onAssign(asset.id);
                  onClose();
                }}
                className="px-3 py-2 text-sm font-mono text-[#3b82f6] hover:bg-blue-50 flex items-center gap-3 font-bold uppercase transition-colors"
              >
                <CheckCircle size={14} /> Assign
              </button>
            )}

            {asset.status === 'ASSIGNED' && (
              <button
                onClick={() => {
                  onReturn(asset.id);
                  onClose();
                }}
                className="px-3 py-2 text-sm font-mono text-orange-600 hover:bg-orange-50 flex items-center gap-3 font-bold uppercase transition-colors"
              >
                <RefreshCw size={14} /> Return
              </button>
            )}

            <div className="h-px bg-gray-200 my-1 mx-2"></div>

            <button
              onClick={() => {
                onEdit(asset);
                onClose();
              }}
              className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <Edit2 size={14} /> Edit Asset
            </button>

            {asset.status !== 'AVAILABLE' && (
              <button
                onClick={() => {
                  onUpdateStatus(asset.id, 'AVAILABLE');
                  onClose();
                }}
                className="px-3 py-2 text-sm font-mono text-green-600 hover:bg-green-50 flex items-center gap-3 transition-colors"
              >
                <CheckCircle size={14} /> Make Available
              </button>
            )}

            {asset.status !== 'MAINTENANCE' && asset.status !== 'RETIRED' && (
              <button
                onClick={() => {
                  onUpdateStatus(asset.id, 'MAINTENANCE');
                  onClose();
                }}
                className="px-3 py-2 text-sm font-mono text-yellow-600 hover:bg-yellow-50 flex items-center gap-3 transition-colors"
              >
                <Wrench size={14} /> Maintenance
              </button>
            )}

            {asset.status !== 'RETIRED' && (
              <button
                onClick={() => {
                  onUpdateStatus(asset.id, 'RETIRED');
                  onClose();
                }}
                className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <Archive size={14} /> Retire
              </button>
            )}

            <div className="h-px bg-gray-200 my-1 mx-2"></div>

            <button
              onClick={() => {
                onDelete(asset.id);
                onClose();
              }}
              className="px-3 py-2 text-sm font-mono text-red-800 hover:bg-red-100 flex items-center gap-3 transition-colors font-bold"
            >
              <Trash2 size={14} /> Hard Delete
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};
