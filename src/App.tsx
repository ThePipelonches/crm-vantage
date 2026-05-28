import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage'; // ✅ Ruta corregida (sin carpeta auth)
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import Dashboard from './pages/admin/Dashboard';

// Componente de Protección de Rutas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// Contenido Principal de la App
function AppContent() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Iniciando...</div>;
  if (!user) return <LoginPage />; // ✅ Muestra el login si no hay usuario

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900 sticky top-0 z-50">
        <h1 className="text-xl font-bold text-white">Vantage CRM <span className="text-xs font-normal text-zinc-500">({user.role})</span></h1>
        <div className="flex gap-4 items-center">
          <nav className="hidden md:flex gap-4 text-sm">
            {(user.role === 'admin' || user.role === 'closer') && (
              <a href="/leads" className={`hover:text-white transition-colors ${location.pathname === '/leads' ? 'text-white font-bold border-b-2 border-white' : 'text-zinc-400'}`}>Leads</a>
            )}
            {(user.role === 'admin' || user.role === 'psychologist') && (
              <a href="/patients" className={`hover:text-white transition-colors ${location.pathname === '/patients' ? 'text-white font-bold border-b-2 border-white' : 'text-zinc-400'}`}>Pacientes</a>
            )}
            {user.role === 'admin' && (
              <a href="/" className={`hover:text-white transition-colors ${location.pathname === '/' ? 'text-white font-bold border-b-2 border-white' : 'text-zinc-400'}`}>Dashboard</a>
            )}
          </nav>
          <button onClick={() => signOut()} className="text-xs bg-red-900/50 hover:bg-red-900 text-red-200 px-3 py-1.5 rounded border border-red-800 transition-colors">
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}