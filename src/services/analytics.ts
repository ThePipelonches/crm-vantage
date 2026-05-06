import { supabase } from '../lib/supabase';

export interface DashboardMetrics {
  totalLeads: number;
  newLeads: number; // Leads en estado 'new'
  contactedLeads: number;
  conversionRate: number; // (Closed / Total) * 100
  totalSales: number; // Suma de ventas (si existe tabla sales) o leads cerrados
  appointmentsToday: number;
  appointmentsUpcoming: number;
}

/**
 * Obtiene las métricas principales para el dashboard.
 * Filtra automáticamente según el rol del usuario gracias a las políticas RLS de Supabase.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const todayStart = now.setHours(0, 0, 0, 0);
  const todayEnd = now.setHours(23, 59, 59, 999);

  // 1. Obtener Leads (RLS filtra por usuario si no es admin)
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('status, created_at');

  if (leadsError) throw leadsError;

  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter(l => l.status === 'new').length || 0;
  const contactedLeads = leads?.filter(l => l.status === 'contacted' || l.status === 'qualified').length || 0;
  const closedLeads = leads?.filter(l => l.status === 'closed').length || 0;
  
  // Calcular tasa de conversión
  const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

  // 2. Obtener Citas (Appointments)
  // Asumimos que la fecha está en 'scheduled_at' (timestamp) o 'date' (date)
  // Ajusta el campo según tu tabla real. Usaremos 'scheduled_at' como estándar.
  const { data: appointments, error: apptError } = await supabase
    .from('appointments')
    .select('scheduled_at, status');

  if (apptError) console.warn('Error cargando citas:', apptError);

  let appointmentsToday = 0;
  let appointmentsUpcoming = 0;

  if (appointments) {
    appointmentsToday = appointments.filter(appt => {
      const apptDate = new Date(appt.scheduled_at).getTime();
      return apptDate >= todayStart && apptDate <= todayEnd && appt.status !== 'cancelled';
    }).length;

    appointmentsUpcoming = appointments.filter(appt => {
      const apptDate = new Date(appt.scheduled_at).getTime();
      return apptDate > todayEnd && appt.status !== 'cancelled';
    }).length;
  }

  // 3. Ventas (Opcional: Si usas la tabla 'sales', si no, usamos leads cerrados como proxy)
  // Aquí simulamos el valor total sumando un valor ficticio o leyendo la tabla sales si existe.
  // Para este ejemplo, usaremos el conteo de leads cerrados como "Ventas Totales".
  const totalSalesValue = closedLeads; 

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    conversionRate: parseFloat(conversionRate.toFixed(1)),
    totalSales: totalSalesValue,
    appointmentsToday,
    appointmentsUpcoming
  };
}

/**
 * Obtiene los últimos leads para mostrar en una lista rápida
 */
export async function getRecentLeads(limit: number = 5) {
  const { data, error } = await supabase
    .from('leads')
    .select('full_name, status, created_at, email')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data || [];
}