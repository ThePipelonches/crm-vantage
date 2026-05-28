import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import Dashboard from './pages/admin/Dashboard';

// 1. Componente de Rutas Protegidas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// 2. Componente Principal de la App (USO DE HOOKS AQUÍ)
function AppLayoutContent() {
  const { user, signOut } = useAuth(); // <--- ESTE USO REQUIERE ESTAR DENTRO DE AUTHPROVIDER
  const location = useLocation();

  if (!user) {
    // Si no hay usuario, mostramos login o redirigimos
    // Asumimos que tienes un LoginPage, si no, usa el div de abajo comentado
    return <Navigate to="/login" replace />;
    /* 
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-2xl font-bold mb-4">Vantage CRM</h1>
        <button onClick={() => window.location.href='/login'} className="px-4 py-2 bg-white text-black rounded">Ir a Login</button>
      </div>
    );
    */
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900 sticky top-0 z-50">
        <div className="font-bold text-lg">Vantage <span className="text-zinc-500 text-sm font-normal">| {user.role}</span></div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm text-zinc-400">
            {(user.role === 'admin' || user.role === 'closer') && (
              <a href="/leads" className={`hover:text-white ${location.pathname === '/leads' ? 'text-white' : ''}`}>Leads</a>
            )}
            {(user.role === 'admin' || user.role === 'psychologist') && (
              <a href="/patients" className={`hover:text-white ${location.pathname === '/patients' ? 'text-white' : ''}`}>Pacientes</a>
            )}
            {user.role === 'admin' && (
              <a href="/" className={`hover:text-white ${location.pathname === '/' ? 'text-white' : ''}`}>Dashboard</a>
            )}
          </nav>
          <button onClick={() => signOut()} className="text-xs bg-red-900/50 hover:bg-red-900 text-red-200 px-3 py-1 rounded border border-red-900">Salir</button>
        </div>
      </header>

      {/* Main Content */}
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

// 3. EXPORT DEFAULT: Envuelve TODO con AuthProvider y BrowserRouter
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider> 
        {/* AuthProvider debe estar AQUÍ ARRIBA, antes de cualquier componente que use useAuth */}
        <AppLayoutContent />
      </AuthProvider>
    </BrowserRouter>
  );
}