import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
    <div className="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] px-6 py-4 font-mono text-sm font-bold uppercase tracking-widest animate-pulse">
      Loading System...
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            borderRadius: '0',
            background: '#111827',
            color: '#fff',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            border: '2px solid #000',
            boxShadow: '4px 4px 0 0 #000',
            fontSize: '12px',
            fontWeight: 'bold',
          },
        }}
      />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Analytics />
    </AuthProvider>
  );
}

export default App;
