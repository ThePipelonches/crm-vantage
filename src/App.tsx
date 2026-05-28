import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Menu, X, LogOut, UserPlus, Users, Briefcase, Activity, Home } from 'lucide-react';

// Páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import ClinicalRecord from './pages/clinical/ClinicalRecord';

// Componente de Protección
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading, role } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Layout Principal con Sidebar
function AppLayout() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sidebar_open', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  if (!user) return <Navigate to="/login" replace />;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <Home className="w-5 h-5" />, roles: ['admin'] },
    { path: '/leads', label: 'Leads', icon: <Users className="w-5 h-5" />, roles: ['admin', 'closer'] },
    { path: '/patients', label: 'Pacientes', icon: <UserPlus className="w-5 h-5" />, roles: ['admin', 'psychologist'] },
    { path: '/commercial', label: 'Comercial', icon: <Briefcase className="w-5 h-5" />, roles: ['admin', 'closer'] },
    { path: '/psychologist', label: 'Mi Panel', icon: <Activity className="w-5 h-5" />, roles: ['psychologist'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(role || ''));

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight">Vantage CRM</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenu.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-white text-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : ''}`}>
        {/* Header Móvil */}
        <header className="md:hidden h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
          <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold">Vantage CRM</span>
          <div className="w-6"></div>
        </header>

        {/* Área de Rutas */}
        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
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
      
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}