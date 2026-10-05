import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ModalShell, SelectDropdown, DatePicker } from '../common';
import { assetApi } from '../../api';
import type { AssetCategory } from '../../types';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AssetCategory[];
  onAssetCreated: () => void;
  onCategoryCreated: (category: AssetCategory) => void;
}

export const RegisterAssetModal: React.FC<RegisterAssetModalProps> = ({
  isOpen,
  onClose,
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
    const rawVal = e.target.value;
    const sanitizedVal = rawVal.replace(/[^A-Za-z0-9\s]/g, '');
    if (rawVal !== sanitizedVal) {
      toast('Category can only contain letters, numbers, and spaces', {
        icon: '⚠️',
        id: 'cat-special-char-warning',
      });
    }
    setNewCategoryName(sanitizedVal.toUpperCase());
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return toast.error('Category name is required.');
    try {
      const created = await assetApi.createCategory(newCategoryName.trim());
      onCategoryCreated(created);
      setNewAsset((prev) => ({ ...prev, category: created.name }));
      setIsCreatingCategory(false);
      setNewCategoryName('');
      toast.success('Category created!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create category.');
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newAsset.name.trim()) return toast.error('Hardware name is required');
    if (!newAsset.serialNumber.trim()) return toast.error('Serial number is required');
    if (!newAsset.category) return toast.error('Please select or create a category');

    setIsSubmitting(true);
    try {
      await assetApi.createAsset(newAsset);
      handleClose();
      onAssetCreated();
      toast.success('Hardware registered successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create asset. Check serial number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Register Hardware">
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
            onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
            placeholder="e.g. C02G1234MD6R"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block font-mono text-xs uppercase font-bold">Category</label>
            <button
              type="button"
              onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              className="text-xs font-mono uppercase text-blue-600 hover:text-blue-800 font-bold underline"
            >
              {isCreatingCategory ? 'Cancel' : '+ New Category'}
            </button>
          </div>

          {isCreatingCategory ? (
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={handleCategoryNameChange}
                placeholder="CATEGORY NAME"
                className="flex-1 border-2 border-gray-300 p-2 font-mono text-sm focus:border-black outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="bg-black text-white px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
              >
                Add
              </button>
            </div>
          ) : (
            <SelectDropdown
              value={newAsset.category}
              onChange={(val) => setNewAsset({ ...newAsset, category: val })}
              options={categories.map((c) => ({ value: c.name, label: c.name }))}
              className="w-full"
            />
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
          className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${
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
    </ModalShell>
  );
};
