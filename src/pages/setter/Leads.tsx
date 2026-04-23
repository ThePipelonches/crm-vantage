import { useState, useMemo } from 'react';
import { getLeads, updateLead, getUsers, addClient, addAppointment } from '@/services/storage';
import { StatusBadge } from '@/components/StatusBadge';
import type { LeadStatus } from '@/types';
import { LEAD_ORIGIN_LABELS } from '@/types';
import { Phone, Clock, Search, Filter, CheckCircle2, XCircle, Voicemail, UserX, CalendarPlus, MessageCircle, ClipboardList } from 'lucide-react';

export function LeadsPage() {
  const [leads, setLeads] = useState(getLeads());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [contactNote, setContactNote] = useState('');

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch = !search || l.fullName.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const handleStartContact = (id: string) => {
    updateLead(id, { contactedAt: new Date().toISOString() });
    setLeads(getLeads());
  };

  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, '').replace(/^52/, '');
    window.open(`https://wa.me/52${clean}`, '_blank');
  };

  const handleStatusChange = (id: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    if (status === 'scheduled') {
      const psychologists = getUsers().filter((u) => u.role === 'psychologist');
      const psyId = psychologists[0]?.id || 'u4';
      const psyName = psychologists[0]?.name || 'Christian Rendón';

      const newClient = {
        id: `c_${Date.now()}`, fullName: lead.fullName, phone: lead.phone, email: lead.email,
        psychologistId: psyId, psychologistName: psyName,
        consultationReason: 'Por determinar en primera sesión',
        packageType: 'individual' as const, totalSessions: 1, completedSessions: 0,
        paymentStatus: 'compromised' as const, rolRisk: 'green' as const,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      addClient(newClient);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      addAppointment({
        id: `a_${Date.now()}`, clientId: newClient.id, clientName: newClient.fullName,
        psychologistId: psyId, date: tomorrow.toISOString().split('T')[0], time: '10:00',
        duration: 60, status: 'confirmed', createdAt: new Date().toISOString(),
      });
    }

    updateLead(id, { status, notes: contactNote || undefined });
    setLeads(getLeads());
    setExpandedLead(null);
    setContactNote('');
  };

  const getResponseTime = (lead: (typeof leads)[0]) => {
    if (lead.contactedAt) {
      const diff = new Date(lead.contactedAt).getTime() - new Date(lead.createdAt).getTime();
      return { mins: Math.round(diff / 60000), onTime: diff <= 5 * 60000 };
    }
    const diff = Date.now() - new Date(lead.createdAt).getTime();
    return { mins: Math.round(diff / 60000), onTime: diff <= 5 * 60000 };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Setter</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión de solicitudes entrantes — Regla de contacto: 5 minutos</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:border-cyan-400/50 cursor-pointer">
            <option value="all">Todos</option><option value="new">Nuevos</option><option value="contacted">Contactados</option>
            <option value="scheduled">Agendados</option><option value="no_answer">No contesta</option>
            <option value="voicemail">Buzón</option><option value="not_qualified">No califica</option>
          </select>
        </div>
      </div>

      <div className="card-surface rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Nombre</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Contacto</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Origen</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Estado</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Tiempo</th>
                <th className="text-left text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((lead) => {
                const resp = getResponseTime(lead);
                const isExpanded = expandedLead === lead.id;
                const borderColor = lead.contactedAt
                  ? resp.onTime ? 'border-l-emerald-400' : 'border-l-amber-400'
                  : !resp.onTime ? 'border-l-red-400' : 'border-l-transparent';

                return (
                  <>
                    <tr key={lead.id} className={`hover:bg-white/[0.02] transition-colors border-l-2 ${borderColor}`}>
                      <td className="px-4 py-3"><p className="text-sm font-medium">{lead.fullName}</p></td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{lead.phone}</div>
                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{LEAD_ORIGIN_LABELS[lead.origin]}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={lead.status} type="lead" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className={`text-xs font-mono-tech ${resp.onTime ? 'text-emerald-400' : 'text-red-400'}`}>{resp.mins}m</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {lead.status === 'new' ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { handleStartContact(lead.id); setExpandedLead(lead.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs hover:bg-cyan-400/20 transition-colors">
                              <Phone className="w-3.5 h-3.5" /><span>Iniciar contacto</span>
                            </button>
                            <button onClick={() => openWhatsApp(lead.phone)}
                              className="p-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                              title="Abrir WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                              className="text-xs text-muted-foreground hover:text-white transition-colors px-2 py-1">
                              {isExpanded ? 'Cerrar' : 'Gestionar'}
                            </button>
                            <button onClick={() => openWhatsApp(lead.phone)}
                              className="p-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                              title="Abrir WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${lead.id}-expanded`}>
                        <td colSpan={6} className="px-4 py-4 bg-white/[0.02]">
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground mb-2">Resultado del contacto:</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { status: 'contacted' as LeadStatus, label: 'Contactado', icon: CheckCircle2, color: 'emerald' },
                                { status: 'voicemail' as LeadStatus, label: 'Buzón', icon: Voicemail, color: 'amber' },
                                { status: 'no_answer' as LeadStatus, label: 'No contesta', icon: XCircle, color: 'red' },
                                { status: 'not_qualified' as LeadStatus, label: 'No califica', icon: UserX, color: 'muted' },
                                { status: 'scheduled' as LeadStatus, label: 'Contactado y Agendado', icon: CalendarPlus, color: 'blue' },
                              ].map((opt) => (
                                <button key={opt.status} onClick={() => handleStatusChange(lead.id, opt.status)}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg bg-${opt.color}-400/10 border border-${opt.color}-400/20 text-${opt.color === 'muted' ? 'muted-foreground' : opt.color + '-400'} text-xs hover:bg-${opt.color}-400/20 transition-colors`}>
                                  <opt.icon className="w-3.5 h-3.5" />{opt.label}
                                </button>
                              ))}
                            </div>
                            <textarea value={contactNote} onChange={(e) => setContactNote(e.target.value)} placeholder="Notas de contacto..."
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 resize-none h-20" />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron solicitudes</p>
          </div>
        )}
      </div>
    </div>
  );
}
