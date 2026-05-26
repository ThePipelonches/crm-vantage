import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
// import ClinicalDashboard from './pages/clinical/Dashboard'; // Comentado si no existe
// import LoginPage from './pages/auth/LoginPage'; // Comentado si no existe

// Componente de Protección de Roles Simplificado
function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="flex h-screen items-center justify-center text-white">Cargando...</div>;
  
  if (!user) {
    // Si no hay usuario, cerramos sesión (limpia estado) y redirigimos al login o home
    // Asumimos que el login se maneja en otro lado o es una ruta pública si existiera
    logout(); 
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role || '')) {
    return <div className="flex h-screen items-center justify-center text-white">Acceso Denegado</div>;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center text-white">Iniciando...</div>;

  // Si no hay usuario, mostramos una vista simple de "Login" (o redirigimos si tuvieras LoginPage)
  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="text-3xl font-bold mb-4">CRM Vantage</h1>
        <p className="mb-6">Por favor inicia sesión.</p>
        <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-white text-black rounded">Ir al Login</button>
      </div>
    );
  }

  // Renderizado de Rutas
  return (
    <div className="min-h-screen bg-black text-white">
       {/* Aquí podrías envolver con Sidebar/TopBar si AppLayout no funciona */}
       {/* Si tienes un componente Sidebar separado, impórtalo y úsalo aquí */}
       
       <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Leads: Admin y Closer */}
        <Route 
          path="/leads" 
          element={
            <RoleGuard allowedRoles={['admin', 'closer']}>
              <LeadsPage />
            </RoleGuard>
          } 
        />

        {/* Pacientes: Admin y Psychologist */}
        <Route 
          path="/patients" 
          element={
            <RoleGuard allowedRoles={['admin', 'psychologist']}>
              <PatientsPage />
            </RoleGuard>
          } 
        />

        {/* Comercial: Admin y Closer */}
        <Route 
          path="/commercial" 
          element={
            <RoleGuard allowedRoles={['admin', 'closer']}>
              <CommercialDashboard />
            </RoleGuard>
          } 
        />

        {/* Psicólogo: Solo Psychologist */}
        <Route 
          path="/psychologist" 
          element={
            <RoleGuard allowedRoles={['psychologist']}>
              <PsychologistDashboard />
            </RoleGuard>
          } 
        />

        {/* Clínico: Comentado si no existe el archivo Dashboard */}
        {/* 
        <Route 
          path="/clinical" 
          element={
            <RoleGuard allowedRoles={['admin', 'psychologist']}>
              <ClinicalDashboard />
            </RoleGuard>
          } 
        /> 
        */}

        {/* Ruta comodín */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}