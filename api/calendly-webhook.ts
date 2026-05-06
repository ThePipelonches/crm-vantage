import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuración CORS para permitir llamadas desde Calendly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function POST(req: NextRequest) {
  try {
    // 1. Leer el cuerpo de la solicitud
    const payload = await req.json();
    const event = payload.event;

    // 2. Validar que sea un evento de creación de invitado
    if (!event || event.name !== 'invitee_created') {
      console.log('Evento ignorado:', event?.name);
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200, headers: corsHeaders });
    }

    const resource = event.resource;
    const email = resource.email;

    // Si no hay email, rechazamos
    if (!email) {
      throw new Error('No se encontró email en el evento de Calendly');
    }

    const name = resource.name || resource.guest_name || 'Usuario Sin Nombre';
    const phone = resource.phone_number || '';
    const scheduledAt = resource.scheduled_at || 'Fecha no disponible';

    // 3. Construir notas
    let notes = `Cita agendada desde Calendly. Hora: ${scheduledAt}. `;
    if (resource.answers && Array.isArray(resource.answers)) {
      resource.answers.forEach((a: any) => {
        if (a.question && a.answer) {
          notes += `${a.question}: ${a.answer}. `;
        }
      });
    }

    // 4. Conectar a Supabase (Usa variables de entorno de Vercel)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usamos Service Role para evitar problemas de RLS en webhooks
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan variables de entorno de Supabase');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 5. Verificar duplicados
    const { data: existingLead, error: fetchError } = await supabaseClient
      .from('leads')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingLead) {
      console.log(`El lead ${email} ya existe.`);
      return NextResponse.json({ message: 'Lead ya existe', id: existingLead.id }, { status: 200, headers: corsHeaders });
    }

    // 6. Insertar nuevo lead
    // Corregido: Usamos un objeto plano compatible con los tipos de Supabase
    const newLeadData = {
      full_name: name,
      email: email,
      phone: phone,
      source: 'calendly',
      notes: notes,
      status: 'new', // Importante para tus alertas
      metadata: { 
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
    return NextResponse.json({ message: 'Lead creado', data }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Error crítico en webhook:', error);
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// Manejar opción PREFLIGHT de CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}