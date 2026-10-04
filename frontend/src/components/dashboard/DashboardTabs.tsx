import React from 'react';
import { Box, Users } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: 'ASSETS' | 'USERS';
  onTabChange: (tab: 'ASSETS' | 'USERS') => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const getTabClass = (isActive: boolean) =>
    `flex items-center justify-center sm:justify-start gap-2 font-mono text-sm uppercase tracking-wider font-bold transition-colors w-full sm:w-auto px-6 py-3 border-2 ${
      isActive
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-500 border-[#e4e4e7] hover:border-gray-400 hover:text-black'
    }`;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
      <button
        onClick={() => onTabChange('ASSETS')}
        className={getTabClass(activeTab === 'ASSETS')}
      >
        <Box size={16} /> Hardware
      </button>
      <button
        onClick={() => onTabChange('USERS')}
        className={getTabClass(activeTab === 'USERS')}
      >
        <Users size={16} /> Employees
      </button>
    </div>
  );
};
