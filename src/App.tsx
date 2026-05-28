import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// Componente Principal de la Aplicación (Dentro del Provider)
function AppContent() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Si no hay usuario, mostrar Login directamente
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoginPage />
      </div>
    );
  }

  // Si hay usuario, mostrar Layout con Navegación
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Vantage CRM</h1>
          <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{user.role}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-4 text-sm">
            {(user.role === 'admin' || user.role === 'closer') && (
              <a href="/leads" className={`hover:text-white transition ${location.pathname === '/leads' ? 'text-white font-bold' : 'text-zinc-400'}`}>Leads</a>
            )}
            {(user.role === 'admin' || user.role === 'psychologist') && (
              <a href="/patients" className={`hover:text-white transition ${location.pathname === '/patients' ? 'text-white font-bold' : 'text-zinc-400'}`}>Pacientes</a>
            )}
            {user.role === 'admin' && (
              <a href="/" className={`hover:text-white transition ${location.pathname === '/' ? 'text-white font-bold' : 'text-zinc-400'}`}>Dashboard</a>
            )}
          </nav>
          
          <button onClick={() => signOut()} className="text-xs bg-red-900/50 hover:bg-red-900 text-red-200 px-3 py-1.5 rounded transition-colors border border-red-900">
            Salir
          </button>
        </div>
      </header>

      {/* Contenido de las Rutas */}
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

// Exportación por defecto con Providers
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}