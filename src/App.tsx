import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

// Componente de Protección de Rutas por Rol
function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Layout Simple Interno (Reemplaza a AppLayout para evitar errores)
function SimpleLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login'); // Ajusta si tu login está en otra ruta
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">CRM Vantage</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{user?.email}</span>
          <button 
            onClick={handleLogout}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
      
      {/* Contenido Principal */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}

// Componente principal de Rutas
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    // Redirigir a login si no hay usuario (Asegúrate de tener una página de login o usa un fallback)
    // Si no tienes LoginPage creada, mostramos un mensaje o redirigimos a home
    return <Navigate to="/" replace />; 
  }

  return (
    <SimpleLayout>
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
        
        {/* Pacientes: Admin y Psicólogo */}
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
        
        {/* Psicólogo: Solo Psicólogo */}
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
    </SimpleLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}