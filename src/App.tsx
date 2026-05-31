import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { MasterLayout } from './components/layout/MasterLayout';
import Login from './pages/Auth/Login';
import Downloads from './pages/Downloads/Downloads';

// Master Pages
import Dashboard from './pages/Master/Dashboard';
import Organizations from './pages/Master/Organizations';
import Files from './pages/Master/Files';
import Settings from './pages/Master/Settings';
import Content from './pages/Master/Content';
import OrganizationDetail from './pages/Master/OrganizationDetail';
import ModuleContentManager from './pages/Master/ModuleContentManager';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'master' | 'user';
}

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect if role doesn't match: Master goes to /master/dashboard, User goes to /
    return <Navigate to={user.role === 'master' ? '/master/dashboard' : '/'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useApp();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Supplier / Final User Routes */}
        <Route 
          element={
            <ProtectedRoute allowedRole="user">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Downloads />} />
        </Route>

        {/* Protected Master / Admin Routes */}
        <Route 
          element={
            <ProtectedRoute allowedRole="master">
              <MasterLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/master" element={<Navigate to="/master/dashboard" replace />} />
          <Route path="/master/dashboard" element={<Dashboard />} />
          <Route path="/master/oems" element={<Organizations />} />
          <Route path="/master/content" element={<Content />} />
          <Route path="/master/content/:orgId" element={<OrganizationDetail />} />
          <Route path="/master/content/:orgId/:moduleType" element={<ModuleContentManager />} />
          <Route path="/master/uploads" element={<Files />} />
          <Route path="/master/settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirection */}
        <Route 
          path="*" 
          element={
            <Navigate 
              to={user ? (user.role === 'master' ? '/master/dashboard' : '/') : '/login'} 
              replace 
            />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

