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

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <Sidebar />
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
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
