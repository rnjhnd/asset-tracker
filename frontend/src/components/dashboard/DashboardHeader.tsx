import React from 'react';
import { Server, ChevronDown, User, Key, LogOut } from 'lucide-react';

type DashboardHeaderProps = {
  user: any;
  isProfileDropdownOpen: boolean;
  setIsProfileDropdownOpen: (val: boolean) => void;
  setIsPasswordModalOpen: (val: boolean) => void;
  handleLogout: () => void;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
  setIsPasswordModalOpen,
  handleLogout
}) => {
  return (
    <header className="bg-white border-b-4 border-gray-900 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-40 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#3b82f6] text-white flex items-center justify-center font-mono shrink-0 shadow-[4px_4px_0_0_#1e3a8a]">
          <Server size={24} />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tighter text-gray-900 leading-none mb-1">INTERNAL ASSET PORTAL</h1>
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest mt-1">
            <span className="flex items-center gap-1.5 text-green-600 font-bold whitespace-nowrap">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              ONLINE
            </span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[250px]" title={user?.employeeId}>{user?.employeeId}</span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="bg-gray-100 px-2 py-0.5 border border-gray-300 whitespace-nowrap">{user?.role}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center w-full sm:w-auto mt-2 sm:mt-0 relative profile-dropdown-container">
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="w-full sm:w-auto flex justify-between sm:justify-center items-center gap-2 bg-white border-2 border-gray-900 text-gray-900 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors shadow-[4px_4px_0_0_#111827] hover:bg-gray-50 hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_0_#111827]"
        >
          <div className="flex items-center gap-2">
            <User size={14} /> Hi, {user?.name?.split(' ')[0] || user?.role}
          </div>
          <ChevronDown size={14} className={`transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isProfileDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-full sm:w-56 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] flex flex-col p-1 text-left z-50">
            <div className="px-3 py-2 border-b border-gray-200 mb-1">
              <p className="font-mono text-[10px] text-gray-500 uppercase font-bold tracking-widest">Signed in as</p>
              <p className="font-mono text-sm truncate text-gray-900 font-bold" title={user?.name}>{user?.name}</p>
              <p className="font-mono text-xs truncate text-gray-500" title={user?.employeeId}>{user?.employeeId}</p>
            </div>
            <button 
              onClick={() => { setIsPasswordModalOpen(true); setIsProfileDropdownOpen(false); }}
              className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <Key size={14} /> Change Password
            </button>
            <button 
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-mono text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors mt-1"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
