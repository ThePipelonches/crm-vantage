import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary'; // Importar el paracaídas
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import Dashboard from './pages/admin/Dashboard';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

// ... (Mantén tus componentes ProtectedRoute y AppContent iguales que antes) ...
// Asegúrate de que AppContent maneje user null correctamente

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading, role } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Si no hay usuario, mostrar solo login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Si hay usuario, mostrar layout con dashboard
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

export default function App() {
  return (
    // ENVOLVER TODO CON ERRORBOUNDARY
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}