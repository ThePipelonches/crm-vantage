import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { 
  Menu, X, LayoutDashboard, Users, Stethoscope, Briefcase, 
  LogOut, UserPlus, Activity, FileText 
} from 'lucide-react';

// PÃƒÂ¡ginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import ClinicalRecord from './pages/clinical/ClinicalRecord';

// Componente de ProtecciÃƒÂ³n de Rutas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading, role } = useAuth();

  // 1. Mientras carga, mostrar spinner y NO redirigir. Esperar pacientemente.
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-zinc-400 animate-pulse">Verificando sesión segura...</p>
      </div>
    );
  }

  // 2. Si NO hay usuario (y ya terminó de cargar), entonces sí redirigir al login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Verificar roles solo si hay usuario.
  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  // 4. Todo ok, mostrar contenido.
  return <>{children}</>;
}

  if (loading || user === null) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-zinc-400">Verificando sesiÃƒÂ³n...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Layout Principal con Sidebar
function MainLayout() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado del Sidebar con persistencia en localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_state');
    return saved ? JSON.parse(saved) : true;
  });

  // Guardar estado cuando cambia
  useEffect(() => {
    localStorage.setItem('sidebar_state', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  if (!user) return <Navigate to="/login" replace />;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'closer'] },
    { path: '/patients', label: 'Pacientes', icon: UserPlus, roles: ['admin', 'psychologist'] },
    { path: '/commercial', label: 'Comercial', icon: Briefcase, roles: ['admin', 'closer'] },
    { path: '/psychologist', label: 'Mi Panel', icon: Stethoscope, roles: ['psychologist'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(role || ''));

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'w-64' : 'w-20'} relative`}
      >
        {/* Header Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {isSidebarOpen && <h1 className="text-xl font-bold tracking-tight truncate">Vantage CRM</h1>}
          {!isSidebarOpen && <span className="text-xl font-bold mx-auto">V</span>}
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* MenÃƒÂº */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-white text-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  } ${!isSidebarOpen ? 'justify-center' : ''}`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <Icon size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Sidebar (Logout) */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => signOut()}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors
              ${!isSidebarOpen ? 'justify-center' : ''}`}
            title={!isSidebarOpen ? 'Cerrar SesiÃƒÂ³n' : ''}
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span>Cerrar SesiÃƒÂ³n</span>}
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-auto bg-black relative">
        <div className="p-6 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><LeadsPage /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><PatientsPage /></ProtectedRoute>} />
            <Route path="/commercial" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><CommercialDashboard /></ProtectedRoute>} />
            <Route path="/psychologist" element={<ProtectedRoute allowedRoles={['psychologist']}><PsychologistDashboard /></ProtectedRoute>} />
            {/* Ruta Historia ClÃƒÂ­nica */}
            <Route path="/clinical-record/:patientId" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><ClinicalRecord /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

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