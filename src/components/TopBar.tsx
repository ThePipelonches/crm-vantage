import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Clock, Menu, Search, User } from 'lucide-react';
import { useState } from 'react';

const routeTitles: Record<string, string> = {
  '/setter': 'Dashboard Comercial',
  '/leads': 'Solicitudes de Contacto',
  '/appointments': 'Consultas Agendadas',
  '/commercial': 'Dashboard Comercial',
  '/clinical': 'Dashboard Clínico',
  '/clients': 'Expedientes Ejecutivos',
  '/admin': 'Panel de Administración',
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const title = routeTitles[location.pathname] || 'Vantage';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateStr = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 md:px-8 bg-background sticky top-0 z-40">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        <h2 className="text-sm sm:text-base font-medium text-foreground">
          {title}
        </h2>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* SEARCH */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10 w-40 md:w-64"
          />
        </div>

        {/* TIME */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeStr}</span>
          <span className="opacity-30">|</span>
          <span className="capitalize">{dateStr}</span>
        </div>

        {/* NOTIFICATIONS */}
        <button className="relative p-2 rounded-md hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* USER */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary transition-colors">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>

          <span className="hidden md:block text-sm font-medium text-foreground">
            {user?.name || 'Usuario'}
          </span>
        </div>
      </div>
    </header>
  );
}