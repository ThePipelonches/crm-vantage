import { useState, useMemo } from 'react';
import { KpiCard } from '@/components/KpiCard';
import { getClients, getAppointments, getSessions, getUsers, addUser } from '@/services/storage';
import { generateVerificationCode } from '@/services/storage';
import { Activity, CalendarCheck, Users, TrendingDown, Brain, UserPlus, Mail, CheckCircle2, X, Filter } from 'lucide-react';

export function PsychologistDashboard() {
  const [selectedPsy, setSelectedPsy] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [psyName, setPsyName] = useState('');
  const [psyEmail, setPsyEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [sentCode, setSentCode] = useState('');

  const clients = getClients();
  const appointments = getAppointments();
  const sessions = getSessions();
  const psychologists = getUsers().filter((u) => u.role === 'psychologist');

  const filteredClients = selectedPsy === 'all' ? clients : clients.filter((c) => c.psychologistId === selectedPsy);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const totalClients = filteredClients.length;
    const weekSessions = appointments.filter((a) => a.date >= weekAgo && a.date <= today && (a.status === 'completed' || a.status === 'confirmed')).length;
    const monthSessions = appointments.filter((a) => a.date >= monthAgo && a.date <= today && (a.status === 'completed' || a.status === 'confirmed')).length;

    // Abandonment: clients who haven't had a session in 14+ days
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
    const abandonedClients = filteredClients.filter((c) => {
      const clientSessions = sessions.filter((s) => s.clientId === c.id);
      if (clientSessions.length === 0) return c.createdAt < twoWeeksAgo;
      const lastSession = clientSessions.sort((a, b) => b.date.localeCompare(a.date))[0];
      return lastSession.date < twoWeeksAgo;
    });
    const abandonmentRate = totalClients > 0 ? Math.round((abandonedClients.length / totalClients) * 100) : 0;

    // ROL risk distribution
    const rolGreen = filteredClients.filter((c) => c.rolRisk === 'green').length;
    const rolYellow = filteredClients.filter((c) => c.rolRisk === 'yellow').length;
    const rolRed = filteredClients.filter((c) => c.rolRisk === 'red').length;

    return { totalClients, weekSessions, monthSessions, abandonmentRate, abandonedCount: abandonedClients.length, rolGreen, rolYellow, rolRed };
  }, [filteredClients, appointments, sessions]);

  const handleAddPsy = () => {
    if (!psyName || !psyEmail) return;
    addUser({
      id: `u_${Date.now()}`, email: psyEmail, name: psyName, role: 'psychologist', password: 'vantage2024', firstLogin: true,
    });
    const code = generateVerificationCode(psyEmail);
    setSentEmail(psyEmail);
    setSentCode(code);
    setShowForm(false);
    setPsyName('');
    setPsyEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Dashboard Clínico</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Métricas del área clínica</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select value={selectedPsy} onChange={(e) => setSelectedPsy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:border-cyan-400/50 cursor-pointer">
              <option value="all">Todos los psicólogos</option>
              {psychologists.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs hover:bg-cyan-400/20 transition-colors">
            <UserPlus className="w-3.5 h-3.5" /><span>Nuevo psicólogo</span>
          </button>
        </div>
      </div>

      {sentEmail && (
        <div className="card-surface rounded-xl p-4 border border-emerald-400/20 bg-emerald-400/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Psicólogo registrado</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Invitación enviada a <strong>{sentEmail}</strong></p>
          <div className="bg-black rounded-lg p-3 border border-white/10">
            <p className="text-xs text-muted-foreground mb-1">Simulación de correo:</p>
            <p className="text-sm font-mono-tech">Código: <span className="text-cyan-400 text-lg">{sentCode}</span></p>
            <p className="text-xs text-muted-foreground mt-1">Contraseña: <span className="text-amber-400">vantage2024</span></p>
          </div>
          <button onClick={() => { setSentEmail(''); setSentCode(''); }} className="mt-2 text-xs text-muted-foreground hover:text-white">Cerrar</button>
        </div>
      )}

      {showForm && (
        <div className="card-surface rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Registrar nuevo psicólogo</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Nombre</label>
              <input type="text" value={psyName} onChange={(e) => setPsyName(e.target.value)} placeholder="Ej. Christian Rendón"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Correo</label>
              <input type="email" value={psyEmail} onChange={(e) => setPsyEmail(e.target.value)} placeholder="psicologo@metodovantage.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
            </div>
          </div>
          <button onClick={handleAddPsy} disabled={!psyName || !psyEmail}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Mail className="w-4 h-4" />Enviar invitación
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Clientes activos" value={stats.totalClients} subtitle="En tratamiento" icon={Users} accent="cyan" />
        <KpiCard title="Sesiones esta semana" value={stats.weekSessions} subtitle="Últimos 7 días" icon={CalendarCheck} accent="emerald" />
        <KpiCard title="Sesiones este mes" value={stats.monthSessions} subtitle="Últimos 30 días" icon={Activity} accent="blue" />
        <KpiCard title="% Abandono" value={`${stats.abandonmentRate}%`} subtitle={`${stats.abandonedCount} clientes`} icon={TrendingDown}
          accent={stats.abandonmentRate > 20 ? 'red' : stats.abandonmentRate > 10 ? 'amber' : 'emerald'} />
      </div>

      {/* ROL Risk Distribution */}
      <div className="card-surface rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium">Niveles de riesgo ROL (Risk of Leaving)</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
            <p className="text-2xl font-mono-tech text-emerald-400">{stats.rolGreen}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Verde — Bajo riesgo</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-amber-400/5 border border-amber-400/10">
            <p className="text-2xl font-mono-tech text-amber-400">{stats.rolYellow}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Amarillo — Riesgo moderado</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-400/5 border border-red-400/10">
            <p className="text-2xl font-mono-tech text-red-400">{stats.rolRed}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Rojo — Alto riesgo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
