import { useState, useMemo } from 'react';
import { getAppointments, updateAppointment } from '@/services/storage';
import { StatusBadge } from '@/components/StatusBadge';
import type { AppointmentStatus } from '@/types';
import { CalendarDays, Search, XCircle, RotateCcw, UserCheck, Clock } from 'lucide-react';

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState(getAppointments());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'tomorrow' | 'today' | 'upcoming'>('all');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchesSearch = !search || a.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || (filter === 'today' && a.date === today) ||
        (filter === 'tomorrow' && a.date === tomorrow) || (filter === 'upcoming' && a.date >= today);
      return matchesSearch && matchesFilter;
    }).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [appointments, search, filter, today, tomorrow]);

  const changeStatus = (id: string, status: AppointmentStatus) => {
    updateAppointment(id, { status });
    setAppointments(getAppointments());
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Consultas</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Agenda de citas ejecutivas</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
        </div>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:border-cyan-400/50 cursor-pointer">
            <option value="all">Todas</option><option value="today">Hoy</option><option value="tomorrow">Mañana</option><option value="upcoming">Próximas</option>
          </select>
        </div>
      </div>

      <div className="card-surface rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Cliente</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Fecha y hora</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Duración</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Estado</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((appt) => (
                <tr key={appt.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><p className="text-sm font-medium">{appt.clientName}</p></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{appt.date}</span>
                      <span className="text-xs font-mono-tech text-cyan-400">{appt.time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-sm">{appt.duration} min</span></td>
                  <td className="px-4 py-3"><StatusBadge status={appt.status} type="appointment" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {appt.status === 'confirmed' && (
                        <>
                          <button onClick={() => changeStatus(appt.id, 'completed')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-emerald-400" title="Completada"><UserCheck className="w-4 h-4" /></button>
                          <button onClick={() => changeStatus(appt.id, 'rescheduled')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-amber-400" title="Reagendada"><RotateCcw className="w-4 h-4" /></button>
                          <button onClick={() => changeStatus(appt.id, 'no_show')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-red-400" title="No Show"><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay citas para este filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}
