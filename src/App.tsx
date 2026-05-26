import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-white">Cargando...</div>;
  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />; // Asumiendo que hay login o redirección

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<RoleGuard allowedRoles={['admin', 'closer']}><LeadsPage /></RoleGuard>} />
        <Route path="/patients" element={<RoleGuard allowedRoles={['admin', 'psychologist']}><PatientsPage /></RoleGuard>} />
        <Route path="/commercial" element={<RoleGuard allowedRoles={['admin', 'closer']}><CommercialDashboard /></RoleGuard>} />
        <Route path="/psychologist" element={<RoleGuard allowedRoles={['psychologist']}><PsychologistDashboard /></RoleGuard>} />
        {/* Redirección para rutas desconocidas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}