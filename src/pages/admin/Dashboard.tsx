import { useMemo } from 'react';
import { KpiCard } from '@/components/KpiCard';
import { getLeads, getClients, getAppointments, getTests, getSessions, getUsers, getSales, getClosers } from '@/services/storage';
import { Users, ClipboardList, CalendarCheck, FlaskConical, ShieldCheck, Activity, DollarSign, Target, Brain } from 'lucide-react';

export function AdminDashboard() {
  const stats = useMemo(() => {
    const leads = getLeads();
    const clients = getClients();
    const appointments = getAppointments();
    const tests = getTests();
    const sessions = getSessions();
    const users = getUsers();
    const sales = getSales();
    const closers = getClosers();
    const today = new Date().toISOString().split('T')[0];

    const totalLeads = leads.length;
    const totalClients = clients.length;
    const conversionRate = totalLeads > 0 ? Math.round((clients.length / totalLeads) * 100) : 0;
    const todayAppointments = appointments.filter((a) => a.date === today).length;

    const avgStress = tests.length > 0 ? Math.round(tests.reduce((acc, t) => {
      if (t.dassStress) return acc + (t.dassStress / 42) * 100;
      if (t.mbiExhaustion) return acc + (t.mbiExhaustion / 54) * 100;
      return acc;
    }, 0) / tests.length) : 0;

    const highRiskClients = clients.filter((c) => c.rolRisk === 'red').length;
    const yellowRiskClients = clients.filter((c) => c.rolRisk === 'yellow').length;
    const cashCollected = sales.filter((s) => !s.noShow).reduce((acc, s) => acc + s.upfrontValue, 0);
    const totalPackages = sales.filter((s) => !s.noShow).length;

    return {
      totalLeads, totalClients, conversionRate, todayAppointments,
      avgStress, highRiskClients, yellowRiskClients,
      totalSessions: sessions.length, totalTests: tests.length,
      setterCount: users.filter((u) => u.role === 'setter').length,
      psyCount: users.filter((u) => u.role === 'psychologist').length,
      closerCount: closers.length,
      adminCount: users.filter((u) => u.role === 'admin').length,
      cashCollected, totalPackages,
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Panel de Administración</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Vista consolidada de todas las operaciones</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-400">Administrador</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Cash Collected" value={`$${stats.cashCollected.toLocaleString()}`} subtitle="Ingresos totales" icon={DollarSign} accent="emerald" />
        <KpiCard title="Paquetes vendidos" value={stats.totalPackages} subtitle="Ventas completadas" icon={Target} accent="cyan" />
        <KpiCard title="Clientes activos" value={stats.totalClients} subtitle="En tratamiento" icon={Users} accent="blue" />
        <KpiCard title="Citas hoy" value={stats.todayAppointments} subtitle="Consultas programadas" icon={CalendarCheck} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Solicitudes totales" value={stats.totalLeads} subtitle="Leads registrados" icon={ClipboardList} accent="cyan" />
        <KpiCard title="Tasa de conversión" value={`${stats.conversionRate}%`} subtitle="Leads a clientes" icon={Activity} accent="blue" />
        <KpiCard title="Riesgo ROL alto" value={stats.highRiskClients} subtitle="Atención prioritaria" icon={Brain} accent="red" />
        <KpiCard title="Evaluaciones" value={stats.totalTests} subtitle="Pruebas aplicadas" icon={FlaskConical} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-surface rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">Equipo Vantage</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xl font-mono-tech text-cyan-400">{stats.adminCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Admins</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xl font-mono-tech text-blue-400">{stats.psyCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Psicólogos</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xl font-mono-tech text-amber-400">{stats.closerCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Closers</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xl font-mono-tech text-emerald-400">{stats.setterCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Setters</p>
            </div>
          </div>
        </div>

        <div className="card-surface rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">Distribución ROL</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
              <p className="text-xl font-mono-tech text-emerald-400">{stats.totalClients - stats.highRiskClients - stats.yellowRiskClients}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Verde</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-400/5 border border-amber-400/10">
              <p className="text-xl font-mono-tech text-amber-400">{stats.yellowRiskClients}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Amarillo</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-400/5 border border-red-400/10">
              <p className="text-xl font-mono-tech text-red-400">{stats.highRiskClients}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Rojo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
