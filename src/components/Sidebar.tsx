import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
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
  { label: 'Setter', path: '/leads', icon: ClipboardList, roles: ['setter'] },
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

  const roleColor: Record<UserRole, string> = {
    setter: 'text-cyan-400',
    closer: 'text-amber-400',
    psychologist: 'text-blue-400',
    admin: 'text-emerald-400',
  };

  return (
    <aside className="w-64 bg-black border-r border-white/10 flex flex-col flex-shrink-0">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <span className="text-black font-bold text-sm">V</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Vantage</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Executive Wellness</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r-full" />}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">{user.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className={`text-[11px] ${roleColor[user.role]}`}>{roleLabel[user.role]}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
