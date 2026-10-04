import React from 'react';
import { Trash2 } from 'lucide-react';

type DeleteModalProps = {
  deleteConfirmInfo: { id: string, type: 'USER' | 'ASSET' } | null;
  setDeleteConfirmInfo: (info: { id: string, type: 'USER' | 'ASSET' } | null) => void;
  executeDelete: () => void;
  isSubmitting: boolean;
};

export const DeleteModal: React.FC<DeleteModalProps> = ({
  deleteConfirmInfo, setDeleteConfirmInfo, executeDelete, isSubmitting
}) => {
  if (!deleteConfirmInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
      <div className="bg-white border-2 border-red-600 shadow-[8px_8px_0_0_#dc2626] p-6 sm:p-8 w-full max-w-md relative mx-4">
        <div className="flex items-center gap-4 mb-4 text-red-600">
          <Trash2 size={32} />
          <h2 className="text-2xl font-bold font-mono tracking-tight uppercase">Hard Delete</h2>
        </div>
        <p className="text-gray-700 font-mono text-sm mb-6">
          Are you absolutely sure? This will permanently delete this {deleteConfirmInfo.type.toLowerCase()} from the database.
          <br/><br/>
          <span className="font-bold text-red-600">WARNING:</span> This will only succeed if the {deleteConfirmInfo.type.toLowerCase()} has <span className="font-bold underline">ZERO</span> assignment history. Otherwise, you must Retire/Deactivate them instead to preserve audit logs.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setDeleteConfirmInfo(null)}
            className="flex-1 bg-gray-100 text-gray-700 border-2 border-gray-300 font-mono uppercase font-bold py-3 hover:bg-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={executeDelete}
            className={`flex-1 bg-red-600 text-white font-mono uppercase font-bold py-3 hover:bg-red-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'DELETING...' : 'YES, DELETE'}
          </button>
        </div>
      </div>
    </div>
  );
};
