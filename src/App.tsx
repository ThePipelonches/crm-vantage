import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
// Ajusta estos imports según donde estén realmente tus archivos
import LoginPage from './pages/auth/LoginPage'; 
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
// Si ClinicalDashboard no existe, usa un fallback o comenta esta línea
import ClinicalDashboard from './pages/clinical/Dashboard'; 
import PsychologistDashboard from './pages/psychologist/Dashboard';
// Verifica si AppLayout exporta por defecto o named. Asumimos named por el error anterior.
import { AppLayout } from './layouts/AppLayout'; 

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-white p-10">Cargando...</div>;
  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-black text-white">Cargando CRM...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  // Si AppLayout no acepta children, debemos usarlo diferente. 
  // Asumiremos que sí los acepta basándonos en tu diseño anterior, pero si falla, 
  // la estructura podría ser que AppLayout sea el que contiene las rutas.
  
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<RoleGuard allowedRoles={['admin', 'closer']}><LeadsPage /></RoleGuard>} />
        <Route path="/patients" element={<RoleGuard allowedRoles={['admin', 'psychologist']}><PatientsPage /></RoleGuard>} />
        <Route path="/commercial" element={<RoleGuard allowedRoles={['admin', 'closer']}><CommercialDashboard /></RoleGuard>} />
        <Route path="/clinical" element={<RoleGuard allowedRoles={['admin', 'psychologist']}><ClinicalDashboard /></RoleGuard>} />
        <Route path="/psychologist" element={<RoleGuard allowedRoles={['psychologist']}><PsychologistDashboard /></RoleGuard>} />
        {/* Ruta por defecto para cualquier camino desconocido */}
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