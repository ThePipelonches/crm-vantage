import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { 
  Menu, X, LogOut, LayoutDashboard, Users, Stethoscope, 
  Briefcase, Activity, UserPlus, ClipboardList 
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import Dashboard from './pages/admin/Dashboard';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import ClinicalRecord from './pages/clinical/ClinicalRecord';

// --- Componente de Protección de Rutas ---
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-zinc-400 animate-pulse">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// --- Layout Principal con Sidebar Corregido ---
function MainLayout() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado del Sidebar con persistencia
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_state');
      return saved ? JSON.parse(saved) : true;
    } catch { return true; }
  });

  // Guardar estado
  useEffect(() => {
    localStorage.setItem('sidebar_state', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  if (!user) return <Navigate to="/login" replace />;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/leads', label: 'Pipeline Leads', icon: Users, roles: ['admin', 'closer'] },
    { path: '/patients', label: 'Pacientes', icon: Stethoscope, roles: ['admin', 'psychologist'] },
    { path: '/commercial', label: 'Comercial', icon: Briefcase, roles: ['admin', 'closer'] },
    { path: '/psychologist', label: 'Mi Agenda', icon: Activity, roles: ['psychologist'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(role || ''));

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative z-30 h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-0 overflow-hidden'}
        `}
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between min-w-[16rem]">
          <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">Vantage CRM</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-w-[16rem]">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-white text-black shadow-md' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-zinc-500 group-hover:text-white'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 min-w-[16rem]">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.email?.split('@')[0]}</p>
              <p className="text-xs text-zinc-500 uppercase truncate">{role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Header Móvil / Toggle */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center px-6 shrink-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 mr-4 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h2 className="text-lg font-semibold text-white truncate">
            {filteredMenu.find(i => i.path === location.pathname)?.label || 'Dashboard'}
          </h2>
        </header>

        {/* Área de Scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Routes>
              <Route path="/" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><LeadsPage /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><PatientsPage /></ProtectedRoute>} />
              <Route path="/commercial" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><CommercialDashboard /></ProtectedRoute>} />
              <Route path="/psychologist" element={<ProtectedRoute allowedRoles={['psychologist']}><PsychologistDashboard /></ProtectedRoute>} />
              <Route path="/clinical-record/:patientId" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><ClinicalRecord /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- App Root ---
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