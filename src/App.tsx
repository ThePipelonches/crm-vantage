import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-white p-10">Cargando...</div>;
  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando sistema...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header simple temporal */}
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">CRM Vantage</h1>
        <button onClick={() => window.location.reload()} className="text-sm text-zinc-400 hover:text-white">Salir</button>
      </header>
      
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<RoleGuard allowedRoles={['admin', 'closer']}><LeadsPage /></RoleGuard>} />
          <Route path="/patients" element={<RoleGuard allowedRoles={['admin', 'psychologist']}><PatientsPage /></RoleGuard>} />
          <Route path="/commercial" element={<RoleGuard allowedRoles={['admin', 'closer']}><CommercialDashboard /></RoleGuard>} />
          <Route path="/psychologist" element={<RoleGuard allowedRoles={['psychologist']}><PsychologistDashboard /></RoleGuard>} />
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