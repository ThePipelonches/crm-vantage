import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/pages/LoginPage';
import { AppLayout } from '@/layouts/AppLayout';
import { SetterDashboard } from '@/pages/setter/Dashboard';
import Leads from '@/pages/setter/Leads';
import { AppointmentsPage } from '@/pages/setter/Appointments';
import { PsychologistDashboard } from '@/pages/psychologist/Dashboard';
import { ClientsPage } from '@/pages/psychologist/Clients';
import { ClientProfilePage } from '@/pages/psychologist/ClientProfile';
import { CommercialDashboard } from '@/pages/commercial/Dashboard';
import { ClosersPage } from '@/pages/commercial/Closers';
import { AdminDashboard } from '@/pages/admin/Dashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loginStep } = useAuth();

  if (!user && loginStep === 'verification') {
    return <Routes><Route path="*" element={<LoginPage />} /></Routes>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route path="setter" element={<SetterDashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="commercial" element={<CommercialDashboard />} />
        <Route path="closers" element={<ClosersPage />} />
        <Route path="clinical" element={<PsychologistDashboard />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientProfilePage />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'setter') return <SetterDashboard />;
  if (user?.role === 'closer') return <CommercialDashboard />;
  if (user?.role === 'psychologist') return <PsychologistDashboard />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
