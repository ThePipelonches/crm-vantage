import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// VALIDACIÓN CRÍTICA: Evitar inicialización si faltan variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR CRÍTICO: Faltan variables de entorno de Supabase.');
  console.error('URL:', supabaseUrl ? 'OK' : 'FALTA');
  console.error('Key:', supabaseAnonKey ? 'OK' : 'FALTA');
  console.error('Revisa tu archivo .env y las variables en Vercel.');
  
  // Creamos un cliente falso para que la app no colapse inmediatamente al importar
  // pero las operaciones fallarán. Esto evita la "Pantalla Negra" instantánea.
  export const supabase = createClient('https://invalid.supabase.co', 'invalid-key');
} else {
  // Configuración normal si todo está bien
  export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}