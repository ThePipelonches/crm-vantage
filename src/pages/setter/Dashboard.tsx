import { useMemo } from 'react';
import { KpiCard } from '@/components/KpiCard';
import { getLeads, getAppointments } from '@/services/storage';
import { ClipboardList, Timer, Phone, CalendarCheck, AlertTriangle } from 'lucide-react';

export function SetterDashboard() {
  const stats = useMemo(() => {
    const leads = getLeads();
    const appointments = getAppointments();
    const today = new Date().toISOString().split('T')[0];

    const todayLeads = leads.filter((l) => l.createdAt.startsWith(today));
    const fiveMinLeads = todayLeads.filter((l) => {
      if (!l.contactedAt) return false;
      const created = new Date(l.createdAt).getTime();
      const contacted = new Date(l.contactedAt).getTime();
      return (contacted - created) <= 5 * 60000;
    });
    const contactedLeads = leads.filter((l) => l.status === 'contacted' || l.status === 'scheduled');
    const todayAppointments = appointments.filter((a) => a.date === today);
    const overdueLeads = todayLeads.filter((l) => {
      if (l.contactedAt) return false;
      const created = new Date(l.createdAt).getTime();
      return (Date.now() - created) > 5 * 60000;
    });

    const fiveMinRate = todayLeads.length > 0
      ? Math.round((fiveMinLeads.length / todayLeads.length) * 100) : 100;
    const contactRate = leads.length > 0
      ? Math.round((contactedLeads.length / leads.length) * 100) : 0;

    return { newLeads: todayLeads.length, fiveMinRate, contactRate, scheduledAppointments: todayAppointments.length, overdueLeads };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Centro de control del Setter</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Nuevas solicitudes hoy" value={stats.newLeads} subtitle="Solicitudes entrantes" icon={ClipboardList} accent="cyan" />
        <KpiCard title="Regla de 5 min" value={`${stats.fiveMinRate}%`} subtitle="Tasa de cumplimiento" icon={Timer}
          accent={stats.fiveMinRate >= 80 ? 'emerald' : 'amber'} trend={{ value: `${stats.fiveMinRate}%`, positive: stats.fiveMinRate >= 80 }} />
        <KpiCard title="Tasa de contacto" value={`${stats.contactRate}%`} subtitle="Ejecutivos contactados" icon={Phone} accent="blue" />
        <KpiCard title="Consultas hoy" value={stats.scheduledAppointments} subtitle="Citas agendadas" icon={CalendarCheck} accent="emerald" />
      </div>

      {stats.overdueLeads.length > 0 && (
        <div className="card-surface rounded-xl p-4 border-l-2 border-l-red-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-medium text-red-400">Alertas de Tiempo de Respuesta</h3>
          </div>
          <div className="space-y-2">
            {stats.overdueLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium">{lead.fullName}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                </div>
                <span className="text-xs font-mono-tech text-red-400">+{Math.round((Date.now() - new Date(lead.createdAt).getTime()) / 60000)} min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-surface rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Protocolo de Contacto VIP</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Contacto < 5 min', desc: 'Los ejecutivos no esperan. Contacto inmediato es obligatorio.' },
            { step: '2', title: 'Evaluación de calidad', desc: 'Confirmar perfil de alto rendimiento y motivo de consulta.' },
            { step: '3', title: 'Agendamiento VIP', desc: 'Coordinar horario preferencial. Confirmar recordatorio previo.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-mono-tech text-cyan-400">{item.step}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
