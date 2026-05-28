import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Manejo de errores global para evitar pantalla negra silenciosa
window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.error('❌ ERROR GLOBAL CAPTURADO:', msg, url, lineNo, columnNo, error);
  const container = document.getElementById('root');
  if (container) {
    container.innerHTML = `
      <div style="color: red; padding: 20px; font-family: sans-serif;">
        <h2>⚠️ Error Crítico Detectado</h2>
        <p><strong>Mensaje:</strong> ${msg}</p>
        <p><strong>Ubicación:</strong> Línea ${lineNo}</p>
        <p>Revisa la consola (F12) para más detalles.</p>
        <button onclick="location.reload()" style="padding: 10px 20px; cursor: pointer;">Recargar Página</button>
      </div>
    `;
  }
  return false;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);