import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  DollarSign,
  Users,
  Brain,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/button';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isSetter = user.role === 'setter';
  const isCloser = user.role === 'closer';
  const isPsychologist = user.role === 'psychologist';

  let menuItems = [];

  if (isAdmin) {
    menuItems = [
      // Quitamos Dashboard General. El admin empieza en Comercial o Panel Admin.
      { label: 'Panel Admin', path: '/admin-panel', icon: ShieldCheck }, 
      { label: 'Leads (Todos)', path: '/leads', icon: ClipboardList },
      { label: 'Dashboard Comercial', path: '/commercial', icon: DollarSign },
      { label: 'Citas Comerciales', path: '/appointments', icon: CalendarDays },
      { label: 'Dashboard Clínico', path: '/clinical', icon: Brain },
      { label: 'Pacientes', path: '/clients', icon: Users },
      { label: 'Citas Clínicas', path: '/clinical-appointments', icon: CalendarDays },
    ];
  } else if (isSetter) {
    menuItems = [
      { label: 'Mis Leads', path: '/leads', icon: ClipboardList },
    ];
  } else if (isCloser) {
    menuItems = [
      { label: 'Dashboard Comercial', path: '/commercial', icon: DollarSign },
      { label: 'Mis Leads', path: '/leads', icon: ClipboardList },
      { label: 'Mis Citas', path: '/appointments', icon: CalendarDays },
    ];
  } else if (isPsychologist) {
    menuItems = [
      { label: 'Dashboard Clínico', path: '/clinical', icon: Brain },
      { label: 'Mis Pacientes', path: '/clients', icon: Users },
      { label: 'Mis Citas', path: '/clinical-appointments', icon: CalendarDays },
    ];
  }

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col hidden lg:flex h-screen">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white tracking-tight">VANTAGE</h1>
        <p className="text-xs text-zinc-500 mt-1 uppercase font-mono">
          {user.role} | {user.full_name?.split(' ')[0] || 'User'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-900"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}