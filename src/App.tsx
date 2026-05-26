import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import { AppLayout } from './layouts/AppLayout';

// Admin & General
import Dashboard from './pages/admin/Dashboard';

// Leads Pipeline (Compartido Admin/Commercial)
import LeadsPage from './pages/leads/Leads';

// Commercial
import CommercialDashboard from './pages/commercial/Dashboard';
import CommercialAppointments from './pages/commercial/appointments';

// Psychologist
import ClinicalDashboard from './pages/psychologist/Dashboard';
import ClientsPage from './pages/psychologist/Clients';
import ClinicalAppointments from './pages/psychologist/ClinicalAppointments';

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
  </div>
);

function RoleProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/login" replace />} />
      <Route path="/" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        
        {/* Leads Pipeline */}
        <Route 
          path="leads" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'closer']}>
              <LeadsPage />
            </RoleProtectedRoute>
          } 
        />
        
        {/* Commercial Routes */}
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
        
        {/* Psychologist Routes */}
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
        
        {/* Admin Only */}
        <Route 
          path="admin-panel" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </RoleProtectedRoute>
          } 
        />
      </Route>
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