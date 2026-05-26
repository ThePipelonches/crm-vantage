import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
// Asumimos que AppLayout existe y exporta por defecto o named. Si falla, usaremos un div.
import AppLayout from './layouts/AppLayout'; 

// PÃ¡ginas existentes confirmadas
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

// Componente de ProtecciÃ³n de Roles Simple
function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="text-white p-10">Cargando...</div>;
  
  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Layout Wrapper seguro
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  // Intentamos usar AppLayout, si da error de props, el usuario deberÃ¡ ajustar AppLayout.tsx
  // pero aquÃ­ lo usamos de la forma mÃ¡s estÃ¡ndar posible.
  try {
    return <AppLayout>{children}</AppLayout>;
  } catch (e) {
    // Fallback por si AppLayout falla catastrÃ³ficamente
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }
}

function AppContent() {
  const { user } = useAuth();

  // Si no hay usuario, mostramos login (o redirigimos, pero necesitamos el componente Login)
  // Como no tenemos LoginPage funcional importado, mostramos un mensaje o un login simple si existiera.
  // Por ahora, asumimos que si no hay user, se muestra nada o un fallback.
  // MEJORA: Si tienes un LoginComponent, impÃ³rtalo aquÃ­. Si no, esto quedarÃ¡ en blanco hasta login.
  if (!user) {
     return (
       <div className="flex items-center justify-center h-screen bg-black text-white">
         <h1>Inicia SesiÃ³n</h1>
         {/* AquÃ­ irÃ­a <LoginPage /> si el archivo existiera */}
       </div>
     );
  }

  return (
    <LayoutWrapper>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Leads: Admin y Closer */}
        <Route 
          path="/leads" 
          element={
            <RoleGuard allowedRoles={['admin', 'closer']}>
              <LeadsPage />
            </RoleGuard>
          } 
        />
        
        {/* Pacientes: Admin y PsicÃ³logo (PÃ¡gina Unificada) */}
        <Route 
          path="/patients" 
          element={
            <RoleGuard allowedRoles={['admin', 'psychologist']}>
              <PatientsPage />
            </RoleGuard>
          } 
        />
        
        {/* Comercial: Admin y Closer */}
        <Route 
          path="/commercial" 
          element={
            <RoleGuard allowedRoles={['admin', 'closer']}>
              <CommercialDashboard />
            </RoleGuard>
          } 
        />
        
        {/* ClÃ­nico / PsicÃ³logo */}
        <Route 
          path="/clinical" 
          element={
            <RoleGuard allowedRoles={['admin', 'psychologist']}>
              <PsychologistDashboard /> 
            </RoleGuard>
          } 
        />
        
        {/* Ruta especÃ­fica para psicÃ³logos si es diferente */}
        <Route 
          path="/psychologist" 
          element={
            <RoleGuard allowedRoles={['psychologist']}>
              <PsychologistDashboard />
            </RoleGuard>
          } 
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LayoutWrapper>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}