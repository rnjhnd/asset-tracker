import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ModalShell, SelectDropdown } from '../common';
import { userApi } from '../../api';

interface RegisterUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export const RegisterUserModal: React.FC<RegisterUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [newUser, setNewUser] = useState({
    name: '',
    employeeId: '',
    password: '',
    department: '',
    role: 'EMPLOYEE',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setNewUser({
      name: '',
      employeeId: '',
      password: '',
      department: '',
      role: 'EMPLOYEE',
    });
    onClose();
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
    if (raw !== sanitized) {
      toast('Only letters and spaces allowed for department', { icon: '⚠️', id: 'dept-val-err' });
    }
    setNewUser((prev) => ({ ...prev, department: sanitized.toUpperCase() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (newUser.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await userApi.registerUser(newUser);
      toast.success('Employee account created!');
      onUserCreated();
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Register Employee">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">Full Name</label>
          <input
            required
            type="text"
            pattern="^[A-Za-z\s]+$"
            title="Only letters and spaces are allowed."
            value={newUser.name}
            onChange={(e) => {
              const rawVal = e.target.value;
              if (/[^A-Za-z\s]/.test(rawVal)) {
                toast('Only letters and spaces are allowed for Full Name', {
                  icon: '⚠️',
                  id: 'name-val-err',
                });
              }
              setNewUser((prev) => ({ ...prev, name: rawVal.replace(/[^A-Za-z\s]/g, '') }));
            }}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">Employee ID</label>
          <input
            required
            type="text"
            value={newUser.employeeId}
            onChange={(e) => setNewUser((prev) => ({ ...prev, employeeId: e.target.value }))}
            className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
            placeholder="EMP-001"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">Initial Password</label>
          <div className="relative mb-2">
            <input
              required
              type="text"
              value={newUser.password}
              onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
              placeholder="e.g. temporary123"
            />
          </div>
          <p className="font-mono text-[10px] text-gray-500">Must be at least 8 characters long.</p>
        </div>

        {newUser.role !== 'ADMIN' && (
          <div>
            <label className="block font-mono text-xs uppercase mb-1 font-bold">Department</label>
            <input
              required
              type="text"
              value={newUser.department}
              onChange={handleDepartmentChange}
              className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors"
              placeholder="e.g. ENGINEERING"
            />
          </div>
        )}

        <div>
          <label className="block font-mono text-xs uppercase mb-1 font-bold">System Role</label>
          <SelectDropdown
            value={newUser.role}
            onChange={(val) => setNewUser((prev) => ({ ...prev, role: val }))}
            options={[
              { value: 'EMPLOYEE', label: 'Standard Employee' },
              { value: 'ADMIN', label: 'System Administrator' },
            ]}
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
          {isSubmitting ? 'PROCESSING...' : 'Create Account'}
        </button>
      </form>
    </ModalShell>
  );
};
