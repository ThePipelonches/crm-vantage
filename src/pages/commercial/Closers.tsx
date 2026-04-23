import { useState } from 'react';
import { getClosers, addCloser, addUser } from '@/services/storage';
import { generateVerificationCode } from '@/services/storage';
import { UserPlus, Mail, CheckCircle2, Target, X } from 'lucide-react';

export function ClosersPage() {
  const [closers, setClosers] = useState(getClosers());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [sentCode, setSentCode] = useState('');

  const handleAdd = () => {
    if (!name || !email) return;
    const id = `cl_${Date.now()}`;
    const closer = { id, name, email, active: true, createdAt: new Date().toISOString() };
    addCloser(closer);

    // Create user account
    const userId = `u_${Date.now()}`;
    addUser({
      id: userId, email, name, role: 'closer', password: generateRandomPassword(), firstLogin: true,
    });

    // Generate verification code (simulating email send)
    const code = generateVerificationCode(email);
    setSentEmail(email);
    setSentCode(code);
    setClosers(getClosers());
    setShowForm(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Closers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión del equipo de cierre</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm hover:bg-cyan-400/20 transition-colors">
          <UserPlus className="w-4 h-4" /><span>Nuevo closer</span>
        </button>
      </div>

      {sentEmail && (
        <div className="card-surface rounded-xl p-4 border border-emerald-400/20 bg-emerald-400/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Closer registrado exitosamente</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Se ha enviado un correo de invitación a <strong>{sentEmail}</strong></p>
          <div className="bg-black rounded-lg p-3 border border-white/10">
            <p className="text-xs text-muted-foreground mb-1">Simulación de correo enviado:</p>
            <p className="text-sm font-mono-tech">Código de verificación: <span className="text-cyan-400 text-lg">{sentCode}</span></p>
            <p className="text-xs text-muted-foreground mt-1">Contraseña temporal: <span className="text-amber-400">vantage2024</span></p>
          </div>
          <button onClick={() => { setSentEmail(''); setSentCode(''); }} className="mt-2 text-xs text-muted-foreground hover:text-white">Cerrar</button>
        </div>
      )}

      {showForm && (
        <div className="card-surface rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Registrar nuevo closer</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Nombre completo</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. María Isabel"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="closer@metodovantage.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={!name || !email}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Mail className="w-4 h-4" />Enviar invitación
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {closers.map((closer) => (
          <div key={closer.id} className="card-surface rounded-xl p-5 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{closer.name}</p>
                <p className="text-xs text-muted-foreground">{closer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400">Activo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateRandomPassword(): string {
  return 'vantage2024';
}
