import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ModalShell } from './ModalShell';
import API_URL from '../../config/api';

export interface ForceResetUserTarget {
  id: string;
  employeeId: string;
}

interface ForceResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  user: ForceResetUserTarget | null;
  onPasswordReset: () => void;
}

export const ForceResetPasswordModal: React.FC<ForceResetPasswordModalProps> = ({
  isOpen,
  onClose,
  token,
  user,
  onPasswordReset,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleClose = () => {
    setNewPassword('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(
        `${API_URL}/api/users/${user.id}/force-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`PASSWORD RESET FOR ${user.employeeId}`);
      onPasswordReset();
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to force reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Force Reset Password"
      subtitle={`Target Account: ${user.employeeId}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">
            New Temporary Password
          </label>
          <input
            required
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
            placeholder="e.g. TempPass123!"
          />
          <p className="font-mono text-[10px] text-gray-500 mt-2">
            Must be at least 8 characters long.
          </p>
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
          className={`w-full bg-red-600 text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-red-700 transition-colors ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'PROCESSING...' : 'OVERRIDE PASSWORD'}
        </button>
      </form>
    </ModalShell>
  );
};
