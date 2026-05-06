import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import { AppLayout } from './layouts/AppLayout';

// Admin & General
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/setter/Leads';

// Commercial
import CommercialDashboard from './pages/commercial/Dashboard';
import CommercialAppointments from './pages/commercial/appointments';

// Psychologist
import ClinicalDashboard from './pages/psychologist/Dashboard';
import ClientsPage from './pages/psychologist/Clients';
import ClinicalAppointments from './pages/psychologist/ClinicalAppointments';

// Componente de carga
const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
  </div>
);

// Componente para proteger rutas específicas por rol (Seguridad Extra)
function RoleProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    // Si no tiene permiso, lo mandamos a su dashboard por defecto o al home
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route 
        path="/login" 
        element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
      />

      {/* Rutas Protegidas (Layout Principal) */}
      <Route 
        path="/" 
        element={user ? <AppLayout /> : <Navigate to="/login" replace />}
      >
        {/* Dashboard por defecto (Redirige según rol en el futuro, ahora muestra Admin o el que corresponda) */}
        <Route index element={<Dashboard />} />
        
        {/* Leads (Compartido: Admin, Setter, Closer) */}
        <Route path="leads" element={<LeadsPage />} />
        
        {/* Rutas Comerciales (Admin, Closer) */}
        <Route 
          path="commercial" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'closer']}>
              <CommercialDashboard />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="appointments" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'closer']}>
              <CommercialAppointments />
            </RoleProtectedRoute>
          } 
        />
        
        {/* Rutas Clínicas (Admin, Psychologist) */}
        <Route 
          path="clinical" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'psychologist']}>
              <ClinicalDashboard />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="clients" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'psychologist']}>
              <ClientsPage />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="clinical-appointments" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'psychologist']}>
              <ClinicalAppointments />
            </RoleProtectedRoute>
          } 
        />
        
        {/* Panel Admin (Solo Admin) */}
        <Route 
          path="admin-panel" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </RoleProtectedRoute>
          } 
        />
      </Route>

      {/* Catch-all: Redirigir a home o login según estado */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}