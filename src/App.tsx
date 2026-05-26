import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import TopBar from '../components/TopBar';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar Fijo a la izquierda */}
      <Sidebar />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300 ease-in-out">
        {/* Barra Superior (Solo mÃƒÂ³vil o para bÃƒÂºsqueda/perfil) */}
        <TopBar title={''} />
        
        {/* ÃƒÂrea de Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}