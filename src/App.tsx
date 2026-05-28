import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';

// Componente temporal de diagnóstico
function DebugDashboard() {
  const { user, signOut, role } = useAuth();
  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'sans-serif' }}>
      <h1>✅ ¡SISTEMA OPERATIVO!</h1>
      <p>Usuario logueado: <strong>{user?.email}</strong></p>
      <p>Rol detectado: <strong>{role || 'Sin rol'}</strong></p>
      <p>ID Usuario: {user?.id}</p>
      <hr style={{ borderColor: '#333', margin: '20px 0' }} />
      <p>Si ves esto, el núcleo de Auth y React funcionan bien.</p>
      <p>El error anterior estaba en las Rutas o el Layout.</p>
      <button onClick={signOut} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ color: 'white', padding: '20px' }}>Cargando núcleo...</div>;
  }

  // Lógica ultra-simple sin Router por ahora
  if (!user) {
    return <LoginPage />;
  }

  return <DebugDashboard />;
}