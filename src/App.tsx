import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Importar páginas existentes (Solo las que sabemos que existen)
import LoginPage from './pages/auth/LoginPage'; // Asegúrate de que este archivo exista, si no, crea uno básico
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

// Componente de Protección de Rutas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// Componente Principal de Rutas (Dentro del contexto)
function AppRoutes() {
  const { user } = useAuth();

  // Si no hay usuario, mostrar solo Login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Si hay usuario, mostrar Dashboard y Rutas Protegidas
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 p-4 flex justify-between items-center bg-zinc-900">
        <h1 className="text-xl font-bold">Vantage CRM</h1>
        <button onClick={() => window.location.reload()} className="text-xs bg-zinc-800 px-3 py-1 rounded">Recargar</button>
      </header>

      <main className="p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          
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