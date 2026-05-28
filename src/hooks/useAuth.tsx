import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        console.log("🔄 Iniciando sesión de Supabase...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            const r = (session.user.user_metadata as any)?.role || 'user';
            setRole(r);
            console.log("✅ Usuario cargado:", session.user.email, "Rol:", r);
          } else {
            console.log("ℹ️ No hay sesión activa.");
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.error("❌ ERROR CRÍTICO EN AUTH:", err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setRole((session.user.user_metadata as any)?.role || 'user');
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  // Si hubo un error crítico, muéstralo
  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-950 text-white p-4">
        <h1 className="text-2xl font-bold mb-2">Error de Conexión</h1>
        <p className="mb-4">{error}</p>
        <p className="text-sm opacity-70">Revisa la consola para más detalles.</p>
      </div>
    );
  }

  const value = { user, session, loading, role, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}