import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import Dashboard from './pages/admin/Dashboard';
import CommercialDashboard from './pages/commercial/Dashboard';
import ClinicalDashboard from './pages/clinical/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import { 
  LayoutDashboard, Users, Stethoscope, Briefcase, 
  LogOut, Menu, X, Activity 
} from 'lucide-react';
import { useState } from 'react';

// --- Componente de ProtecciÃ³n ---
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading, role } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// --- Sidebar Component ---
function Sidebar({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) {
  const { user, signOut, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/commercial', label: 'Comercial', icon: Briefcase, roles: ['admin', 'closer'] },
    { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'closer'] },
    { path: '/patients', label: 'Pacientes', icon: Activity, roles: ['admin', 'psychologist'] },
    { path: '/clinical', label: 'ClÃ­nico', icon: Stethoscope, roles: ['admin', 'psychologist'] },
    { path: '/psychologist', label: 'Mi GestiÃ³n', icon: Users, roles: ['psychologist'] },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={toggle} />}
      
      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block`}>
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white tracking-tight">Vantage<span className="text-blue-500">CRM</span></h1>
          <button onClick={toggle} className="md:hidden text-zinc-400"><X /></button>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            if (!item.roles.includes(role || '')) return null;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); if(window.innerWidth < 768) toggle(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-xs text-zinc-500 uppercase">{role}</p>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar SesiÃ³n
          </button>
        </div>
      </div>
    </>
  );
}

// --- Layout Principal ---
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null; // Manejado por rutas

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950">
          <button onClick={() => setSidebarOpen(true)} className="text-zinc-400"><Menu /></button>
          <span className="font-bold">Vantage CRM</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
          <Routes>
            <Route path="/" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/commercial" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><CommercialDashboard /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute allowedRoles={['admin', 'closer']}><LeadsPage /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><PatientsPage /></ProtectedRoute>} />
            <Route path="/clinical" element={<ProtectedRoute allowedRoles={['admin', 'psychologist']}><ClinicalDashboard /></ProtectedRoute>} />
            <Route path="/psychologist" element={<ProtectedRoute allowedRoles={['psychologist']}><PsychologistDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}