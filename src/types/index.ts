//////////////////////////////////////////////////
// ROLES
//////////////////////////////////////////////////

export type UserRole = 'setter' | 'closer' | 'psychologist' | 'admin';

//////////////////////////////////////////////////
// USER
//////////////////////////////////////////////////

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
  mustChangePassword?: boolean;
}

//////////////////////////////////////////////////
// LEADS
//////////////////////////////////////////////////

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'voicemail'
  | 'no_answer'
  | 'not_qualified'
  | 'scheduled';

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  status: LeadStatus;

  createdAt?: string;
  contactedAt?: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  voicemail: 'Buzón',
  no_answer: 'No responde',
  not_qualified: 'No calificado',
  scheduled: 'Agendado',
};

//////////////////////////////////////////////////
// CLIENTS
//////////////////////////////////////////////////

export type RolRisk = 'green' | 'yellow' | 'red';

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;

  psychologistId: string;
  psychologistName: string;

  consultationReason?: string;

  packageType: string;
  totalSessions: number;
  completedSessions: number;
  paymentStatus: string;

  rolRisk: RolRisk;

  createdAt: string;
  updatedAt: string;
  lastRolUpdate?: string;
}

export const ROL_RISK_LABELS: Record<RolRisk, string> = {
  green: 'Bajo',
  yellow: 'Medio',
  red: 'Alto',
};

//////////////////////////////////////////////////
// APPOINTMENTS
//////////////////////////////////////////////////

export type AppointmentStatus =
  | 'confirmed'
  | 'rescheduled'
  | 'no_show'
  | 'completed';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;

  date: string;
  time: string;
  duration: number;

  status: AppointmentStatus;
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmada',
  rescheduled: 'Reprogramada',
  no_show: 'No asistió',
  completed: 'Completada',
};

//////////////////////////////////////////////////
// SESSIONS
//////////////////////////////////////////////////

export interface Session {
  id: string;
  clientId: string;
  date: string;
  notes?: string;
}

//////////////////////////////////////////////////
// PSYCHOMETRIC
//////////////////////////////////////////////////

export interface PsychometricTest {
  id: string;
  clientId: string;
  type: string;
  result?: string;
}

//////////////////////////////////////////////////
// CLOSERS
//////////////////////////////////////////////////

export interface Closer {
  id: string;
  name: string;
  email: string;
  active?: boolean;
  createdAt?: string;
}

//////////////////////////////////////////////////
// SALES
//////////////////////////////////////////////////

export interface SaleRecord {
  id: string;

  clientName: string;
  closerId: string;

  packageType: string;
  upfrontValue: number;

  callDate: string;
  noShow: boolean;

  fathomLink?: string;
}

export const PACKAGE_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
};