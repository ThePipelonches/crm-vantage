import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import Dashboard from './pages/admin/Dashboard';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

// 1. Componente para proteger rutas privadas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// 2. Componente principal que decide qué mostrar (Login o Dashboard)
function AppContent() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // CASO CRÍTICO: Si NO hay usuario, mostramos SOLO el Login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Si HAY usuario, mostramos la aplicación completa
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900">
        <h1 className="text-xl font-bold">Vantage CRM <span className="text-xs font-normal text-zinc-500">({role})</span></h1>
        <div className="flex gap-4 items-center">
          <nav className="flex gap-4 text-sm">
            {(role === 'admin' || role === 'closer') && (
              <button onClick={() => navigate('/leads')} className={`hover:text-white ${location.pathname === '/leads' ? 'text-white font-bold' : 'text-zinc-400'}`}>Leads</button>
            )}
            {(role === 'admin' || role === 'psychologist') && (
              <button onClick={() => navigate('/patients')} className={`hover:text-white ${location.pathname === '/patients' ? 'text-white font-bold' : 'text-zinc-400'}`}>Pacientes</button>
            )}
            {role === 'admin' && (
              <button onClick={() => navigate('/')} className={`hover:text-white ${location.pathname === '/' ? 'text-white font-bold' : 'text-zinc-400'}`}>Dashboard</button>
            )}
          </nav>
          <button onClick={signOut} className="text-xs bg-zinc-800 hover:bg-red-900 px-3 py-1 rounded">Salir</button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
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

// 3. Exportación por defecto con Providers
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}