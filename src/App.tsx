import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Componente de prueba ultra-simple
function TestView() {
  const { user, signOut, loading } = useAuth();

  if (loading) return <div style={{color: 'white', padding: 20}}>Cargando Auth...</div>;

  return (
    <div style={{color: 'white', padding: 20, fontFamily: 'sans-serif'}}>
      <h1>✅ SISTEMA OPERATIVO</h1>
      <p>Usuario: {user ? user.email : 'Ninguno'}</p>
      <p>Rol: {user ? user.role : 'Ninguno'}</p>
      
      {!user ? (
        <p style={{color: 'red'}}>⚠️ No hay usuario. Revisa tu Login.</p>
      ) : (
        <button onClick={() => signOut()} style={{padding: '10px 20px', cursor: 'pointer'}}>
          Cerrar Sesión
        </button>
      )}
      
      <hr style={{borderColor: '#333', margin: '20px 0'}}/>
      <p style={{color: '#888'}}>Si ves esto, la estructura base funciona. El error está en las páginas internas.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta única de prueba */}
          <Route path="/*" element={<TestView />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}