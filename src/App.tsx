import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

// Componente de Protección de Roles
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

// Componente Principal de Rutas
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // Si no hay usuario, ir a Login (Asumimos que LoginPage existe o redirigimos a home si no)
  // Si no tienes LoginPage funcionando, podemos poner un mensaje simple o redirigir a una ruta pública
  // Por seguridad, si no hay user, mostramos un mensaje o redirigimos. 
  // Ajusta esto si tienes una página de login funcional.
  if (!user) {
     // Opción A: Redirigir a una ruta de login si existe
     // return <Navigate to="/login" replace />;
     
     // Opción B (Segura temporal): Mostrar mensaje si no hay login implementado aún
     return (
       <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white space-y-4">
         <h1 className="text-2xl font-bold">Bienvenido a Vantage CRM</h1>
         <p className="text-zinc-400">Por favor inicia sesión.</p>
         {/* Aquí iría tu botón de Login si tuvieras la página */}
       </div>
     );
  }

  // Layout Simple (Reemplaza a AppLayout para evitar errores de children)
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Barra de navegación simple o Header podría ir aquí */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Vantage CRM</h1>
        <button 
          onClick={() => window.location.href = '/'} // Logout simple recargando o usando auth si está disponible
          className="text-sm text-zinc-400 hover:text-white"
        >
          Salir
        </button>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
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
      </main>
    </div>
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