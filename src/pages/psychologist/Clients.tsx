import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getUsers, addClient } from '@/services/storage';
import { Search, Users, ChevronRight, UserPlus, X, Save } from 'lucide-react';

export function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState(getClients());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const psychologists = getUsers().filter((u) => u.role === 'psychologist');

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      return !search || c.fullName.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase());
    });
  }, [clients, search]);

  const handleCreate = () => {
    if (!name || !phone) return;
    const psy = psychologists[0];
    addClient({
      id: `c_${Date.now()}`, fullName: name, phone, email: email || '',
      psychologistId: psy?.id || 'u4', psychologistName: psy?.name || 'Christian Rendón',
      consultationReason: '', packageType: 'individual', totalSessions: 1, completedSessions: 0,
      paymentStatus: 'compromised', rolRisk: 'green',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    setClients(getClients());
    setShowForm(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Base de clientes ejecutivos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm hover:bg-cyan-400/20 transition-colors">
          <UserPlus className="w-4 h-4" /><span>Nuevo expediente</span>
        </button>
      </div>

      {showForm && (
        <div className="card-surface rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Crear nuevo expediente</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Nombre completo *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del cliente"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Teléfono *</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 55 ..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={!name || !phone}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="w-4 h-4" />Crear expediente
          </button>
        </div>
      )}

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..."
          className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 w-full" />
      </div>

      <div className="card-surface rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Nombre</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Teléfono</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Correo</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((client) => (
                <tr key={client.id} onClick={() => navigate(`/clients/${client.id}`)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-cyan-400">{client.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <p className="text-sm font-medium group-hover:text-cyan-400 transition-colors">{client.fullName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-sm">{client.phone}</span></td>
                  <td className="px-4 py-3"><span className="text-sm text-muted-foreground">{client.email}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">Abrir expediente</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
