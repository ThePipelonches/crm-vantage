import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, Users, Calendar, Briefcase, 
  Stethoscope, LogOut, Menu, X 
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function Sidebar() {
  const { user, signOut } = useAuth(); // Asegúrate que tu hook exporte signOut
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true); // Abierto por defecto en desktop

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

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(role || '')
  );

  return (
    <>
      {/* Botón Móvil (Siempre visible en móvil) */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Container */}
      {/* En Desktop (lg): Siempre visible, controlado por estado isOpen solo para animación si quisiéramos colapsarlo totalmente, 
          pero para este diseño simple, lo dejamos fijo en desktop y toggle en móvil. 
          NOTA: Para que el margen del layout funcione bien, en desktop asumimos ancho fijo 64 (16rem). */}
      
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white tracking-tight">CRM Vantage</h1>
            {/* Botón cerrar solo visible en móvil dentro del sidebar */}
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-2 border-b border-zinc-800/50">
             <p className="text-xs text-zinc-500 capitalize truncate">{role || 'Usuario'}</p>
             <p className="text-xs text-zinc-600 truncate">{user?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)} // Cerrar en móvil al hacer click
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white text-black shadow-md shadow-white/10' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'stroke-2' : ''}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer / Logout */}
          <div className="p-4 border-t border-zinc-800 bg-black/50">
            <button
              onClick={signOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}