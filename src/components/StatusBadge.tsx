import type { LeadStatus, AppointmentStatus } from '@/types';
import { LEAD_STATUS_LABELS, APPOINTMENT_STATUS_LABELS, ROL_RISK_LABELS } from '@/types';

interface StatusBadgeProps {
  status: LeadStatus | AppointmentStatus | string;
  type: 'lead' | 'appointment' | 'rol';
  size?: 'sm' | 'md';
  className?: string;
}

const baseStyles = "inline-flex items-center rounded-full border font-medium";

const sizeStyles = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

const semanticStyles: Record<string, Record<string, string>> = {
  lead: {
    new: 'badge-info',
    contacted: 'badge-success',
    voicemail: 'badge-warning',
    no_answer: 'badge-error',
    not_qualified: 'badge-default',
    scheduled: 'badge-info',
  },
  appointment: {
    confirmed: 'badge-success',
    rescheduled: 'badge-warning',
    no_show: 'badge-error',
    completed: 'badge-info',
  },
  rol: {
    green: 'badge-success',
    yellow: 'badge-warning',
    red: 'badge-error',
  },
};

const labels: Record<string, Record<string, string>> = {
  lead: LEAD_STATUS_LABELS as Record<string, string>,
  appointment: APPOINTMENT_STATUS_LABELS as Record<string, string>,
  rol: ROL_RISK_LABELS as Record<string, string>,
};

export function StatusBadge({
  status,
  type,
  size = 'sm',
  className = ''
}: StatusBadgeProps) {

  const style = semanticStyles[type]?.[status] || 'badge-default';
  const label = labels[type]?.[status] || status;

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${style} ${className}`}>
      {label}
    </span>
  );
}