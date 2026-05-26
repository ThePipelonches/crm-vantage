import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import ClinicalDashboard from './pages/clinical/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

// Componente de Protección de Rutas por Rol
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Componente Principal de Rutas (Debe estar dentro de AuthProvider)
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no hay usuario, mostrar solo Login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Si hay usuario, mostrar la App con Layout simple
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Aquí iría tu Sidebar/TopBar si los importas aquí, o usas un Layout simple */}
      {/* Por ahora, renderizamos directo para evitar errores de componentes rotos */}
      
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        
        {/* Admin & Closer */}
        <Route path="/leads" element={
          <ProtectedRoute allowedRoles={['admin', 'closer']}>
            <LeadsPage />
          </ProtectedRoute>
        } />
        <Route path="/commercial" element={
          <ProtectedRoute allowedRoles={['admin', 'closer']}>
            <CommercialDashboard />
          </ProtectedRoute>
        } />

        {/* Admin & Psychologist */}
        <Route path="/patients" element={
          <ProtectedRoute allowedRoles={['admin', 'psychologist']}>
            <PatientsPage />
          </ProtectedRoute>
        } />
        <Route path="/clinical" element={
          <ProtectedRoute allowedRoles={['admin', 'psychologist']}>
            <ClinicalDashboard />
          </ProtectedRoute>
        } />

        {/* Solo Psychologist */}
        <Route path="/psychologist" element={
          <ProtectedRoute allowedRoles={['psychologist']}>
            <PsychologistDashboard />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// Componente Login separado para evitar ciclos
function LoginPage() {
  // Importamos dinámicamente o asumimos que existe en pages/auth
  // Si no tienes LoginPage.tsx, usa un placeholder temporal
  const LoginComp = () => {
     // Placeholder simple si no existe el archivo aún
     return (
       <div className="h-screen flex items-center justify-center bg-zinc-950">
         <div className="text-center">
           <h1 className="text-4xl font-bold text-white mb-4">Vantage CRM</h1>
           <p className="text-zinc-400">Por favor inicia sesión (Componente Login pendiente)</p>
           <button onClick={() => window.location.href='/'} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Ir al Home</button>
         </div>
       </div>
     )
  };
  
  // Intenta importar tu LoginPage real si existe
  try {
    // Nota: En un entorno real harías import dynamic, aquí usamos el placeholder seguro
    return <LoginComp />;
  } catch {
    return <LoginComp />;
  }
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