import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, Users, Calendar, Briefcase, 
  Stethoscope, LogOut, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function Sidebar() {
  const { user, signOut } = useAuth(); // Asumiendo signOut, si es logout avisa
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const role = user?.role;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'closer', 'psychologist'] },
    { path: '/leads', label: 'Pipeline de Leads', icon: Users, roles: ['admin', 'closer'] },
    { path: '/commercial', label: 'Ventas', icon: Briefcase, roles: ['admin', 'closer'] },
    { path: '/appointments', label: 'Citas Comerciales', icon: Calendar, roles: ['admin', 'closer'] },
    { path: '/clinical', label: 'Dashboard Clínico', icon: Stethoscope, roles: ['admin', 'psychologist'] },
    { path: '/clients', label: 'Pacientes', icon: Users, roles: ['admin', 'psychologist'] },
    { path: '/clinical-appointments', label: 'Citas Clínicas', icon: Calendar, roles: ['admin', 'psychologist'] },
    { path: '/admin-panel', label: 'Administración', icon: LayoutDashboard, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role || ''));

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)} className="bg-zinc-900 border-zinc-800 text-white">
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-40 bg-black border-r border-zinc-800 transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        {/* Header con Toggle Collapsible (Solo Desktop) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {!isCollapsed && <h1 className="text-lg font-bold text-white whitespace-nowrap overflow-hidden">CRM Vantage</h1>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex text-zinc-400 hover:text-white mx-auto">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          {isCollapsed && <div className="mx-auto"><Menu size={20} className="text-white"/></div>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group relative ${
                  isActive ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                
                {/* Tooltip cuando está colapsado */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-zinc-700">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-2 border-t border-zinc-800">
          <button onClick={() => signOut && signOut()} className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Overlay Mobile */}
      {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />}
      
      {/* Spacer para empujar el contenido principal cuando el sidebar está abierto en mobile o colapsado en desktop */}
      <div className={`lg:hidden h-16 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}></div>
    </>
  );
}