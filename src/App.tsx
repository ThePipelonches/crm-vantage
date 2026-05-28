import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import Dashboard from './pages/admin/Dashboard';
import LoginPage from './pages/LoginPage'; // Ruta corregida

// Componente de Protección de Rutas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Layout Principal Integrado (Sin dependencias externas rotas)
function MainLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Simple y Robusto */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">Vantage CRM</h1>
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 uppercase">{user.role}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-4 text-sm font-medium">
            {(user.role === 'admin' || user.role === 'closer') && (
              <button onClick={() => navigate('/leads')} className={`hover:text-white transition-colors ${location.pathname === '/leads' ? 'text-white' : 'text-zinc-400'}`}>Leads</button>
            )}
            {(user.role === 'admin' || user.role === 'psychologist') && (
              <button onClick={() => navigate('/patients')} className={`hover:text-white transition-colors ${location.pathname === '/patients' ? 'text-white' : 'text-zinc-400'}`}>Pacientes</button>
            )}
            {user.role === 'admin' && (
              <button onClick={() => navigate('/')} className={`hover:text-white transition-colors ${location.pathname === '/' ? 'text-white' : 'text-zinc-400'}`}>Dashboard</button>
            )}
          </nav>
          
          <div className="h-6 w-px bg-zinc-700 mx-2"></div>
          
          <button 
            onClick={() => signOut()} 
            className="text-xs font-medium bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 px-3 py-1.5 rounded transition-all border border-zinc-700"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Área de Contenido */}
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

// Punto de Entrada Principal
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública de Login fuera del Layout Principal */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Todas las demás rutas requieren auth y usan el Layout */}
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}