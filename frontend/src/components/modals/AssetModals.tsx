import React from 'react';
import { X } from 'lucide-react';
import { SelectDropdown } from '../SelectDropdown';
import { DatePicker } from '../DatePicker';

type AssetModalsProps = {
  isAddModalOpen: boolean;
  newAsset: any;
  setNewAsset: (asset: any) => void;
  handleCreateAsset: (e: React.FormEvent) => void;
  isCreatingCategory: boolean;
  setIsCreatingCategory: (val: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (val: string) => void;
  handleCategoryNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateCategory: (e: React.FormEvent) => void;
  categories: any[];

  isAssignModalOpen: boolean;
  assignSearchQuery: string;
  setAssignSearchQuery: (val: string) => void;
  showAssignDropdown: boolean;
  setShowAssignDropdown: (val: boolean) => void;
  assignUserId: string;
  setAssignUserId: (id: string) => void;
  isSearchingAssign: boolean;
  assignSearchResults: any[];
  handleAssignAsset: (e: React.FormEvent) => void;

  isEditModalOpen: boolean;
  editingAsset: any;
  setEditingAsset: (asset: any) => void;
  handleUpdateAsset: (e: React.FormEvent) => void;

  isHistoryModalOpen: boolean;
  activeHistoryAssetName: string;
  historyLogs: any[];

  closeAllModals: () => void;
  isSubmitting: boolean;
};

export const AssetModals: React.FC<AssetModalsProps> = ({
  isAddModalOpen, newAsset, setNewAsset, handleCreateAsset, isCreatingCategory, setIsCreatingCategory,
  newCategoryName, setNewCategoryName, handleCategoryNameChange, handleCreateCategory, categories,
  isAssignModalOpen, assignSearchQuery, setAssignSearchQuery, showAssignDropdown, setShowAssignDropdown,
  assignUserId, setAssignUserId, isSearchingAssign, assignSearchResults, handleAssignAsset,
  isEditModalOpen, editingAsset, setEditingAsset, handleUpdateAsset,
  isHistoryModalOpen, activeHistoryAssetName, historyLogs,
  closeAllModals, isSubmitting
}) => {
  return (
    <>
      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={closeAllModals} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Register Hardware</h3>
            
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Hardware Name</label>
                <input required type="text" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. MacBook Pro M2" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Serial Number</label>
                <input required type="text" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value.toUpperCase()})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors uppercase" placeholder="e.g. C02H123456" />
              </div>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="block font-mono text-xs uppercase mb-1 font-bold">Category</label>
                  {!isCreatingCategory ? (
                    <SelectDropdown
                      value={newAsset.category}
                      onChange={val => setNewAsset({...newAsset, category: val})}
                      options={categories.length > 0 ? categories.map(c => ({ value: c.name, label: c.name })) : [{ value: '', label: 'No categories available' }]}
                      className="w-full"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newCategoryName} 
                        onChange={handleCategoryNameChange} 
                        className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors uppercase" 
                        placeholder="e.g. LAPTOP" 
                        autoFocus
                      />
                      <button type="button" onClick={handleCreateCategory} disabled={!newCategoryName.trim() || isSubmitting} className="bg-gray-900 text-white px-4 font-mono font-bold hover:bg-black disabled:opacity-50 transition-colors uppercase text-sm">
                        Add
                      </button>
                    </div>
                  )}
                </div>
                {!isCreatingCategory && (
                  <button type="button" onClick={() => setIsCreatingCategory(true)} className="px-4 py-3 border-2 border-[#e4e4e7] text-gray-500 hover:text-black hover:border-gray-900 font-bold transition-colors whitespace-nowrap">
                    + New
                  </button>
                )}
                {isCreatingCategory && (
                  <button type="button" onClick={() => { setIsCreatingCategory(false); setNewCategoryName(''); }} className="px-4 py-3 text-gray-400 hover:text-black">
                    <X size={20} />
                  </button>
                )}
              </div>

              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Purchase Date</label>
                <DatePicker value={newAsset.purchaseDate} onChange={val => setNewAsset({...newAsset, purchaseDate: val})} className="w-full" />
              </div>
              <button disabled={isSubmitting || categories.length === 0} type="submit" className={`w-full bg-gray-900 text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-black transition-colors ${isSubmitting || categories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Register Asset'}
              </button>
              {categories.length === 0 && (
                <p className="text-red-500 font-mono text-[10px] uppercase text-center mt-2 font-bold tracking-widest">
                  Create a category first
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={closeAllModals} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Assign Hardware</h3>
            
            <form onSubmit={handleAssignAsset} className="space-y-6">
              <div className="relative">
                <label className="block font-mono text-xs uppercase mb-2 font-bold">Search Employee</label>
                <input 
                  type="text" 
                  placeholder="Enter name or ID..."
                  value={assignSearchQuery}
                  onChange={e => {
                    setAssignSearchQuery(e.target.value);
                    setShowAssignDropdown(true);
                    setAssignUserId('');
                  }}
                  className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" 
                />
                
                {showAssignDropdown && assignSearchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] z-50 max-h-60 overflow-y-auto">
                    {isSearchingAssign ? (
                      <div className="p-4 font-mono text-xs text-gray-500 text-center uppercase">Searching...</div>
                    ) : assignSearchResults.length > 0 ? (
                      assignSearchResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setAssignUserId(u.id);
                            setAssignSearchQuery(`${u.name} (${u.employeeId})`);
                            setShowAssignDropdown(false);
                          }}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-100 outline-none flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                            <p className="font-mono text-xs text-gray-500 mt-0.5">{u.employeeId}</p>
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1">
                            {u.department}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 font-mono text-xs text-gray-500 text-center uppercase">No active employees found</div>
                    )}
                  </div>
                )}
              </div>
              
              <button disabled={isSubmitting || !assignUserId} type="submit" className={`w-full bg-blue-600 text-white font-mono uppercase font-bold py-4 hover:bg-blue-700 transition-colors ${isSubmitting || !assignUserId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Confirm Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={closeAllModals} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Edit Hardware</h3>
            
            <form onSubmit={handleUpdateAsset} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Hardware Name</label>
                <input required type="text" value={editingAsset.name} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Serial Number</label>
                <input required type="text" value={editingAsset.serialNumber} onChange={e => setEditingAsset({...editingAsset, serialNumber: e.target.value.toUpperCase()})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors uppercase" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Category</label>
                <input disabled type="text" value={editingAsset.category} className="w-full border-2 border-gray-300 p-3 font-mono text-sm bg-gray-100 cursor-not-allowed text-gray-500" title="Category cannot be changed after creation." />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Purchase Date</label>
                <DatePicker value={editingAsset.purchaseDate} onChange={val => setEditingAsset({...editingAsset, purchaseDate: val})} className="w-full" />
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Log Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={closeAllModals} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2 border-b pb-4">Audit Log</h3>
            <p className="font-mono text-xs text-gray-500 mb-6 uppercase">{activeHistoryAssetName}</p>
            
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
                  {historyLogs.length > 0 ? historyLogs.map(log => {
                    const duration = log.returnDate 
                      ? Math.ceil((new Date(log.returnDate).getTime() - new Date(log.checkoutDate).getTime()) / (1000 * 3600 * 24))
                      : Math.ceil((new Date().getTime() - new Date(log.checkoutDate).getTime()) / (1000 * 3600 * 24));
                      
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-bold text-gray-900 text-sm">{log.user.name}</div>
                          <div className="font-mono text-[10px] text-gray-500">{log.user.employeeId}</div>
                        </td>
                        <td className="p-3 font-mono text-xs">{new Date(log.checkoutDate).toLocaleDateString()}</td>
                        <td className="p-3 font-mono text-xs">
                          {log.returnDate ? (
                            new Date(log.returnDate).toLocaleDateString()
                          ) : (
                            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 border border-blue-200">ACTIVE</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-500">{duration} days</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500 font-mono text-xs uppercase tracking-widest font-bold">
                        No assignment history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
