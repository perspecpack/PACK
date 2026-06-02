import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { MasterLayout } from './components/layout/MasterLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ResetPassword from './pages/Auth/ResetPassword';
import CompleteProfile from './pages/Auth/CompleteProfile';
import Downloads from './pages/Downloads/Downloads';
import Profile from './pages/Auth/Profile';
import MyPlan from './pages/Auth/MyPlan';
import DownloadsHistory from './pages/Downloads/DownloadsHistory';
import Help from './pages/Downloads/Help';
import PolicyDocument from './pages/Downloads/PolicyDocument';

// Master Pages
import Dashboard from './pages/Master/Dashboard';
import Organizations from './pages/Master/Organizations';
import Files from './pages/Master/Files';
import Settings from './pages/Master/Settings';
import Content from './pages/Master/Content';
import OrganizationDetail from './pages/Master/OrganizationDetail';
import ModuleContentManager from './pages/Master/ModuleContentManager';
import Users from './pages/Master/Users';
import SupportRequests from './pages/Master/SupportRequests';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'master' | 'user';
}

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, profile } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'master') {
    if (allowedRole && allowedRole !== 'master') {
      return <Navigate to="/master/dashboard" replace />;
    }
    return <>{children}</>;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect if role doesn't match
    return <Navigate to="/" replace />;
  }

  // Force profile completion for common users
  if (!profile || !profile.profileCompleted) {
    return <Navigate to="/completar-perfil" replace />;
  }

  return <>{children}</>;
}

function ProfileCompletionRoute({ children }: { children: React.ReactNode }) {
  const { user, profile } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'master') {
    return <Navigate to="/master/dashboard" replace />;
  }

  if (profile && profile.profileCompleted) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useApp();
  
  // Intercept password recovery flow from Supabase redirecting to root or other pages
  const hash = window.location.hash || '';
  if (hash.includes('type=recovery') && window.location.pathname !== '/reset-password') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Navigate to={`/reset-password${hash}`} replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/validar/:validationCode" element={<Login />} />
        
        {/* Profile Completion Flow */}
        <Route 
          path="/completar-perfil" 
          element={
            <ProfileCompletionRoute>
              <CompleteProfile />
            </ProfileCompletionRoute>
          } 
        />
        
        {/* Protected Supplier / Final User Routes */}
        <Route 
          element={
            <ProtectedRoute allowedRole="user">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Downloads />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/meu-plano" element={<MyPlan />} />
          <Route path="/historico-downloads" element={<DownloadsHistory />} />
          <Route path="/ajuda" element={<Help />} />
          <Route path="/ajuda/termos-de-uso" element={<PolicyDocument docType="termos" />} />
          <Route path="/ajuda/politica-de-privacidade" element={<PolicyDocument docType="privacidade" />} />
          <Route path="/ajuda/licenciamento-de-conteudo" element={<PolicyDocument docType="licenciamento" />} />
          <Route path="/ajuda/responsabilidade-tecnica" element={<PolicyDocument docType="responsabilidade" />} />
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
          <Route path="/master/users" element={<Users />} />
          <Route path="/master/oems" element={<Organizations />} />
          <Route path="/master/content" element={<Content />} />
          <Route path="/master/content/:orgId" element={<OrganizationDetail />} />
          <Route path="/master/content/:orgId/:moduleType" element={<ModuleContentManager />} />
          <Route path="/master/uploads" element={<Files />} />
          <Route path="/master/settings" element={<Settings />} />
          <Route path="/master/suporte" element={<SupportRequests />} />
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

