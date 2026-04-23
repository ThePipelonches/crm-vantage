import { useLocation } from 'react-router-dom';
import { Bell, Clock, Menu } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/setter': 'Dashboard Comercial',
  '/leads': 'Solicitudes de Contacto',
  '/appointments': 'Consultas Agendadas',
  '/clinical': 'Dashboard Clínico',
  '/clients': 'Expedientes Ejecutivos',
  '/admin': 'Panel de Administración',
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'Vantage';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-black/80 backdrop-blur-md flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors -ml-1.5"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-sm font-medium text-white/90">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeStr}</span>
          <span className="text-white/20">|</span>
          <span className="capitalize">{dateStr}</span>
        </div>
        <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </button>
      </div>
    </header>
  );
}
