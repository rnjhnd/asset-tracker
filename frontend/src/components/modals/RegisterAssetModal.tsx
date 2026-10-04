import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SelectDropdown } from '../SelectDropdown';
import { DatePicker } from '../DatePicker';
import API_URL from '../../config/api';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  categories: { id: string; name: string }[];
  onAssetCreated: () => void;
  onCategoryCreated: (category: { id: string; name: string }) => void;
}

export const RegisterAssetModal: React.FC<RegisterAssetModalProps> = ({
  isOpen,
  onClose,
  token,
  categories,
  onAssetCreated,
  onCategoryCreated,
}) => {
  const [newAsset, setNewAsset] = useState({
    name: '',
    serialNumber: '',
    category: categories.length > 0 ? categories[0].name : '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setNewAsset({
      name: '',
      serialNumber: '',
      category: categories.length > 0 ? categories[0].name : '',
      purchaseDate: new Date().toISOString().split('T')[0],
    });
    setIsCreatingCategory(false);
    setNewCategoryName('');
    onClose();
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
    if (raw !== sanitized) {
      toast('Only letters and spaces allowed', { icon: '⚠️', id: 'category-val-err' });
    }
    setNewCategoryName(sanitized.toUpperCase());
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/categories`,
        { name: newCategoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCategoryCreated(res.data);
      setNewAsset((prev) => ({ ...prev, category: res.data.name }));
      setNewCategoryName('');
      setIsCreatingCategory(false);
      toast.success('Category created!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/assets`, newAsset, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleClose();
      onAssetCreated();
      toast.success('Hardware registered successfully!');
    } catch (error) {
      toast.error('Failed to create asset. Check serial number.');
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
          Register Hardware
        </h3>

        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase mb-1 font-bold">
              Hardware Name
            </label>
            <input
              required
              type="text"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
              placeholder="e.g. MacBook Pro M2"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase mb-1 font-bold">
              Serial Number
            </label>
            <input
              required
              type="text"
              value={newAsset.serialNumber}
              onChange={(e) =>
                setNewAsset({ ...newAsset, serialNumber: e.target.value.toUpperCase() })
              }
              className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors uppercase"
              placeholder="e.g. C02H123456"
            />
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block font-mono text-xs uppercase mb-1 font-bold">
                Category
              </label>
              {!isCreatingCategory ? (
                <SelectDropdown
                  value={newAsset.category}
                  onChange={(val) => setNewAsset({ ...newAsset, category: val })}
                  options={
                    categories.length > 0
                      ? categories.map((c) => ({ value: c.name, label: c.name }))
                      : [{ value: '', label: 'No categories available' }]
                  }
                  className="w-full"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={handleCategoryNameChange}
                    className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors uppercase"
                    placeholder="e.g. LAPTOP"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isSubmitting}
                    className="bg-gray-900 text-white px-4 font-mono font-bold hover:bg-black disabled:opacity-50 transition-colors uppercase text-sm"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
            {!isCreatingCategory && (
              <button
                type="button"
                onClick={() => setIsCreatingCategory(true)}
                className="px-4 py-3 border-2 border-[#e4e4e7] text-gray-500 hover:text-black hover:border-gray-900 font-bold transition-colors whitespace-nowrap"
              >
                + New
              </button>
            )}
            {isCreatingCategory && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-3 text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase mb-1 font-bold">
              Purchase Date
            </label>
            <DatePicker
              value={newAsset.purchaseDate}
              onChange={(val) => setNewAsset({ ...newAsset, purchaseDate: val })}
              className="w-full"
            />
          </div>

          <button
            disabled={isSubmitting || categories.length === 0}
            type="submit"
            className={`w-full bg-gray-900 text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-black transition-colors ${
              isSubmitting || categories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'PROCESSING...' : 'Register Asset'}
          </button>
          {categories.length === 0 && (
            <p className="text-red-500 font-mono text-[10px] uppercase text-center mt-2 font-bold tracking-widest">
              Create a category first
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
