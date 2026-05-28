import React from 'react'
import ReactDOM from 'react-dom/client'
import './App'
import './index.css'

// 1. Captura de errores GLOBALES antes de que React inicie
window.addEventListener('error', (e) => {
  console.error("âŒ ERROR GLOBAL CAPTURADO EN MAIN:", e.error);
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: sans-serif;">
      <h1>Error CrÃ­tico de Inicio</h1>
      <p>Revisa la consola (F12) para mÃ¡s detalles.</p>
      <pre style="background: #eee; padding: 10px;">${e.message}</pre>
    </div>
  `;
});

// 2. Inicio seguro
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("No se encontrÃ³ el elemento #root en el HTML. Verifica index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)