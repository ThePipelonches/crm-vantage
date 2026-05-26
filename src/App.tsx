import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import { AppLayout } from './layouts/AppLayout';

// Componente de protección simple
function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-white p-10">Cargando...</div>;
  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();

  // Si no hay usuario, mostrar Login (Asumiendo que tienes un Login simple o redireccionas)
  // Si no tienes LoginPage importable, usamos un div simple o redireccionamos externo
  if (!user) {
     // Fallback simple si no hay LoginPage importado
     return (
       <div className="min-h-screen bg-black flex items-center justify-center text-white">
         <div className="text-center">
           <h1 className="text-2xl font-bold mb-4">CRM Vantage</h1>
           <p>Inicia sesión para continuar.</p>
           {/* Aquí podrías poner un botón que llame a window.location.href para login externo si es necesario */}
         </div>
       </div>
     );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<RoleGuard allowedRoles={['admin', 'closer']}><LeadsPage /></RoleGuard>} />
        <Route path="/patients" element={<RoleGuard allowedRoles={['admin', 'psychologist']}><PatientsPage /></RoleGuard>} />
        <Route path="/commercial" element={<RoleGuard allowedRoles={['admin', 'closer']}><CommercialDashboard /></RoleGuard>} />
        {/* Ruta clínica simplificada usando el dashboard de psicólogo si no existe el específico */}
        <Route path="/clinical" element={<RoleGuard allowedRoles={['admin', 'psychologist']}><PsychologistDashboard /></RoleGuard>} /> 
        <Route path="/psychologist" element={<RoleGuard allowedRoles={['psychologist']}><PsychologistDashboard /></RoleGuard>} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}