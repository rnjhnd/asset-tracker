import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Server, Key, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import API_URL from '../config/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('ACCESS DENIED: MISSING CREDENTIALS');
      setError('Please provide both email and password.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      login(response.data.user, response.data.token);
      toast.success('LOGGED IN SUCCESSFULLY', { id: 'login-toast' });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsSubmittingForgot(true);
    try {
      await axios.post(`${API_URL}/api/auth/request-reset`, { email: forgotEmail });
      toast.success('Password reset request sent to Administrators!', { duration: 5000 });
      setIsForgotModalOpen(false);
      setForgotEmail('');
    } catch (err) {
      toast.error('Failed to send reset request');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* LEFT SIDE - BRANDING */}
      <div className="w-full md:w-1/2 bg-[#3b82f6] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
        
        <div className="relative z-10 flex items-center gap-4 text-white mb-12 md:mb-0">
          <div className="w-12 h-12 bg-white text-[#3b82f6] flex items-center justify-center font-mono shrink-0 shadow-[4px_4px_0_0_#1e3a8a]">
            <Server size={24} />
          </div>
          <span className="font-mono font-bold tracking-widest text-sm uppercase border-b-2 border-white pb-1">
            Staff Portal
          </span>
        </div>

        <div className="relative z-10 mt-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white uppercase tracking-tighter leading-none mb-6">
            Internal<br/>Asset<br/>Portal
          </h1>
          <p className="text-blue-100 font-mono text-sm md:text-base max-w-md uppercase tracking-wider leading-relaxed border-l-4 border-white pl-4">
            A robust, full-stack inventory management system for tracking hardware deployments, managing employee assignments, and monitoring asset lifecycles across the organization.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN */}
      <div className="w-full md:w-1/2 bg-[#f4f4f5] flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-md">
          {/* Main Login Box */}
          <div className="bg-white p-6 sm:p-10 border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] relative z-10 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-gray-900 mb-2">Authentication</h2>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Enter secure credentials</p>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 border-2 border-red-200 p-4 mb-6 font-mono text-sm font-bold uppercase text-center shadow-[4px_4px_0_0_#fca5a5]">
                ERROR: {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block font-mono text-xs font-bold text-gray-900 mb-2 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-gray-300 bg-white p-3 sm:p-4 font-mono text-sm focus:border-black outline-none transition-colors"
                  placeholder="admin@system.com"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-gray-900 mb-2 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-gray-300 bg-white p-3 sm:p-4 pr-12 font-mono text-sm focus:border-black outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsForgotModalOpen(true)}
                    className="font-mono text-xs text-gray-500 hover:text-black uppercase font-bold tracking-widest transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#3b82f6] text-white font-mono uppercase font-bold tracking-widest py-4 mt-8 hover:bg-blue-600 transition-colors flex items-center justify-center gap-3 border-2 border-[#3b82f6] hover:border-blue-600 shadow-[4px_4px_0_0_#1e3a8a]"
              >
                <Key size={18} /> Proceed
              </button>
            </form>
          </div>

          {/* Demo Credentials Box */}
          <div className="bg-white border-2 border-gray-300 p-4 font-mono text-xs text-gray-600 shadow-[4px_4px_0_0_#d4d4d8]">
            <p className="font-bold text-black uppercase mb-2 flex items-center gap-2">
              <Server size={14} /> Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">ADMINISTRATOR</p>
                <p className="font-bold text-gray-800">admin@system.com</p>
                <p>admin123</p>
              </div>
              <div>
                <p className="text-gray-400">EMPLOYEE</p>
                <p className="font-bold text-gray-800">employee1@system.com</p>
                <p>employee123</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-gray-900 shadow-[8px_8px_0_0_#111827] w-full max-w-md p-6 sm:p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold uppercase tracking-tighter text-gray-900 mb-2 flex items-center gap-2">
              <Key size={24} /> Reset Request
            </h2>
            <p className="font-mono text-sm text-gray-600 mb-6">
              Enter your email address to submit a password reset request to your IT Administrator.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-gray-900 mb-2 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full border-2 border-gray-300 bg-white p-3 font-mono text-sm focus:border-black outline-none transition-colors"
                  placeholder="employee@system.com"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-900 font-mono uppercase font-bold tracking-widest py-3 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingForgot}
                  className="flex-1 bg-gray-900 text-white font-mono uppercase font-bold tracking-widest py-3 hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSubmittingForgot ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
