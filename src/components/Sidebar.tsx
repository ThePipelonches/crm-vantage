import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  DollarSign,
  Users,
  Brain,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Target,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/setter', icon: LayoutDashboard, roles: ['setter'] },
  { label: 'Leads', path: '/leads', icon: ClipboardList, roles: ['setter'] },
  { label: 'Consultas', path: '/appointments', icon: CalendarDays, roles: ['setter'] },
  { label: 'Dashboard Comercial', path: '/commercial', icon: DollarSign, roles: ['closer', 'admin'] },
  { label: 'Closers', path: '/closers', icon: Target, roles: ['closer', 'admin'] },
  { label: 'Dashboard Clínico', path: '/clinical', icon: Brain, roles: ['psychologist', 'admin'] },
  { label: 'Clientes', path: '/clients', icon: Users, roles: ['psychologist', 'admin'] },
  { label: 'Panel Admin', path: '/admin', icon: ShieldCheck, roles: ['admin'] },
];

export function Sidebar() {
  const { user, logout, hasAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const filteredItems = navItems.filter((item) => hasAccess(item.roles));

  const roleLabel: Record<UserRole, string> = {
    setter: 'Setter',
    closer: 'Closer',
    psychologist: 'Psicólogo',
    admin: 'Administrador',
  };

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col flex-shrink-0 hidden lg:flex">

      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-lg font-semibold">Vantage</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded ${
                isActive ? 'bg-secondary' : ''
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4">
        <button onClick={logout} className="flex gap-2">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}