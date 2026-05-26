import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Server } from 'lucide-react';
import toast from 'react-hot-toast';
import API_URL from '../config/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      login(response.data.user, response.data.token);
      toast.success('AUTHENTICATION SUCCESSFUL');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 font-sans relative">
      <div className="bg-white p-8 border-2 border-gray-900 shadow-[8px_8px_0_0_#111827] w-full max-w-md relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-mono">
            <Server size={24} />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-gray-900">EMPLOYEE ASSET TRACKER</h1>
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
              className="w-full border-2 border-gray-300 bg-white p-3 font-mono text-sm focus:border-black outline-none transition-colors"
              required
              placeholder="admin@system.com"
            />
          </div>
          <div>
            <label className="block font-mono text-xs font-bold text-gray-900 mb-2 uppercase tracking-widest">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-300 bg-white p-3 font-mono text-sm focus:border-black outline-none transition-colors"
              required
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-gray-900 text-white font-mono uppercase font-bold tracking-widest py-4 mt-8 hover:bg-black transition-colors"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
