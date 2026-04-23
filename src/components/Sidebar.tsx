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
      
      {/* LOGO */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">V</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Vantage</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Executive Wellness
            </p>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <item.icon className="w-4 h-4" />

              <span className="flex-1 text-left">{item.label}</span>

              {isActive && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* USER */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">
              {user.name.charAt(0)}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {roleLabel[user.role]}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
