// register-webhook.js
// Ejecuta esto SOLO UNA VEZ desde tu terminal local para registrar el webhook en Calendly

const CALENDLY_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzc4NTM4MTE1LCJqdGkiOiI0MmZiYzk1ZC03YjZkLTRkNTktYmEwMC1mZjVkMzRiNDE1ZjQiLCJ1c2VyX3V1aWQiOiI0Yjk5NzA1YS05MTkwLTQ0MDAtYmNiNC1jYmIwZjFiNjJmYzAiLCJzY29wZSI6InNjaGVkdWxlZF9ldmVudHM6d3JpdGUgc2NoZWR1bGVkX2V2ZW50czpyZWFkIHdlYmhvb2tzOndyaXRlIHdlYmhvb2tzOnJlYWQifQ.7Kn2UQIM6d-tiDgBslX4LvQLqXqHIz0J0V5ArrNk1O3D1hyGjMSgt4UjDqf2KUWdP6cWwB5BpchPdL1icRuRcw';

const WEBHOOK_URL = 'https://crm-vantage.vercel.app/api/calendly-webhook';

async function register() {
  try {
    const response = await fetch('https://api.calendly.com/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALENDLY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: ['invitee.created'], // Solo escuchamos cuando alguien se agenda
        scope: 'user' // Escucha eventos de tu usuario
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ ¡ÉXITO! Webhook registrado correctamente en Calendly.');
      console.log('ID del webhook:', data.resource.id);
      console.log('Ahora puedes borrar este archivo register-webhook.js');
    } else {
      console.error('❌ Error al registrar:', data);
      if (data.errors) {
        console.error('Detalles:', JSON.stringify(data.errors, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

register();