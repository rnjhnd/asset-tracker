import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Box, Users, Key } from 'lucide-react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AssetsView } from '../components/dashboard/AssetsView';
import { UsersView } from '../components/dashboard/UsersView';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_URL from '../config/api';

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState<'ASSETS' | 'USERS'>('ASSETS');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('LOGGED OUT SUCCESSFULLY', { id: 'logout-toast' });
    navigate('/login');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.put(`${API_URL}/api/auth/password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      toast.success('Password changed securely.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-gray-900 font-sans">
      <DashboardHeader 
        user={user!}
        isProfileDropdownOpen={isProfileDropdownOpen}
        setIsProfileDropdownOpen={setIsProfileDropdownOpen}
        setIsPasswordModalOpen={setIsPasswordModalOpen}
        handleLogout={handleLogout}
      />

      <main className="p-4 sm:p-8 max-w-7xl mx-auto overflow-x-hidden">
        {user?.role === 'ADMIN' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
            <button 
              onClick={() => setCurrentTab('ASSETS')}
              className={`flex items-center justify-center sm:justify-start gap-2 font-mono text-sm uppercase tracking-wider font-bold transition-colors w-full sm:w-auto px-6 py-3 border-2 ${currentTab === 'ASSETS' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-[#e4e4e7] hover:border-gray-400 hover:text-black'}`}
            >
              <Box size={16} /> Hardware
            </button>
            <button 
              onClick={() => setCurrentTab('USERS')}
              className={`flex items-center justify-center sm:justify-start gap-2 font-mono text-sm uppercase tracking-wider font-bold transition-colors w-full sm:w-auto px-6 py-3 border-2 ${currentTab === 'USERS' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-[#e4e4e7] hover:border-gray-400 hover:text-black'}`}
            >
              <Users size={16} /> Employees
            </button>
          </div>
        )}

        {currentTab === 'ASSETS' && <AssetsView user={user!} token={token as string} />}
        {currentTab === 'USERS' && user?.role === 'ADMIN' && <UsersView user={user!} token={token as string} />}
      </main>

      {/* Password Reset Modal for Current User */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-gray-900 p-8 shadow-[8px_8px_0_0_#111827] w-full max-w-md">
            <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6 flex items-center gap-2">
              <Key size={24} /> Change Password
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-2">Current Password</label>
                <input 
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full border-2 border-[#e4e4e7] p-3 font-mono text-sm focus:border-black outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-2">New Password (Min 8 Chars)</label>
                <input 
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full border-2 border-[#e4e4e7] p-3 font-mono text-sm focus:border-black outline-none"
                  required
                  minLength={8}
                />
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
