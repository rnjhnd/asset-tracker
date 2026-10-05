import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ModalShell } from '../common';
import { assetApi, userApi } from '../../api';
import type { User } from '../../types';

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  onAssetAssigned: () => void;
}

export const AssignAssetModal: React.FC<AssignAssetModalProps> = ({
  isOpen,
  onClose,
  assetId,
  onAssetAssigned,
}) => {
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignSearchResults, setAssignSearchResults] = useState<User[]>([]);
  const [isSearchingAssign, setIsSearchingAssign] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAssignSearchQuery('');
      setAssignSearchResults([]);
      setAssignUserId('');
      setShowAssignDropdown(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!assignSearchQuery) {
      setAssignSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingAssign(true);
      try {
        const res = await userApi.getUsers({
          search: assignSearchQuery,
          limit: 20,
          status: 'ACTIVE',
        });
        setAssignSearchResults(res.data.filter((u) => u.role !== 'ADMIN'));
      } catch (err) {
        console.error('Failed to search employees', err);
      } finally {
        setIsSearchingAssign(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [assignSearchQuery]);

  const handleClose = () => {
    setAssignSearchQuery('');
    setAssignSearchResults([]);
    setAssignUserId('');
    setShowAssignDropdown(false);
    onClose();
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!assignUserId) {
      toast.error('Please select a valid employee from the list');
      return;
    }

    setIsSubmitting(true);
    try {
      await assetApi.assignAsset(assetId, assignUserId);
      handleClose();
      onAssetAssigned();
      toast.success('Asset assigned successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Assign Hardware">
      <form onSubmit={handleAssignAsset} className="space-y-6">
        <div className="relative">
          <label className="block font-mono text-xs uppercase mb-2 font-bold">
            Search Employee
          </label>
          <input
            type="text"
            placeholder="Enter name or ID..."
            value={assignSearchQuery}
            onChange={(e) => {
              setAssignSearchQuery(e.target.value);
              setShowAssignDropdown(true);
              setAssignUserId('');
            }}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
          />

          {showAssignDropdown && assignSearchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] z-50 max-h-60 overflow-y-auto">
              {isSearchingAssign ? (
                <div className="p-4 font-mono text-xs text-gray-500 text-center uppercase">
                  Searching...
                </div>
              ) : assignSearchResults.length > 0 ? (
                assignSearchResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setAssignUserId(u.id);
                      setAssignSearchQuery(`${u.name} (${u.employeeId})`);
                      setShowAssignDropdown(false);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-100 outline-none flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                      <p className="font-mono text-xs text-gray-500 mt-0.5">{u.employeeId}</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1">
                      {u.department}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 font-mono text-xs text-gray-500 text-center uppercase">
                  No active employees found
                </div>
              )}
            </div>
          )}
        </div>

        <button
          disabled={isSubmitting || !assignUserId}
          type="submit"
          className={`w-full bg-blue-600 text-white font-mono uppercase font-bold py-4 hover:bg-blue-700 transition-colors ${
            isSubmitting || !assignUserId ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'PROCESSING...' : 'Confirm Assignment'}
        </button>
      </form>
    </ModalShell>
  );
};
