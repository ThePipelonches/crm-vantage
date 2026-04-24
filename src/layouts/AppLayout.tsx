import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { MobileMenu } from '@/components/MobileMenu';
import { useState } from 'react';

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔐 Protección de rutas
  if (!user) {
  return null; // evita crash mientras carga auth
  } 

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">

      {/* SIDEBAR DESKTOP */}
      <Sidebar />

      {/* SIDEBAR MOBILE */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* CONTENIDO */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* TOPBAR */}
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* MAIN */}
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 animate-fade-in"
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
}