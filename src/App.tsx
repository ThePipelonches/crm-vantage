import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth'; // Ajustado a tu hook real
import { ProtectedRoute } from './components/ProtectedRoute'; 
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import AppLayout from './layouts/AppLayout';

// Páginas Reales confirmadas
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage'; // Unificada
import CommercialDashboard from './pages/commercial/Dashboard';
import ClinicalDashboard from './pages/clinical/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            
            {/* Admin & Closer */}
            <Route path="leads" element={<RoleProtectedRoute allowedRoles={['admin', 'closer']}><LeadsPage /></RoleProtectedRoute>} />
            
            {/* Admin & Psychologist & Closer (Unificado en Patients) */}
            <Route path="patients" element={<RoleProtectedRoute allowedRoles={['admin', 'psychologist', 'closer']}><PatientsPage /></RoleProtectedRoute>} />
            
            {/* Commercial */}
            <Route path="commercial" element={<RoleProtectedRoute allowedRoles={['admin', 'closer']}><CommercialDashboard /></RoleProtectedRoute>} />
            
            {/* Clinical / Psychologist */}
            <Route path="clinical" element={<RoleProtectedRoute allowedRoles={['admin', 'psychologist']}><ClinicalDashboard /></RoleProtectedRoute>} />
            <Route path="psychologist" element={<RoleProtectedRoute allowedRoles={['admin', 'psychologist']}><PsychologistDashboard /></RoleProtectedRoute>} />
            
            {/* Admin Only */}
            <Route path="admin-panel" element={<RoleProtectedRoute allowedRoles={['admin']}><Dashboard /></RoleProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;