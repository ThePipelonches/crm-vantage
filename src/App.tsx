import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import Dashboard from './pages/admin/Dashboard';

// Inicializar Supabase directamente aquí para evitar dependencias rotas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); // 'login', 'dashboard', 'leads', 'patients', etc.

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) setView('dashboard');
      else setView('login');
      setLoading(false);
    });

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setView('dashboard');
      else setView('login');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('login');
  };

  const handleLogin = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) alert(error.message);
    else if (data.user) {
      setUser(data.user);
      setView('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Vista Login Simple
  if (view === 'login' || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white p-4">
        <div className="w-full max-w-md space-y-4 bg-zinc-900 p-8 rounded-lg border border-zinc-800">
          <h1 className="text-2xl font-bold text-center">Vantage CRM</h1>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const email = (form.elements[0] as HTMLInputElement).value;
            const pass = (form.elements[1] as HTMLInputElement).value;
            handleLogin(email, pass);
          }} className="space-y-4">
            <input type="email" placeholder="Email" required className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
            <input type="password" placeholder="Contraseña" required className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
            <button type="submit" className="w-full p-2 bg-white text-black font-bold rounded hover:bg-zinc-200">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  // Navegación Manual
  const role = user.user_metadata?.role || 'user';
  
  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard />;
      case 'leads': return (role === 'admin' || role === 'closer') ? <LeadsPage /> : <Dashboard />;
      case 'patients': return (role === 'admin' || role === 'psychologist') ? <PatientsPage /> : <Dashboard />;
      case 'commercial': return (role === 'admin' || role === 'closer') ? <CommercialDashboard /> : <Dashboard />;
      case 'psychologist': return role === 'psychologist' ? <PsychologistDashboard /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Simple */}
      <header className="border-b border-zinc-800 p-4 flex flex-wrap gap-4 justify-between items-center bg-zinc-900">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => setView('dashboard')}>
          Vantage CRM <span className="text-xs font-normal text-zinc-500">({role})</span>
        </h1>
        
        <nav className="flex gap-4 text-sm flex-wrap">
          {(role === 'admin' || role === 'closer') && (
            <button onClick={() => setView('leads')} className={`hover:text-white ${view === 'leads' ? 'text-white font-bold underline' : 'text-zinc-400'}`}>Leads</button>
          )}
          {(role === 'admin' || role === 'psychologist') && (
            <button onClick={() => setView('patients')} className={`hover:text-white ${view === 'patients' ? 'text-white font-bold underline' : 'text-zinc-400'}`}>Pacientes</button>
          )}
          {role === 'admin' && (
             <button onClick={() => setView('dashboard')} className={`hover:text-white ${view === 'dashboard' ? 'text-white font-bold underline' : 'text-zinc-400'}`}>Dashboard</button>
          )}
        </nav>

        <button onClick={handleLogout} className="text-xs bg-red-900/50 hover:bg-red-900 px-3 py-1 rounded transition-colors border border-red-800">
          Salir
        </button>
      </header>

      {/* Contenido */}
      <main className="p-6">
        {renderView()}
      </main>
    </div>
  );
}