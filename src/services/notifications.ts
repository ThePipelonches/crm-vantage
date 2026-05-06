import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'new_lead' | 'urgent_lead' | 'info';
  timestamp: number;
  read: boolean;
}

let channel: RealtimeChannel | null = null;
let callback: ((notif: Notification) => void) | null = null;

/**
 * Inicia la escucha en tiempo real para nuevos leads.
 * Solo notifica si el lead es 'new' y acaba de crearse.
 */
export function subscribeToNewLeads(onNotification: (notif: Notification) => void) {
  // Guardamos el callback
  callback = onNotification;

  // Cancelar suscripción previa si existe
  if (channel) {
    supabase.removeChannel(channel);
  }

  // Suscribirse a cambios en la tabla 'leads'
  channel = supabase
    .channel('public:leads')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'leads' },
      (payload) => {
        const newLead = payload.new as any;
        
        // Solo notificar si es un lead nuevo
        if (newLead.status === 'new') {
          const notification: Notification = {
            id: newLead.id,
            title: '🔔 Nuevo Lead Recibido',
            message: `${newLead.full_name} ha ingresado al sistema.`,
            type: 'new_lead',
            timestamp: Date.now(),
            read: false,
          };
          
          if (callback) callback(notification);
        }
      }
    )
    .subscribe();

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

/**
 * Verifica leads urgentes (> 5 min sin contacto) al cargar la página.
 * Devuelve una lista de IDs de leads urgentes.
 */
export async function checkUrgentLeads(): Promise<string[]> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('leads')
    .select('id, full_name, created_at')
    .eq('status', 'new')
    .lt('created_at', fiveMinutesAgo);

  if (error) {
    console.error('Error checking urgent leads:', error);
    return [];
  }

  return data ? data.map(l => l.id) : [];
}