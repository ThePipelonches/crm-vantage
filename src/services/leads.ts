import { supabase } from '@/lib/supabase';

//////////////////////////////////////////////////
// GET LEADS
//////////////////////////////////////////////////

export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo leads:', error);
    return [];
  }

  return data;
}

//////////////////////////////////////////////////
// CREATE LEAD
//////////////////////////////////////////////////

export async function createLead(lead: {
  name: string;
  phone: string;
  email?: string;
}) {
  const { error } = await supabase.from('leads').insert([
    {
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      status: 'new',
    },
  ]);

  if (error) {
    console.error('Error creando lead:', error);
  }
}

//////////////////////////////////////////////////
// UPDATE LEAD STATUS
//////////////////////////////////////////////////

export async function updateLeadStatus(id: string, status: string) {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error actualizando lead:', error);
  }
}