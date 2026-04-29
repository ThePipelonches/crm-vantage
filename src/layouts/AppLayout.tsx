import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { MobileMenu } from '../components/MobileMenu';
import { useState } from 'react';

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  //////////////////////////////////////////////////
  // 🔐 PROTECCIÓN REAL (NO SOLO NULL)
  //////////////////////////////////////////////////

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  //////////////////////////////////////////////////
  // 🔥 TITLE DINÁMICO (UX PRO)
  //////////////////////////////////////////////////

  const routeTitles: Record<string, string> = {
    '/setter': 'Dashboard Setter',
    '/leads': 'Leads',
    '/appointments': 'Consultas',
    '/commercial': 'Dashboard Comercial',
    '/closers': 'Closers',
    '/clinical': 'Dashboard Clínico',
    '/clients': 'Clientes',
    '/admin': 'Panel Admin',
  };

  const currentTitle =
    routeTitles[location.pathname] ||
    'Vantage';

  //////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////

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
        <TopBar
          title={currentTitle}
          showMenuButton
          onMenuClick={() => setMobileMenuOpen(true)}
        />

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