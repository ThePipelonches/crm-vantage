import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

import { LoginPage } from '@/pages/LoginPage';
import ChangePasswordPage from '@/pages/ChangePassword';

import { AppLayout } from '@/layouts/AppLayout';

import { SetterDashboard } from '@/pages/setter/Dashboard';
import Leads from '@/pages/setter/Leads';
import { AppointmentsPage } from '@/pages/setter/Appointments';

import { PsychologistDashboard } from './pages/psychologist/Dashboard';
import { ClientsPage } from './pages/psychologist/Clients';
import { ClientProfilePage } from './pages/psychologist/ClientProfile';

import { CommercialDashboard } from '@/pages/commercial/Dashboard';
import { ClosersPage } from '@/pages/commercial/Closers';

import DashboardAdmin from '@/pages/admin/Dashboard';

//////////////////////////////////////////////////
// 🔐 PROTECTED ROUTE
//////////////////////////////////////////////////

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

//////////////////////////////////////////////////
// 🔥 FORCE PASSWORD CHANGE
//////////////////////////////////////////////////

function RequirePasswordChange({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return null;

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}

//////////////////////////////////////////////////
// 🎯 ROUTES
//////////////////////////////////////////////////

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* CHANGE PASSWORD */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            {user?.mustChangePassword ? (
              <ChangePasswordPage />
            ) : (
              <Navigate to="/" replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* APP */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <RequirePasswordChange>
              <AppLayout />
            </RequirePasswordChange>
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />

        {/* SETTER */}
        <Route path="setter" element={<SetterDashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="appointments" element={<AppointmentsPage />} />

        {/* COMMERCIAL */}
        <Route path="commercial" element={<CommercialDashboard />} />
        <Route path="closers" element={<ClosersPage />} />

        {/* PSYCHOLOGIST */}
        <Route path="clinical" element={<PsychologistDashboard />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientProfilePage />} />

        {/* ADMIN */}
        <Route path="admin" element={<DashboardAdmin />} />
      </Route>
    </Routes>
  );
}

//////////////////////////////////////////////////
// 🔄 ROLE REDIRECT
//////////////////////////////////////////////////

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'setter') return <Navigate to="/setter" replace />;
  if (user.role === 'closer') return <Navigate to="/commercial" replace />;
  if (user.role === 'psychologist') return <Navigate to="/clinical" replace />;

  return <Navigate to="/admin" replace />;
}

//////////////////////////////////////////////////
// 🚀 APP ROOT
//////////////////////////////////////////////////

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}