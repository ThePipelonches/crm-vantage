import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getClientById,
  getSessionsByClient,
  getTestsByClient,
  updateClient,
  getUsers,
} from '@/services/storage';

import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Brain,
  Save,
  CalendarDays,
  BarChart3,
  Package,
} from 'lucide-react';

type Tab = 'profile' | 'package' | 'psychometric' | 'sessions';

//////////////////////////////////////////////////////////////
// MAIN EXPORT (🔥 IMPORTANTE: NO default)
//////////////////////////////////////////////////////////////

export function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [, setRefresh] = useState(0);

  if (!id) return null;

  const client = getClientById(id);

  if (!client) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cliente no encontrado
      </div>
    );
  }

  const tabs = [
    { key: 'profile', label: 'Perfil' },
    { key: 'package', label: 'Paquete' },
    { key: 'psychometric', label: 'Evaluación' },
    { key: 'sessions', label: 'Sesiones' },
  ];

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clients')}>
          <ArrowLeft />
        </button>

        <div>
          <h2 className="text-lg font-medium">{client.fullName}</h2>
          <p className="text-sm text-muted-foreground">{client.phone}</p>
        </div>

        <div className="flex-1" />

        <span className="text-xs px-2 py-1 rounded bg-white/10">
          ROL: {client.rolRisk}
        </span>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as Tab)}
            className={`px-3 py-2 text-sm rounded ${
              activeTab === tab.key ? 'bg-white/10' : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab client={client} />}
      {activeTab === 'package' && (
        <PackageTab
          client={client}
          onUpdate={() => setRefresh((r) => r + 1)}
        />
      )}
      {activeTab === 'psychometric' && (
        <PsychometricTab clientId={id} />
      )}
      {activeTab === 'sessions' && <SessionsTab clientId={id} />}
    </div>
  );
}

//////////////////////////////////////////////////////////////
// PROFILE TAB
//////////////////////////////////////////////////////////////

function ProfileTab({ client }: any) {
  const psychologists = getUsers().filter(
    (u) => u.role === 'psychologist'
  );

  const assignPsychologist = (id: string) => {
    const psy = psychologists.find((p) => p.id === id);

    updateClient(client.id, {
      psychologistId: id,
      psychologistName: psy?.name || '',
    });

    window.location.reload();
  };

  return (
    <div className="card p-4 space-y-3">
      <p><User /> {client.fullName}</p>
      <p><Phone /> {client.phone}</p>
      <p><Mail /> {client.email}</p>

      <div>
        <p><Brain /> {client.psychologistName || 'Sin asignar'}</p>

        <select
          value={client.psychologistId || ''}
          onChange={(e) => assignPsychologist(e.target.value)}
        >
          <option value="">Asignar psicólogo</option>
          {psychologists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////////////
// PACKAGE TAB
//////////////////////////////////////////////////////////////

function PackageTab({ client, onUpdate }: any) {
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    totalSessions: client.totalSessions,
    completedSessions: client.completedSessions,
    rolRisk: client.rolRisk,
  });

  const handleSave = () => {
    updateClient(client.id, form);
    setIsEditing(false);
    onUpdate();
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex justify-between">
        <h3>Paquete</h3>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {isEditing ? (
        <>
          <input
            type="number"
            value={form.totalSessions}
            onChange={(e) =>
              setForm({ ...form, totalSessions: Number(e.target.value) })
            }
          />

          <input
            type="number"
            value={form.completedSessions}
            onChange={(e) =>
              setForm({
                ...form,
                completedSessions: Number(e.target.value),
              })
            }
          />

          <select
            value={form.rolRisk}
            onChange={(e) =>
              setForm({ ...form, rolRisk: e.target.value })
            }
          >
            <option value="green">Verde</option>
            <option value="yellow">Amarillo</option>
            <option value="red">Rojo</option>
          </select>

          <button onClick={handleSave}>
            <Save /> Guardar
          </button>
        </>
      ) : (
        <>
          <p>Total sesiones: {client.totalSessions}</p>
          <p>Completadas: {client.completedSessions}</p>
        </>
      )}
    </div>
  );
}

//////////////////////////////////////////////////////////////
// PSYCHOMETRIC TAB
//////////////////////////////////////////////////////////////

function PsychometricTab({ clientId }: any) {
  const tests = getTestsByClient(clientId);

  return (
    <div className="card p-4">
      <p>Total evaluaciones: {tests.length}</p>
    </div>
  );
}

//////////////////////////////////////////////////////////////
// SESSIONS TAB
//////////////////////////////////////////////////////////////

function SessionsTab({ clientId }: any) {
  const sessions = getSessionsByClient(clientId);

  return (
    <div className="card p-4">
      <p>Total sesiones: {sessions.length}</p>
    </div>
  );
}