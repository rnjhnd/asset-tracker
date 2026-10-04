import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardTabs } from '../components/dashboard/DashboardTabs';
import { AssetsView } from '../components/dashboard/AssetsView';
import { UsersView } from '../components/dashboard/UsersView';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState<'ASSETS' | 'USERS'>('ASSETS');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-transparent text-gray-900 font-sans">
      <DashboardHeader />

      <main className="p-4 sm:p-8 max-w-7xl mx-auto overflow-x-hidden">
        {user?.role === 'ADMIN' && (
          <DashboardTabs 
            activeTab={currentTab} 
            onTabChange={setCurrentTab} 
          />
        )}

        {currentTab === 'ASSETS' && <AssetsView user={user!} token={token as string} />}
        {currentTab === 'USERS' && user?.role === 'ADMIN' && <UsersView user={user!} token={token as string} />}
      </main>
    </div>
  );
};

export default Dashboard;
