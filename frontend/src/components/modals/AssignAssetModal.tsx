import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import API_URL from '../../config/api';

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  assetId: string;
  onAssetAssigned: () => void;
}

export const AssignAssetModal: React.FC<AssignAssetModalProps> = ({
  isOpen,
  onClose,
  token,
  assetId,
  onAssetAssigned,
}) => {
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignSearchResults, setAssignSearchResults] = useState<any[]>([]);
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
      return;
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
        const res = await axios.get(
          `${API_URL}/api/users?search=${assignSearchQuery}&limit=20&status=ACTIVE`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAssignSearchResults(res.data.data.filter((u: any) => u.role !== 'ADMIN'));
      } catch (err) {
        console.error('Failed to search employees', err);
      } finally {
        setIsSearchingAssign(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [assignSearchQuery, token]);

  if (!isOpen) return null;

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
      await axios.post(
        `${API_URL}/api/assets/${assetId}/assign`,
        { userId: assignUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
        >
          <X size={24} />
        </button>
        <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">
          Assign Hardware
        </h3>

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
      </div>
    </div>
  );
};
