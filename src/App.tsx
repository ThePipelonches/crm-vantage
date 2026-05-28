import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import Dashboard from './pages/admin/Dashboard';

// Componente para manejar la protección de rutas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Layout simple interno para evitar dependencias rotas
function AppContent() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        Cargando aplicación...
      </div>
    );
  }

  if (!user) {
    // Redirigir a login si no hay usuario (asegúrate de tener LoginPage o usa un fallback)
    // Si no tienes LoginPage creado, mostramos un mensaje simple o redirigimos a una ruta pública
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Bienvenido a Vantage CRM</h1>
        <p className="mb-4 text-zinc-400">Por favor inicia sesión.</p>
        {/* Botón simulado de login si no hay página de login */}
        <button onClick={() => window.location.href = '/login'} className="px-4 py-2 bg-white text-black rounded">
          Ir a Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900">
        <h1 className="text-xl font-bold">Vantage CRM <span className="text-xs font-normal text-zinc-500">({user.role})</span></h1>
        <div className="flex gap-4 items-center">
          <nav className="flex gap-2 text-sm">
            {(user.role === 'admin' || user.role === 'closer') && (
              <a href="/leads" className={`hover:text-white ${location.pathname === '/leads' ? 'text-white font-bold' : 'text-zinc-400'}`}>Leads</a>
            )}
            {(user.role === 'admin' || user.role === 'psychologist') && (
              <a href="/patients" className={`hover:text-white ${location.pathname === '/patients' ? 'text-white font-bold' : 'text-zinc-400'}`}>Pacientes</a>
            )}
            {user.role === 'admin' && (
              <a href="/" className={`hover:text-white ${location.pathname === '/' ? 'text-white font-bold' : 'text-zinc-400'}`}>Dashboard</a>
            )}
          </nav>
          <button onClick={() => signOut()} className="text-xs bg-zinc-800 hover:bg-red-900 px-3 py-1 rounded transition-colors">
            Salir
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="p-6">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/leads" element={
            <ProtectedRoute allowedRoles={['admin', 'closer']}>
              <LeadsPage />
            </ProtectedRoute>
          } />

          <Route path="/patients" element={
            <ProtectedRoute allowedRoles={['admin', 'psychologist']}>
              <PatientsPage />
            </ProtectedRoute>
          } />

          <Route path="/commercial" element={
            <ProtectedRoute allowedRoles={['admin', 'closer']}>
              <CommercialDashboard />
            </ProtectedRoute>
          } />

          <Route path="/psychologist" element={
            <ProtectedRoute allowedRoles={['psychologist']}>
              <PsychologistDashboard />
            </ProtectedRoute>
          } />

          {/* Ruta comodín para evitar errores de ruta no encontrada */}
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
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}