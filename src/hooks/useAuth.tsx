import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'setter' | 'closer' | 'psychologist';

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// 🔥 MAPEO MANUAL DE USUARIOS Y ROLES
// ==========================================
const USER_ROLES: Record<string, { role: UserRole; full_name: string }> = {
  'chav.negocios@gmail.com': { role: 'admin', full_name: 'Carlos Herrera' },
  'andresclinicapsicologica@gmail.com': { role: 'admin', full_name: 'Andres Betancourt' },
  'sebastian@bbr.mx': { role: 'admin', full_name: 'Sebastian BBR' },
  'dicama2016@gmail.com': { role: 'setter', full_name: 'Diana Castro' },
  'isabel@metodovantage.com': { role: 'closer', full_name: 'Isabel Closer' },
  'valentina@metodovantage.com': { role: 'psychologist', full_name: 'Valentina Psicologa' },
  'christian@metodovantage.com': { role: 'psychologist', full_name: 'Christian Psicologo' },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        processUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        processUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const processUser = (supaUser: User) => {
    const email = supaUser.email || '';
    
    // 🔥 BUSCAR ROL EN EL MAPEO MANUAL
    const userData = USER_ROLES[email];

    if (userData) {
      // Usuario autorizado encontrado en la lista
      setUser({
        id: supaUser.id,
        email: email,
        full_name: userData.full_name,
        role: userData.role,
      });
    } else {
      // Usuario no está en la lista blanca
      console.warn(`Usuario ${email} no tiene permisos asignados en el código.`);
      setUser(null);
      // Opcional: Cerrar sesión automáticamente si no está autorizado
      // supabase.auth.signOut(); 
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}