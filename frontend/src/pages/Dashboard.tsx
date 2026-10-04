import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Users } from 'lucide-react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AssetsView } from '../components/dashboard/AssetsView';
import { UsersView } from '../components/dashboard/UsersView';
import { PasswordModal } from '../components/modals/PasswordModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState<'ASSETS' | 'USERS'>('ASSETS');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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

      <PasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        token={token as string}
      />
    </div>
  );
};

export default Dashboard;
