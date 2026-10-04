import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DatePicker } from '../DatePicker';
import { ModalShell } from './ModalShell';
import API_URL from '../../config/api';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  asset: {
    id: string;
    name: string;
    serialNumber: string;
    category: string;
    purchaseDate?: string;
  } | null;
  onAssetUpdated: () => void;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  token,
  asset,
  onAssetUpdated,
}) => {
  const [form, setForm] = useState({
    name: '',
    serialNumber: '',
    category: '',
    purchaseDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (asset) {
      setForm({
        name: asset.name,
        serialNumber: asset.serialNumber,
        category: asset.category,
        purchaseDate: asset.purchaseDate
          ? new Date(asset.purchaseDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axios.put(
        `${API_URL}/api/assets/${asset.id}`,
        {
          name: form.name,
          serialNumber: form.serialNumber,
          purchaseDate: form.purchaseDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onClose();
      onAssetUpdated();
      toast.success('Asset updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Edit Hardware">
      <form onSubmit={handleUpdateAsset} className="space-y-4">
        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">
            Hardware Name
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">
            Serial Number
          </label>
          <input
            required
            type="text"
            value={form.serialNumber}
            onChange={(e) =>
              setForm({ ...form, serialNumber: e.target.value.toUpperCase() })
            }
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors uppercase"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">
            Category
          </label>
          <input
            disabled
            type="text"
            value={form.category}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm bg-gray-100 cursor-not-allowed text-gray-500"
            title="Category cannot be changed after creation."
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">
            Purchase Date
          </label>
          <DatePicker
            value={form.purchaseDate}
            onChange={(val) => setForm({ ...form, purchaseDate: val })}
            className="w-full"
          />
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
          className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'PROCESSING...' : 'Save Changes'}
        </button>
      </form>
    </ModalShell>
  );
};
