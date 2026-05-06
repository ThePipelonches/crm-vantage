import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { MobileMenu } from '../components/MobileMenu';
import { useState } from 'react';

export function AppLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const routeTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/leads': 'Leads',
    '/admin': 'Panel Admin',
  };

  const currentTitle = routeTitles[location.pathname] || 'Vantage CRM';

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <Sidebar />
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar 
          title={currentTitle} 
          showMenuButton 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}