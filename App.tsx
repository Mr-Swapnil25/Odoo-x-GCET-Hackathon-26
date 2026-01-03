import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Auth';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { Leaves } from './pages/Leaves';
import { Employees } from './pages/Employees';
import { Profile } from './pages/Profile';
import { Payroll } from './pages/Payroll';
import Chat from './pages/Chat';
import { Role } from './types';
import { AIChatbot } from './components/AIChatbot';

// Protected Route Component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser } = useStore();
  if (!currentUser || currentUser.role !== Role.ADMIN) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const { initializeData } = useStore();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1e1b27',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="profile" element={<Profile />} />
            
            <Route path="employees" element={
              <AdminRoute>
                <Employees />
              </AdminRoute>
            } />

            <Route path="payroll" element={
               <Payroll />
            } />
            
            <Route path="chat" element={<Chat />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* AI Chatbot - Available on all authenticated pages */}
        <AIChatbot />
      </HashRouter>
    </>
  );
}

export default App;