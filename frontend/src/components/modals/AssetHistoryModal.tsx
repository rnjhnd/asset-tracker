import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalShell } from './ModalShell';
import API_URL from '../../config/api';

interface AssetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  assetId: string;
  assetName: string;
}

export const AssetHistoryModal: React.FC<AssetHistoryModalProps> = ({
  isOpen,
  onClose,
  token,
  assetId,
  assetName,
}) => {
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !assetId) {
      setHistoryLogs([]);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/assets/${assetId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistoryLogs(response.data);
      } catch (error) {
        toast.error('Failed to load asset history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, assetId, token]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Log"
      subtitle={assetName}
      maxWidth="2xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
              <th className="p-3 border-b-2 border-gray-200">Employee</th>
              <th className="p-3 border-b-2 border-gray-200">Checkout Date</th>
              <th className="p-3 border-b-2 border-gray-200">Return Date</th>
              <th className="p-3 border-b-2 border-gray-200">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-900">
                    <RefreshCw size={32} className="animate-spin text-gray-400 mb-2" />
                    <p className="font-mono text-xs uppercase tracking-widest">
                      Loading history...
                    </p>
                  </div>
                </td>
              </tr>
            ) : historyLogs.length > 0 ? (
              historyLogs.map((log) => {
                const duration = log.returnDate
                  ? Math.ceil(
                      (new Date(log.returnDate).getTime() - new Date(log.checkoutDate).getTime()) /
                        (1000 * 3600 * 24)
                    )
                  : Math.ceil(
                      (new Date().getTime() - new Date(log.checkoutDate).getTime()) /
                        (1000 * 3600 * 24)
                    );

                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-bold text-gray-900 text-sm">{log.user.name}</div>
                      <div className="font-mono text-[10px] text-gray-500">
                        {log.user.employeeId}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {new Date(log.checkoutDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {log.returnDate ? (
                        new Date(log.returnDate).toLocaleDateString()
                      ) : (
                        <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 border border-blue-200">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-500">{duration} days</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-gray-500 font-mono text-xs uppercase tracking-widest font-bold"
                >
                  No assignment history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
};
