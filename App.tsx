import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { TaskTracking } from './pages/TaskTracking';
import { TaskManagement } from './pages/TaskManagement';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';
import { UserProfile } from './pages/UserProfile';

// Protected Route Component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser, isLoading } = useStore();
  if (isLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser } = useStore();
  if (!currentUser || currentUser.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const { initializeSession } = useStore();

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

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
          <Route path="/auth/callback" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<TaskTracking />} />
            <Route path="my-tasks" element={<TaskManagement />} />
            <Route path="users" element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            } />
            <Route path="profile" element={<UserProfile />} />
            <Route path="reports" element={
              <AdminRoute>
                <Reports />
              </AdminRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
