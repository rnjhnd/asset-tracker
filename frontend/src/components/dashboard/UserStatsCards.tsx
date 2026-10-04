import React from 'react';
import { Key } from 'lucide-react';

interface UserStatsCardsProps {
  stats: {
    total: number;
    active: number;
    deactivated: number;
    admins: number;
  };
  isLoading: boolean;
  resetRequestedCount: number;
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  stats,
  isLoading,
  resetRequestedCount,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
          <p className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-1">
            Total Users
          </p>
          {isLoading ? (
            <div className="h-10 w-16 bg-gray-200 animate-pulse mt-1"></div>
          ) : (
            <p className="text-4xl font-bold font-mono">{stats?.total ?? '--'}</p>
          )}
        </div>

        <div className="bg-white border-2 border-green-600 p-6 shadow-[4px_4px_0_0_#16a34a]">
          <p className="font-mono text-sm text-green-600 uppercase tracking-widest mb-1">
            Active Accounts
          </p>
          {isLoading ? (
            <div className="h-10 w-16 bg-green-100 animate-pulse mt-1"></div>
          ) : (
            <p className="text-4xl font-bold font-mono">{stats?.active ?? '--'}</p>
          )}
        </div>

        <div className="bg-white border-2 border-red-600 p-6 shadow-[4px_4px_0_0_#dc2626]">
          <p className="font-mono text-sm text-red-600 uppercase tracking-widest mb-1">
            Deactivated
          </p>
          {isLoading ? (
            <div className="h-10 w-16 bg-red-100 animate-pulse mt-1"></div>
          ) : (
            <p className="text-4xl font-bold font-mono">{stats?.deactivated ?? '--'}</p>
          )}
        </div>

        <div className="bg-white border-2 border-purple-600 p-6 shadow-[4px_4px_0_0_#9333ea]">
          <p className="font-mono text-sm text-purple-600 uppercase tracking-widest mb-1">
            System Admins
          </p>
          {isLoading ? (
            <div className="h-10 w-16 bg-purple-100 animate-pulse mt-1"></div>
          ) : (
            <p className="text-4xl font-bold font-mono">{stats?.admins ?? '--'}</p>
          )}
        </div>
      </div>

      {resetRequestedCount > 0 && (
        <div className="bg-red-50 border-2 border-red-600 p-4 mb-6 shadow-[4px_4px_0_0_#dc2626] flex items-center gap-3 animate-in fade-in zoom-in">
          <div className="bg-red-600 text-white p-2 shrink-0">
            <Key size={20} />
          </div>
          <div>
            <h3 className="font-bold text-red-700 uppercase tracking-tight text-lg leading-none mb-1">
              Password Resets Requested
            </h3>
            <p className="font-mono text-xs text-red-600 uppercase font-bold">
              {resetRequestedCount} employee(s) have requested a password reset. Use the key icon to force reset their passwords.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
