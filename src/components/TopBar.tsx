import { Bell, Menu, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { subscribeToNewLeads, checkUrgentLeads } from '../services/notifications';
import { useAuth } from '../hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface TopBarProps {
  title: string;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export default function TopBar({ title, showMenuButton, onMenuClick }: TopBarProps) {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [urgentCount, setUrgentCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // 1. Suscribirse a nuevos leads en tiempo real
    const unsubscribe = subscribeToNewLeads((notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 10)); // Guardar últimos 10
      
      // Sonido opcional (descomentar si tienes un archivo de audio)
      // new Audio('/notification.mp3').play().catch(() => {});
      
      // Alerta visual nativa del navegador si está en segundo plano
      if (document.hidden) {
        new Notification(notif.title, { body: notif.message });
      }
    });

    // 2. Chequear leads urgentes al montar
    const loadUrgent = async () => {
      const urgentIds = await checkUrgentLeads();
      setUrgentCount(urgentIds.length);
    };
    loadUrgent();

    // Pedir permiso para notificaciones de navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const totalUnread = notifications.length + urgentCount;

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden text-zinc-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* CAMPANA DE NOTIFICACIONES */}
        <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-zinc-800">
              <Bell className="w-5 h-5" />
              {totalUnread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800 text-white">
            <DropdownMenuLabel className="flex justify-between items-center">
              Notificaciones
              {urgentCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {urgentCount} Urgentes
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            
            {notifications.length === 0 && urgentCount === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                Sin notificaciones nuevas
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <DropdownMenuItem key={n.timestamp} className="flex flex-col items-start gap-1 p-3 cursor-default hover:bg-zinc-800">
                    <span className="font-medium text-sm text-white">{n.title}</span>
                    <span className="text-xs text-zinc-400">{n.message}</span>
                    <span className="text-[10px] text-zinc-600 mt-1">
                      {new Date(n.timestamp).toLocaleTimeString()}
                    </span>
                  </DropdownMenuItem>
                ))}
                {urgentCount > 0 && (
                  <div className="p-3 bg-red-950/30 border-t border-red-900/50">
                    <p className="text-xs text-red-400 font-bold">
                      ⚠️ Hay {urgentCount} leads con más de 5 min sin contactar.
                    </p>
                  </div>
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* PERFIL DE USUARIO */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-zinc-800 text-white hover:bg-zinc-700">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name || 'Usuario'}</p>
                <p className="text-xs leading-none text-zinc-400">{user?.email}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">{user?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={signOut} className="text-red-400 focus:text-red-400 focus:bg-red-950/30 cursor-pointer">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}