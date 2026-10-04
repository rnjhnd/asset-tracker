import React from 'react';
import { X, Edit2, User } from 'lucide-react';
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
  isAddModalOpen, newAsset, setNewAsset, handleCreateAsset,
  isCreatingCategory, setIsCreatingCategory, newCategoryName, handleCategoryNameChange, handleCreateCategory, categories,
  isAssignModalOpen, assignSearchQuery, setAssignSearchQuery, showAssignDropdown, setShowAssignDropdown, assignUserId, setAssignUserId, isSearchingAssign, assignSearchResults, handleAssignAsset,
  isEditModalOpen, editingAsset, setEditingAsset, handleUpdateAsset,
  isHistoryModalOpen, activeHistoryAssetName, historyLogs,
  closeAllModals, isSubmitting
}) => {
  return (
    <>
      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-lg relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => closeAllModals()} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2 pr-8">{activeHistoryAssetName}</h3>
            <p className="font-mono text-sm text-gray-500 uppercase mb-6 border-b pb-4">Audit Log & Lifecycle</p>
            
            <div className="overflow-y-auto pr-2 pl-4 space-y-4">
              {historyLogs.length === 0 ? (
                <p className="font-mono text-sm text-gray-400 uppercase text-center py-8">No historical data found.</p>
              ) : (
                historyLogs.map(log => (
                  <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-2 relative">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-4 border-2 border-white ${log.returnDate ? 'bg-gray-400' : 'bg-green-500'}`}></div>
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 p-2 border border-gray-200">
                        <User size={20} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1">{log.user.name || log.user.employeeId}</p>
                        <div className="font-mono text-xs text-gray-500 flex flex-col gap-1">
                          <span>CHECKOUT: {new Date(log.checkoutDate).toLocaleString()}</span>
                          {log.returnDate ? (
                            <span className="text-gray-400">RETURNED: {new Date(log.returnDate).toLocaleString()}</span>
                          ) : (
                            <span className="text-green-600 font-bold">STATUS: ACTIVE</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => closeAllModals()} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Register New Hardware</h3>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Asset Name</label>
                <input required type="text" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. MacBook Pro 16" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Serial Number</label>
                <input required type="text" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. MBP-2024-001" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Purchase Date</label>
                <DatePicker maxDate={new Date()} value={newAsset.purchaseDate} onChange={val => setNewAsset({...newAsset, purchaseDate: val})} className="w-full" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Category</label>
                {isCreatingCategory ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input required autoFocus type="text" value={newCategoryName} onChange={handleCategoryNameChange} className="flex-1 border-2 border-[#3b82f6] p-3 font-mono text-sm focus:border-blue-600 outline-none transition-colors" placeholder="E.g. VR HEADSET" />
                    <button type="button" onClick={handleCreateCategory} disabled={isSubmitting || !newCategoryName.trim()} className="w-full sm:w-auto bg-[#3b82f6] text-white px-4 py-3 font-bold hover:bg-blue-600 transition-colors">ADD</button>
                    <button type="button" onClick={() => { setIsCreatingCategory(false); handleCategoryNameChange({target: {value: ''}} as any); }} className="w-full sm:w-auto bg-gray-200 text-gray-700 px-4 py-3 font-bold hover:bg-gray-300 transition-colors">CANCEL</button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <SelectDropdown
                      value={newAsset.category}
                      onChange={val => setNewAsset({...newAsset, category: val})}
                      options={categories.filter(c => c.name !== 'UNASSIGNED').map(c => ({ value: c.name, label: c.name }))}
                      className="flex-1"
                    />
                    <button type="button" onClick={() => setIsCreatingCategory(true)} className="w-full sm:w-auto bg-gray-900 text-white px-4 py-3 font-bold hover:bg-gray-700 transition-colors whitespace-nowrap">+ NEW</button>
                  </div>
                )}
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Deploy to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Asset Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => closeAllModals()} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Assign Hardware</h3>
            <form onSubmit={handleAssignAsset} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Search & Select Employee</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={assignSearchQuery}
                    onChange={(e) => {
                      setAssignSearchQuery(e.target.value);
                      setShowAssignDropdown(true);
                      setAssignUserId('');
                    }}
                    onFocus={() => setShowAssignDropdown(true)}
                    className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none bg-white transition-colors"
                    placeholder="Type to search employee..."
                    required={!assignUserId}
                  />
                  {showAssignDropdown && assignSearchQuery.trim().length > 0 && (
                    <ul className="w-full bg-white border-2 border-gray-900 border-t-0 shadow-[4px_4px_0_0_#111827] mt-0 max-h-48 overflow-y-auto">
                      {isSearchingAssign ? (
                        <li className="p-3 font-mono text-sm text-gray-500">Searching...</li>
                      ) : assignSearchResults.length === 0 ? (
                        <li className="p-3 font-mono text-sm text-gray-500">No employees found.</li>
                      ) : (
                        assignSearchResults.map(u => (
                          <li 
                            key={u.id} 
                            onClick={() => {
                              setAssignUserId(u.id);
                              setAssignSearchQuery(`${u.name} (${u.employeeId})`);
                              setShowAssignDropdown(false);
                            }}
                            className="p-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 cursor-pointer font-mono text-sm transition-colors text-left"
                          >
                            <div className="font-bold text-gray-900">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.employeeId}</div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors">Confirm Assignment</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={() => closeAllModals()} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight uppercase mb-6 flex items-center gap-3">
              <Edit2 className="text-[#3b82f6]" />
              Edit Asset Details
            </h2>
            <form onSubmit={handleUpdateAsset} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Asset Name</label>
                <input required autoFocus type="text" value={editingAsset.name} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Serial Number</label>
                <input required type="text" value={editingAsset.serialNumber} onChange={e => setEditingAsset({...editingAsset, serialNumber: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Purchase Date</label>
                <DatePicker maxDate={new Date()} value={editingAsset.purchaseDate} onChange={val => setEditingAsset({...editingAsset, purchaseDate: val})} className="w-full" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Category</label>
                {isCreatingCategory ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input required autoFocus type="text" value={newCategoryName} onChange={handleCategoryNameChange} className="flex-1 border-2 border-[#3b82f6] p-3 font-mono text-sm focus:border-blue-600 outline-none transition-colors" placeholder="E.g. VR HEADSET" />
                    <button type="button" onClick={handleCreateCategory} disabled={isSubmitting || !newCategoryName.trim()} className="w-full sm:w-auto bg-[#3b82f6] text-white px-4 py-3 font-bold hover:bg-blue-600 transition-colors">ADD</button>
                    <button type="button" onClick={() => { setIsCreatingCategory(false); handleCategoryNameChange({target: {value: ''}} as any); }} className="w-full sm:w-auto bg-gray-200 text-gray-700 px-4 py-3 font-bold hover:bg-gray-300 transition-colors">CANCEL</button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <SelectDropdown
                      value={editingAsset.category}
                      onChange={val => setEditingAsset({...editingAsset, category: val})}
                      options={categories.filter(c => c.name !== 'UNASSIGNED').map(c => ({ value: c.name, label: c.name }))}
                      className="flex-1"
                    />
                    <button type="button" onClick={() => setIsCreatingCategory(true)} className="w-full sm:w-auto bg-gray-900 text-white px-4 py-3 font-bold hover:bg-gray-700 transition-colors whitespace-nowrap">+ NEW</button>
                  </div>
                )}
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
