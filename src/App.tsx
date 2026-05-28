import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import Dashboard from './pages/admin/Dashboard';

// Componente de Protección de Rutas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Layout Principal (Solo se renderiza si hay usuario)
function MainLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">Vantage CRM</h1>
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 uppercase">{user.role}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-4 text-sm font-medium">
            {(user.role === 'admin' || user.role === 'closer') && (
              <a href="/leads" className={`transition-colors ${location.pathname === '/leads' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Leads</a>
            )}
            {(user.role === 'admin' || user.role === 'psychologist') && (
              <a href="/patients" className={`transition-colors ${location.pathname === '/patients' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Pacientes</a>
            )}
            {user.role === 'admin' && (
              <a href="/" className={`transition-colors ${location.pathname === '/' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Dashboard</a>
            )}
          </nav>
          
          <button onClick={() => signOut()} className="text-xs bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-200 px-3 py-1.5 rounded transition-all border border-zinc-700">
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Routes>
          <Route path="/" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><LeadsPage /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><PatientsPage /></ProtectedRoute>} />
          <Route path="/commercial" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><CommercialDashboard /></ProtectedRoute>} />
          <Route path="/psychologist" element={<ProtectedRoute allowedRoles={['psychologist']}><PsychologistDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Punto de entrada de la App
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Componente interno para decidir qué mostrar (Login o App)
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-zinc-500 text-sm">Iniciando sesión...</p>
      </div>
    );
  }

  if (!user) {
    // Si no hay usuario, mostramos un login simple o redirigimos
    // Asumiendo que tienes una página de login, si no, usa este fallback:
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-3xl font-bold mb-2">Vantage CRM</h1>
        <p className="text-zinc-400 mb-8">Inicia sesión para continuar</p>
        {/* Botón forzado de login si la ruta /login no existe o falla */}
        <button 
          onClick={() => window.location.href = '/login'} 
          className="px-6 py-3 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors"
        >
          Ir al Login
        </button>
      </div>
    );
  }

  // Si hay usuario, mostramos la app principal
  return <MainLayout />;
}