import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, Users, Calendar, Briefcase, 
  Stethoscope, LogOut, Menu, X 
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const role = user?.role;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'closer', 'psychologist'] },
    { path: '/leads', label: 'Pipeline de Leads', icon: Users, roles: ['admin', 'closer'] },
    { path: '/commercial', label: 'Ventas', icon: Briefcase, roles: ['admin', 'closer'] },
    { path: '/appointments', label: 'Citas Comerciales', icon: Calendar, roles: ['admin', 'closer'] },
    { path: '/clinical', label: 'Dashboard ClÃ­nico', icon: Stethoscope, roles: ['admin', 'psychologist'] },
    { path: '/clients', label: 'Pacientes', icon: Users, roles: ['admin', 'psychologist'] },
    { path: '/clinical-appointments', label: 'Citas ClÃ­nicas', icon: Calendar, roles: ['admin', 'psychologist'] },
    { path: '/admin-panel', label: 'AdministraciÃ³n', icon: LayoutDashboard, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(role || '')
  );

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-zinc-900 border-zinc-800 text-white">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-xl font-bold text-white tracking-tight">CRM Vantage</h1>
            <p className="text-xs text-zinc-500 mt-1 capitalize">{role}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-white text-black' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={signOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar SesiÃ³n
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}