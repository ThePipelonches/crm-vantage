import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

// Componente de protección simple
function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-white p-10">Cargando...</div>;
  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// Componente principal de Rutas
function AppRoutes() {
  const { user } = useAuth();
  
  // Si no hay usuario, mostrar Login (o redirigir si tu login está en otra ruta)
  if (!user) {
     // Asumiendo que tu login está manejado dentro de AppLayout o en una ruta separada
     // Si tienes un LoginPage.tsx real, descomenta la siguiente línea:
     // return <LoginPage />; 
     return <div className="text-white p-10">Por favor inicia sesión (Login no encontrado en ruta raíz)</div>;
  }

  return (
    <AppLayout>
      <Routes>
        {/* Ruta Principal (Dashboard Admin por defecto) */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Pipeline de Leads (Admin & Closer) */}
        <Route path="/leads" element={
          <RoleGuard allowedRoles={['admin', 'closer']}>
            <LeadsPage />
          </RoleGuard>
        } />
        
        {/* Pacientes (Admin & Psychologist) - Página Unificada */}
        <Route path="/patients" element={
          <RoleGuard allowedRoles={['admin', 'psychologist']}>
            <PatientsPage />
          </RoleGuard>
        } />
        
        {/* Dashboard Comercial (Admin & Closer) */}
        <Route path="/commercial" element={
          <RoleGuard allowedRoles={['admin', 'closer']}>
            <CommercialDashboard />
          </RoleGuard>
        } />
        
        {/* Dashboard Psicólogo (Psychologist) */}
        <Route path="/psychologist" element={
          <RoleGuard allowedRoles={['psychologist']}>
            <PsychologistDashboard />
          </RoleGuard>
        } />
        
        {/* Ruta comodín para 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
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