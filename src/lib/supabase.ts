import { createClient } from '@supabase/supabase-js';

// Vite requiere que las variables empiecen con VITE_ para exponerlas al cliente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEBUG: Verifica en la consola del navegador (F12) qué está llegando
console.log('🔍 Debug Supabase:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  rawKey: supabaseAnonKey ? 'Presente' : 'Ausente'
});

// SOLUCIÓN: Si faltan, usamos valores por defecto o lanzamos un warning en vez de romper la app
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ ADVERTENCIA: Variables de entorno de Supabase no encontradas en el build.');
  console.error('⚠️ Asegúrate de que en Vercel estén definidas como VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  
  // Opcional: Usar valores hardcodeados SOLO para debug (BORRAR EN PRODUCCIÓN SI NO FUNCIONA)
  // Descomenta solo si necesitas probar urgente y borrarás luego:
  /*
  const fallbackUrl = 'https://ssduoqrbkwyucqomwbix.supabase.co';
  const fallbackKey = 'sb_publishable_XqIgIUzv8bGSOS3_YwVuEQ_8_R0GLgu';
  export const supabase = createClient(fallbackUrl, fallbackKey);
  */
  
  // Si no hay fallback, creamos un cliente dummy para que no rompa el renderizado inicial
  // Pero lo ideal es arreglar las variables en Vercel.
  throw new Error('Faltan las variables de entorno de Supabase. Revisa Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);