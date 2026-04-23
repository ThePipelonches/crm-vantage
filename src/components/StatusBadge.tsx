import type { LeadStatus, AppointmentStatus } from '@/types';
import { LEAD_STATUS_LABELS, APPOINTMENT_STATUS_LABELS, ROL_RISK_LABELS } from '@/types';

interface StatusBadgeProps {
  status: LeadStatus | AppointmentStatus | string;
  type: 'lead' | 'appointment' | 'rol';
  size?: 'sm' | 'md';
}

const styles: Record<string, Record<string, string>> = {
  lead: {
    new: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
    contacted: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    voicemail: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    no_answer: 'bg-red-400/10 text-red-400 border-red-400/20',
    not_qualified: 'bg-muted/20 text-muted-foreground border-white/10',
    scheduled: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  },
  appointment: {
    confirmed: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    rescheduled: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    no_show: 'bg-red-400/10 text-red-400 border-red-400/20',
    completed: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  },
  rol: {
    green: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    yellow: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    red: 'bg-red-400/10 text-red-400 border-red-400/20',
  },
};

const labels: Record<string, Record<string, string>> = {
  lead: LEAD_STATUS_LABELS as Record<string, string>,
  appointment: APPOINTMENT_STATUS_LABELS as Record<string, string>,
  rol: ROL_RISK_LABELS as Record<string, string>,
};

export function StatusBadge({ status, type, size = 'sm' }: StatusBadgeProps) {
  const style = styles[type]?.[status] || styles.lead.new;
  const label = labels[type]?.[status] || status;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${style}`}>
      {label}
    </span>
  );
}
