import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import Dashboard from './pages/admin/Dashboard';

// Componente interno para manejar la lógica de la app UNA VEZ autenticado
function AppLayout() {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900 sticky top-0 z-50">
        <div className="font-bold text-lg tracking-tight">VANTAGE CRM</div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-4 text-sm font-medium">
            {(user.role === 'admin' || user.role === 'closer') && (
              <a href="/leads" className={location.pathname === '/leads' ? 'text-white' : 'text-zinc-400 hover:text-white'}>Leads</a>
            )}
            {(user.role === 'admin' || user.role === 'psychologist') && (
              <a href="/patients" className={location.pathname === '/patients' ? 'text-white' : 'text-zinc-400 hover:text-white'}>Pacientes</a>
            )}
            {user.role === 'admin' && (
              <a href="/" className={location.pathname === '/' ? 'text-white' : 'text-zinc-400 hover:text-white'}>Dashboard</a>
            )}
          </nav>
          <button onClick={() => signOut()} className="text-xs bg-zinc-800 hover:bg-red-900 px-3 py-1.5 rounded transition-colors border border-zinc-700">
            Salir
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={user.role === 'admin' ? <Dashboard /> : <Navigate to="/leads" replace />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/commercial" element={<CommercialDashboard />} />
          <Route path="/psychologist" element={<PsychologistDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Componente Login separado
function LoginPageWrapper() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  
  // Renderizado simple de Login si no tienes componente LoginPage externo
  // Si tienes uno, descomenta la línea de abajo e importa el componente
  // return <LoginPage />; 
  
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-2">Vantage CRM</h1>
      <p className="text-zinc-400 mb-8">Inicia sesión para continuar</p>
      <div className="text-sm text-zinc-500">Redirigiendo al login...</div>
      {/* Aquí deberías llamar a tu componente real de login si existe */}
      <button onClick={() => window.location.href='/login'} className="mt-4 px-6 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200">
        Ir a Login
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider envuelve TODO para que useAuth funcione en cualquier lado */}
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPageWrapper />} />
          {/* Todas las demás rutas están protegidas dentro de AppLayout que usa useAuth */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}