import React, { useState } from 'react';
import axios from 'axios';
import { Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalShell } from './ModalShell';
import API_URL from '../../config/api';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setPasswordForm({ currentPassword: '', newPassword: '' });
    onClose();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/auth/password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleClose();
      toast.success('Password changed securely.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <Key size={24} /> Change Password
        </span>
      }
    >
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <label className="block font-mono text-xs font-bold uppercase mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
            }
            className="w-full border-2 border-[#e4e4e7] p-3 font-mono text-sm focus:border-black outline-none"
            required
          />
        </div>

        <div>
          <label className="block font-mono text-xs font-bold uppercase mb-2">
            New Password (Min 8 Chars)
          </label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
            }
            className="w-full border-2 border-[#e4e4e7] p-3 font-mono text-sm focus:border-black outline-none"
            required
            minLength={8}
          />
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border-2 border-gray-900 font-mono text-sm uppercase font-bold hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#ca8a04] text-white border-2 border-[#ca8a04] font-mono text-sm uppercase font-bold hover:bg-yellow-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Key'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
