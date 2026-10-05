import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ModalShell } from '../common';
import { userApi } from '../../api';
import type { UserToEdit } from '../../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserToEdit | null;
  onUserUpdated: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        department: user.department || '',
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await userApi.updateUser(user.id, {
        ...user,
        name: formData.name,
        department: formData.department,
      });
      toast.success('Employee updated successfully!');
      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Edit Employee">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">Full Name</label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => {
              const rawVal = e.target.value;
              if (/[^A-Za-z\s]/.test(rawVal)) {
                toast('Only letters and spaces are allowed for Full Name', {
                  icon: '⚠️',
                  id: 'edit-name-val-err',
                });
              }
              setFormData((prev) => ({
                ...prev,
                name: rawVal.replace(/[^A-Za-z\s]/g, ''),
              }));
            }}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">Employee ID</label>
          <input
            disabled
            required
            type="text"
            value={user.employeeId}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors bg-gray-100 cursor-not-allowed text-gray-500"
            placeholder="EMP-001"
            title="Employee ID cannot be changed after creation."
          />
        </div>

        {user.role !== 'ADMIN' && (
          <div>
            <label className="block font-mono text-xs uppercase mb-1 font-bold">Department</label>
            <input
              required
              type="text"
              value={formData.department}
              onChange={(e) => {
                const raw = e.target.value;
                const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
                if (raw !== sanitized) {
                  toast('Only letters and spaces allowed', {
                    icon: '🚧',
                    id: 'edit-dept-val-err',
                  });
                }
                setFormData((prev) => ({
                  ...prev,
                  department: sanitized.toUpperCase(),
                }));
              }}
              className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
              placeholder="e.g. ENGINEERING"
            />
          </div>
        )}

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
