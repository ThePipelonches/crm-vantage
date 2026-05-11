import { createClient } from '@supabase/supabase-js';

// Intenta leer con prefijo VITE_ primero, si no, intenta con NEXT_PUBLIC_ (para compatibilidad Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl); 
console.log('Supabase Key presente:', !!supabaseAnonKey); 

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);