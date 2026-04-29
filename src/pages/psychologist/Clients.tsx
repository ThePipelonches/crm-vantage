import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { getClients, getUsers, addClient } from '../../services/storage';
import type { Client, User } from '../../types';

import { Search, Users, ChevronRight, UserPlus, X, Save } from 'lucide-react';

export function ClientsPage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>(getClients());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const psychologists = getUsers().filter(
    (u: User) => u.role === 'psychologist'
  );

  //////////////////////////////////////////////////

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      return (
        !search ||
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
      );
    });
  }, [clients, search]);

  //////////////////////////////////////////////////

  const handleCreate = () => {
    if (!name || !phone) return;

    const psy = psychologists[0];

    const newClient: Client = {
      id: `c_${Date.now()}`,
      fullName: name,
      phone,
      email,

      psychologistId: psy?.id || '',
      psychologistName: psy?.name || '',

      consultationReason: '',

      packageType: 'individual',
      totalSessions: 1,
      completedSessions: 0,
      paymentStatus: 'pending',

      rolRisk: 'green',

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addClient(newClient);

    setClients(getClients());
    setShowForm(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  //////////////////////////////////////////////////

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex justify-between">
        <h2>Clientes</h2>

        <button onClick={() => setShowForm(!showForm)}>
          <UserPlus />
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="card p-4 space-y-3">

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />

          <button onClick={handleCreate}>
            <Save /> Crear
          </button>
        </div>
      )}

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar"
      />

      {/* LIST */}
      <div>
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/clients/${c.id}`)}
            className="cursor-pointer"
          >
            {c.fullName}
          </div>
        ))}
      </div>

    </div>
  );
}