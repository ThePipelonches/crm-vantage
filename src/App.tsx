import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import ClinicalDashboard from './pages/clinical/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<RoleGuard allowedRoles={['admin', 'closer']}><LeadsPage /></RoleGuard>} />
        <Route path="/patients" element={<RoleGuard allowedRoles={['admin', 'psychologist']}><PatientsPage /></RoleGuard>} />
        <Route path="/commercial" element={<RoleGuard allowedRoles={['admin', 'closer']}><CommercialDashboard /></RoleGuard>} />
        <Route path="/clinical" element={<RoleGuard allowedRoles={['admin', 'psychologist']}><ClinicalDashboard /></RoleGuard>} />
        <Route path="/psychologist" element={<RoleGuard allowedRoles={['psychologist']}><PsychologistDashboard /></RoleGuard>} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}