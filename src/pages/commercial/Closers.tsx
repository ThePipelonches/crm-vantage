import { useState } from 'react';
import {
  getClosers,
  addCloser,
  addUser,
  generateVerificationCode,
} from '@/services/storage';

import type { Closer } from '@/types';

import {
  UserPlus,
  Mail,
  CheckCircle2,
  Target,
  X,
} from 'lucide-react';

export function ClosersPage() {
  const [closers, setClosers] = useState<Closer[]>(getClosers());
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [sentEmail, setSentEmail] = useState('');
  const [sentCode, setSentCode] = useState('');

  //////////////////////////////////////////////////
  // ADD CLOSER
  //////////////////////////////////////////////////

  const handleAdd = () => {
    if (!name || !email) return;

    const id = `cl_${Date.now()}`;

    const closer: Closer = {
      id,
      name,
      email,
    };

    addCloser(closer);

    //////////////////////////////////////////////////
    // CREATE USER
    //////////////////////////////////////////////////

    addUser({
      id: `u_${Date.now()}`,
      email,
      name,
      role: 'closer',
      password: '1234',
      mustChangePassword: true,
    });

    //////////////////////////////////////////////////
    // VERIFICATION CODE (SIMULADO)
    //////////////////////////////////////////////////

    const code = generateVerificationCode(email);

    setSentEmail(email);
    setSentCode(code);

    setClosers(getClosers());

    setShowForm(false);
    setName('');
    setEmail('');
  };

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Closers</h2>
          <p className="text-sm text-muted-foreground">
            Gestión del equipo de cierre
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm hover:bg-cyan-400/20"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo closer
        </button>
      </div>

      {/* ALERT */}
      {sentEmail && (
        <div className="card-surface rounded-xl p-4 border border-emerald-400/20 bg-emerald-400/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              Closer registrado
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            Email enviado a <strong>{sentEmail}</strong>
          </p>

          <div className="bg-black rounded-lg p-3 border border-white/10">
            <p className="text-xs text-muted-foreground">
              Código:
            </p>

            <p className="text-lg text-cyan-400 font-mono">
              {sentCode}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Password temporal: <span className="text-amber-400">1234</span>
            </p>
          </div>

          <button
            onClick={() => {
              setSentEmail('');
              setSentCode('');
            }}
            className="mt-2 text-xs text-muted-foreground"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="card-surface rounded-xl p-5 space-y-4">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium">
              Nuevo closer
            </h3>

            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-400 text-black text-sm"
          >
            <Mail className="w-4 h-4" />
            Crear closer
          </button>
        </div>
      )}

      {/* LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {closers.map((c) => (
          <div key={c.id} className="card-surface p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-amber-400" />

              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.email}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}