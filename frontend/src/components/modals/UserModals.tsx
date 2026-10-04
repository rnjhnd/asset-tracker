import React from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SelectDropdown } from '../SelectDropdown';

type UserModalsProps = {
  isUserModalOpen: boolean;
  newUser: any;
  setNewUser: (user: any) => void;
  handleCreateUser: (e: React.FormEvent) => void;
  handleDepartmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  isEditUserModalOpen: boolean;
  editingUser: any;
  setEditingUser: (user: any) => void;
  handleEditUser: (e: React.FormEvent) => void;

  isForceResetModalOpen: boolean;
  forceResetUserEmployeeId: string;
  forceNewPassword: string;
  setForceNewPassword: (pw: string) => void;
  handleForceResetPassword: (e: React.FormEvent) => void;
  
  isSubmitting: boolean;
  closeAllModals: () => void;
};

export const UserModals: React.FC<UserModalsProps> = ({
  isUserModalOpen, newUser, setNewUser, handleCreateUser, handleDepartmentChange,
  isEditUserModalOpen, editingUser, setEditingUser, handleEditUser,
  isForceResetModalOpen, forceResetUserEmployeeId, forceNewPassword, setForceNewPassword, handleForceResetPassword,
  isSubmitting, closeAllModals
}) => {
  return (
    <>
      {/* Force Reset Password Modal (Admin Only) */}
      {isForceResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={closeAllModals} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2 border-b pb-4">Force Reset Password</h3>
            <p className="font-mono text-xs text-gray-500 mb-6 uppercase">Target Account: {forceResetUserEmployeeId}</p>
            <form onSubmit={handleForceResetPassword} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">New Temporary Password</label>
                <input required type="text" value={forceNewPassword} onChange={e => setForceNewPassword(e.target.value)} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. TempPass123!" />
                <p className="font-mono text-[10px] text-gray-500 mt-2">Must be at least 8 characters long.</p>
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-red-600 text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-red-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'OVERRIDE PASSWORD'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={closeAllModals} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Register Employee</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Full Name</label>
                <input 
                  required 
                  type="text" 
                  pattern="^[A-Za-z\s]+$" 
                  title="Only letters and spaces are allowed." 
                  value={newUser.name} 
                  onChange={e => {
                    const rawVal = e.target.value;
                    if (/[^A-Za-z\s]/.test(rawVal)) {
                      toast('Only letters and spaces are allowed for Full Name', { icon: '⚠️', id: 'name-val-err' });
                    }
                    setNewUser({...newUser, name: rawVal.replace(/[^A-Za-z\s]/g, '')});
                  }} 
                  className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" 
                  placeholder="e.g. John Doe" 
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Employee ID</label>
                <input required type="text" value={newUser.employeeId} onChange={e => setNewUser({...newUser, employeeId: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="EMP-001" />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Initial Password</label>
                <div className="relative mb-2">
                  <input required type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. temporary123" />
                </div>
                <p className="font-mono text-[10px] text-gray-500">Must be at least 8 characters long.</p>
              </div>
              {newUser.role !== 'ADMIN' && (
                <div>
                  <label className="block font-mono text-xs uppercase mb-1 font-bold">Department</label>
                  <input required type="text" value={newUser.department} onChange={handleDepartmentChange} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" placeholder="e.g. ENGINEERING" />
                </div>
              )}
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">System Role</label>
                <SelectDropdown
                  value={newUser.role}
                  onChange={val => setNewUser({...newUser, role: val})}
                  options={[
                    { value: 'EMPLOYEE', label: 'Standard Employee' },
                    { value: 'ADMIN', label: 'System Administrator' }
                  ]}
                  className="w-full"
                />
              </div>
              <button disabled={isSubmitting} type="submit" className={`w-full bg-[#3b82f6] text-white font-mono uppercase font-bold py-4 mt-6 hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'PROCESSING...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] p-6 sm:p-8 w-full max-w-[95%] sm:max-w-md relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button onClick={closeAllModals} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-6 border-b pb-4">Edit Employee</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={editingUser.name} 
                  onChange={e => {
                    const rawVal = e.target.value;
                    if (/[^A-Za-z\s]/.test(rawVal)) {
                      toast('Only letters and spaces are allowed for Full Name', { icon: '⚠️', id: 'edit-name-val-err' });
                    }
                    setEditingUser({...editingUser, name: rawVal.replace(/[^A-Za-z\s]/g, '')});
                  }} 
                  className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" 
                  placeholder="e.g. John Doe" 
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase mb-1 font-bold">Employee ID</label>
                <input disabled required type="text" value={editingUser.employeeId} onChange={e => setEditingUser({...editingUser, employeeId: e.target.value})} className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors bg-gray-100 cursor-not-allowed text-gray-500" placeholder="EMP-001" title="Employee ID cannot be changed after creation." />
              </div>
              {editingUser.role !== 'ADMIN' && (
                <div>
                  <label className="block font-mono text-xs uppercase mb-1 font-bold">Department</label>
                  <input 
                    required 
                    type="text" 
                    value={editingUser.department} 
                    onChange={e => {
                      const raw = e.target.value;
                      const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
                      if (raw !== sanitized) toast('Only letters and spaces allowed', { icon: '🚧', id: 'edit-dept-val-err' });
                      setEditingUser({...editingUser, department: sanitized.toUpperCase()});
                    }} 
                    className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-black outline-none transition-colors" 
                    placeholder="e.g. ENGINEERING" 
                  />
                </div>
              )}
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
