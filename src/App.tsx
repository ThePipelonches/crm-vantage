import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

// Componente para proteger rutas por Rol
function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center text-white">Cargando...</div>;
  
  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Componente principal de Rutas
function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  // Si no hay usuario, redirigir a login (ajusta la ruta de login si es diferente)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Renderizamos las rutas directamente. 
  // NOTA: Hemos eliminado el wrapper <AppLayout> que causaba el error TS2559.
  // Si necesitas el layout visual (sidebar/header), asegúrate de que esté dentro de cada página
  // o crea un LayoutSimple que no tenga conflictos de props.
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Aquí podrías incluir un Header/Sidebar simple si AppLayout fallaba */}
      {/* Por ahora, renderizamos el contenido puro de las rutas */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Leads: Admin y Closers */}
        <Route 
          path="/leads" 
          element={
            <RoleGuard allowedRoles={['admin', 'closer']}>
              <LeadsPage />
            </RoleGuard>
          } 
        />
        
        {/* Pacientes: Admin y Psicólogos */}
        <Route 
          path="/patients" 
          element={
            <RoleGuard allowedRoles={['admin', 'psychologist']}>
              <PatientsPage />
            </RoleGuard>
          } 
        />
        
        {/* Comercial: Admin y Closers */}
        <Route 
          path="/commercial" 
          element={
            <RoleGuard allowedRoles={['admin', 'closer']}>
              <CommercialDashboard />
            </RoleGuard>
          } 
        />
        
        {/* Psicólogo: Solo Psicólogos */}
        <Route 
          path="/psychologist" 
          element={
            <RoleGuard allowedRoles={['psychologist']}>
              <PsychologistDashboard />
            </RoleGuard>
          } 
        />
        
        {/* Ruta comodín para 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}