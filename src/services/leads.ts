import { supabase } from '../lib/supabase';

export interface CreateLeadInput {
  full_name: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
}

/**
 * Obtiene todos los leads visibles para el usuario actual.
 */
export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
  return data || [];
}

/**
 * Crea un nuevo lead asignando automáticamente el ID según el rol.
 */
export async function createLead(input: CreateLeadInput) {
  // 1. Obtener usuario autenticado (Sintaxis corregida)
  const { data: authData, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authData.user) {
    throw new Error('No hay usuario autenticado');
  }

  const user = authData.user;

  // 2. Mapeo local de roles por email (Evita recursión infinita)
  const USER_ROLES: Record<string, string> = {
    'chav.negocios@gmail.com': 'admin',
    'andresclinicapsicologica@gmail.com': 'admin',
    'sebastian@bbr.mx': 'admin',
    'dicama2016@gmail.com': 'setter',
    'isabel@metodovantage.com': 'closer',
    'valentina@metodovantage.com': 'psychologist',
    'christian@metodovantage.com': 'psychologist',
  };

  const role = USER_ROLES[user.email!] || 'setter';
  console.log(`Creando lead como: ${role} (User ID: ${user.id})`);

  // 3. Preparar datos
  const leadData: any = {
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    source: input.source || 'web',
    notes: input.notes,
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 4. Asignar propietario según rol
  if (role === 'admin') {
    leadData.setter_id = user.id; // Admin actúa como setter por defecto al crear
  } else if (role === 'setter') {
    leadData.setter_id = user.id;
  } else if (role === 'closer') {
    leadData.closer_id = user.id;
  } else {
    throw new Error(`El rol '${role}' no tiene permisos para crear leads.`);
  }

  // 5. Insertar
  const { data, error } = await supabase
    .from('leads')
    .insert([leadData])
    .select()
    .single();

  if (error) {
    console.error('Error detallado al crear lead:', error);
    throw error;
  }

  return data;
}

/**
 * Actualiza el estado de un lead.
 */
export async function updateLeadStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('leads')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
  return data;
}

/**
 * Actualiza los datos de un lead (Nombre, teléfono, notas).
 */
export async function updateLeadData(id: string, updates: Partial<CreateLeadInput>) {
  const { data, error } = await supabase
    .from('leads')
    .update({ 
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead data:', error);
    throw error;
  }
  return data;
}

/**
 * Elimina un lead.
 */
export async function deleteLead(id: string) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}