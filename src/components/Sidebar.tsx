import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, Users, Calendar, Briefcase, 
  Stethoscope, LogOut, Menu, X 
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const role = user?.role;

  const menuItems = [
    // Todos ven Dashboard
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'closer', 'psychologist'] },
    
    // Admin y Closer ven Leads y Comercial
    { path: '/leads', label: 'Pipeline de Leads', icon: Users, roles: ['admin', 'closer'] },
    { path: '/commercial', label: 'Ventas', icon: Briefcase, roles: ['admin', 'closer'] },
    { path: '/appointments', label: 'Citas Comerciales', icon: Calendar, roles: ['admin', 'closer'] },
    
    // Admin y Psicólogo ven Clínico
    { path: '/clinical', label: 'Dashboard Clínico', icon: Stethoscope, roles: ['admin', 'psychologist'] },
    { path: '/clients', label: 'Pacientes', icon: Users, roles: ['admin', 'psychologist'] },
    { path: '/clinical-appointments', label: 'Citas Clínicas', icon: Calendar, roles: ['admin', 'psychologist'] },
    
    // Solo Admin
    { path: '/admin-panel', label: 'Administración', icon: LayoutDashboard, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(role || '')
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-zinc-900 border-zinc-800 text-white">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <div className={ixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 }>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-xl font-bold text-white tracking-tight">CRM Vantage</h1>
            <p className="text-xs text-zinc-500 mt-1 capitalize">{role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={lex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer / Logout */}
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}