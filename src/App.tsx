import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { 
  LayoutDashboard, Users, Stethoscope, Briefcase, 
  Menu, X, LogOut, Activity, FileText 
} from 'lucide-react';

// Páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import ClinicalRecord from './pages/clinical/ClinicalRecord';

// --- Componente de Protección de Rutas ---
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading, role } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// --- Layout Principal con Sidebar Funcional ---
function MainLayout() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado del Sidebar con persistencia en localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    return saved ? JSON.parse(saved) : true;
  });

  // Guardar estado cada vez que cambia
  useEffect(() => {
    localStorage.setItem('sidebar_open', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  if (!user) return <Navigate to="/login" replace />;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'closer'] },
    { path: '/patients', label: 'Pacientes', icon: Activity, roles: ['admin', 'psychologist'] },
    { path: '/commercial', label: 'Comercial', icon: Briefcase, roles: ['admin', 'closer'] },
    { path: '/psychologist', label: 'Psicólogo', icon: Stethoscope, roles: ['psychologist'] },
  ];

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header del Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {isSidebarOpen && <span className="font-bold text-lg truncate">Vantage CRM</span>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {menuItems.map((item) => {
            if (!item.roles.includes(role || '')) return null;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors relative ${
                  isActive 
                    ? 'text-white bg-zinc-800 border-r-2 border-white' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">{item.label}</span>}
                {!isSidebarOpen && isActive && (
                  <div className="absolute left-14 bg-white text-black text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Botón Cerrar Sesión (Abajo) */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={signOut}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors ${
              !isSidebarOpen && 'justify-center'
            }`}
            title={!isSidebarOpen ? "Cerrar Sesión" : ""}
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-auto bg-black relative">
        <Routes>
          <Route path="/" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><LeadsPage /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><PatientsPage /></ProtectedRoute>} />
          <Route path="/commercial" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><CommercialDashboard /></ProtectedRoute>} />
          <Route path="/psychologist" element={<ProtectedRoute allowedRoles={['psychologist']}><PsychologistDashboard /></ProtectedRoute>} />
          <Route path="/clinical-record/:patientId" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><ClinicalRecord /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// --- App Principal ---
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}