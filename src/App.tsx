import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout'; // Importación corregida (named)
import { useAuth } from './hooks/useAuth';

// Páginas existentes (Ajusta si faltan algunas)
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard'; // Asumiendo que existe
import PsychologistDashboard from './pages/psychologist/Dashboard'; // Asumiendo que existe
import LoginPage from './pages/auth/LoginPage'; // Verifica que este archivo exista

// Componentes de Protección (Si no existen, crearemos unos simples abajo o usaremos lógica directa)
// Para este ejemplo, asumiremos que usas lógica directa en el Route si los componentes fallan.
// Pero primero intentemos importar los que deberías tener.
import ProtectedRoute from './components/ProtectedRoute'; 
import RoleProtectedRoute from './components/RoleProtectedRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Cargando CRM...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={
             user?.role === 'admin' ? <Dashboard /> : 
             user?.role === 'closer' ? <CommercialDashboard /> : 
             user?.role === 'psychologist' ? <PsychologistDashboard /> : 
             <Navigate to="/login" />
          } />
          
          <Route path="leads" element={<RoleProtectedRoute allowedRoles={['admin', 'closer']}><LeadsPage /></RoleProtectedRoute>} />
          <Route path="patients" element={<RoleProtectedRoute allowedRoles={['admin', 'psychologist']}><PatientsPage /></RoleProtectedRoute>} />
          
          <!-- Agrega aquí otras rutas que tengas (commercial, clinical, etc.) -->
          <Route path="commercial" element={<RoleProtectedRoute allowedRoles={['admin', 'closer']}><CommercialDashboard /></RoleProtectedRoute>} />
          <Route path="clinical" element={<RoleProtectedRoute allowedRoles={['admin', 'psychologist']}><PsychologistDashboard /></RoleProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;