import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto scrollbar-thin p-6 animate-fade-in"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
