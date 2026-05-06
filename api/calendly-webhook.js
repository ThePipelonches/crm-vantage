import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req, res) {
  // Manejar CORS para peticiones OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    return res.status(200).end();
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const event = payload.event;

    // Validar evento de Calendly
    if (!event || event.name !== 'invitee_created') {
      console.log('Evento ignorado:', event?.name);
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    const resource = event.resource;
    const email = resource.email;

    if (!email) {
      throw new Error('No se encontró email en el evento de Calendly');
    }

    const name = resource.name || resource.guest_name || 'Usuario Sin Nombre';
    const phone = resource.phone_number || '';
    const scheduledAt = resource.scheduled_at || 'Fecha no disponible';

    let notes = `Cita agendada desde Calendly. Hora: ${scheduledAt}. `;
    if (resource.answers && Array.isArray(resource.answers)) {
      resource.answers.forEach((a) => {
        if (a.question && a.answer) {
          notes += `${a.question}: ${a.answer}. `;
        }
      });
    }

    // Configurar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan variables de entorno de Supabase en Vercel');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Verificar duplicados
    const { data: existingLead, error: fetchError } = await supabaseClient
      .from('leads')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingLead) {
      console.log(`El lead ${email} ya existe.`);
      return res.status(200).json({ message: 'Lead ya existe', id: existingLead.id });
    }

    // Insertar nuevo lead
    // Nota: Usamos 'meta' como columna JSONB. Asegúrate que exista en tu BD.
    const newLeadData = {
      full_name: name,
      email: email,
      phone: phone,
      source: 'calendly',
      notes: notes,
      status: 'new',
      meta: { 
        calendly_uri: resource.uri,
        scheduled_at: scheduledAt
      }
    };

    const { data, error: insertError } = await supabaseClient
      .from('leads')
      .insert(newLeadData)
      .select()
      .single();

    if (insertError) {
      console.error('Error al insertar:', insertError);
      throw insertError;
    }

    console.log('Lead creado con éxito:', data);
    return res.status(200).json({ message: 'Lead creado', data });

  } catch (error) {
    console.error('Error crítico en webhook:', error);
    return res.status(500).json({ error: error.message || 'Error desconocido' });
  }
}