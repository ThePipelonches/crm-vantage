export type UserRole = 'setter' | 'psychologist' | 'closer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
  firstLogin?: boolean;
}

export type LeadStatus = 'new' | 'contacted' | 'voicemail' | 'no_answer' | 'not_qualified' | 'scheduled';
export type LeadOrigin = 'web' | 'referral' | 'corporate' | 'direct' | 'social' | 'calendly';

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  origin: LeadOrigin;
  status: LeadStatus;
  createdAt: string;
  contactedAt?: string;
  scheduledAt?: string;
  notes?: string;
  closerId?: string;
  fathomLink?: string;
}

export type AppointmentStatus = 'confirmed' | 'rescheduled' | 'no_show' | 'completed';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  psychologistId: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export type PackageType = 'individual' | 'basic' | 'intensive' | 'executive';
export type PaymentStatus = 'complete' | 'compromised';

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  psychologistId: string;
  psychologistName: string;
  consultationReason: string;
  packageType: PackageType;
  totalSessions: number;
  completedSessions: number;
  paymentStatus: PaymentStatus;
  rolRisk: 'green' | 'yellow' | 'red';
  createdAt: string;
  updatedAt: string;
}

export type TestCategory = 'pre' | 'post';

export type TestType = 'dass21' | 'mbi' | 'pcq';

export interface PsychometricTest {
  id: string;
  clientId: string;
  psychologistId: string;
  name: TestType;
  category: TestCategory;
  date: string;
  // DASS-21 scores
  dassStress?: number;
  dassAnxiety?: number;
  dassDepression?: number;
  // MBI scores
  mbiExhaustion?: number;
  mbiDepersonalization?: number;
  mbiPersonalAccomplishment?: number;
  // PCQ scores
  pcqSelfEfficacy?: number;
  pcqHope?: number;
  pcqResilience?: number;
  pcqOptimism?: number;
  // Raw items for DASS-21 (21 items, 0-3 each)
  dassItems?: number[];
  // Raw items for MBI (22 items, 0-6 each)
  mbiItems?: number[];
  // Raw items for PCQ (24 items, 1-6 each)
  pcqItems?: number[];
  createdAt: string;
}

export interface Session {
  id: string;
  clientId: string;
  psychologistId: string;
  date: string;
  evolutionNotes: string;
  tasks: string;
  createdAt: string;
}

// Closer sales data
export interface Closer {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  closerId: string;
  clientName: string;
  packageType: PackageType;
  upfrontValue: number;
  totalValue: number;
  callDate: string;
  fathomLink?: string;
  noShow: boolean;
  createdAt: string;
}

export const TEST_TYPE_LABELS: Record<TestType, string> = {
  dass21: 'DASS-21',
  mbi: 'MBI - Burnout',
  pcq: 'PCQ - Capital Psicológico',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  voicemail: 'Buzón',
  no_answer: 'No contesta',
  not_qualified: 'No califica',
  scheduled: 'Agendado',
};

export const LEAD_ORIGIN_LABELS: Record<LeadOrigin, string> = {
  web: 'Web',
  referral: 'Referido',
  corporate: 'Corporativo',
  direct: 'Directo',
  social: 'Redes Sociales',
  calendly: 'Calendly',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmada',
  rescheduled: 'Reagendada',
  no_show: 'No Show',
  completed: 'Completada',
};

export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  individual: 'Individual',
  basic: 'Básico',
  intensive: 'Intensivo',
  executive: 'Ejecutivo',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  complete: 'Completo',
  compromised: 'Comprometido',
};

export const ROL_RISK_LABELS: Record<string, string> = {
  green: 'Bajo riesgo',
  yellow: 'Riesgo moderado',
  red: 'Alto riesgo',
};

// DASS-21 scoring
export function calculateDASS21(items: number[]): { stress: number; anxiety: number; depression: number } {
  // items is array of 21 values (0-3)
  const stressItems = [0, 3, 7, 8, 10, 11, 13, 17].map(i => items[i] || 0);
  const anxietyItems = [2, 4, 5, 14, 18, 20].map(i => items[i] || 0);
  const depressionItems = [1, 6, 9, 12, 15, 16, 19].map(i => items[i] || 0);
  return {
    stress: stressItems.reduce((a, b) => a + b, 0) * 2,
    anxiety: anxietyItems.reduce((a, b) => a + b, 0) * 2,
    depression: depressionItems.reduce((a, b) => a + b, 0) * 2,
  };
}

// MBI scoring
export function calculateMBI(items: number[]): { exhaustion: number; depersonalization: number; personalAccomplishment: number } {
  // items is array of 22 values (0-6)
  // EE: items 1,2,3,6,8,13,14,16,20 (indices 0,1,2,5,7,12,13,15,19)
  // DP: items 5,10,11,15,22 (indices 4,9,10,14,21)
  // PA: items 4,7,9,12,17,18,19,21 (indices 3,6,8,11,16,17,18,20)
  const eeIndices = [0,1,2,5,7,12,13,15,19];
  const dpIndices = [4,9,10,14,21];
  const paIndices = [3,6,8,11,16,17,18,20];
  return {
    exhaustion: eeIndices.map(i => items[i] || 0).reduce((a, b) => a + b, 0),
    depersonalization: dpIndices.map(i => items[i] || 0).reduce((a, b) => a + b, 0),
    personalAccomplishment: paIndices.map(i => items[i] || 0).reduce((a, b) => a + b, 0),
  };
}

// PCQ scoring
export function calculatePCQ(items: number[]): { selfEfficacy: number; hope: number; resilience: number; optimism: number } {
  // items is array of 24 values (1-6)
  // Self-efficacy: items 1,2,3,4,5,6 (indices 0-5)
  // Hope: items 7,8,9,10,11,12 (indices 6-11)
  // Resilience: items 13,14,15,16,17,18 (indices 12-17)
  // Optimism: items 19,20,21,22,23,24 (indices 18-23)
  const se = items.slice(0, 6).reduce((a, b) => a + (b || 0), 0) / 6;
  const hope = items.slice(6, 12).reduce((a, b) => a + (b || 0), 0) / 6;
  const resilience = items.slice(12, 18).reduce((a, b) => a + (b || 0), 0) / 6;
  const optimism = items.slice(18, 24).reduce((a, b) => a + (b || 0), 0) / 6;
  return { selfEfficacy: se, hope, resilience, optimism };
}

export function getDASS21StressLevel(score: number): string {
  if (score <= 14) return 'Normal';
  if (score <= 18) return 'Leve';
  if (score <= 25) return 'Moderado';
  return 'Severo';
}

export function getDASS21AnxietyLevel(score: number): string {
  if (score <= 7) return 'Normal';
  if (score <= 9) return 'Leve';
  if (score <= 14) return 'Moderado';
  return 'Severo';
}

export function getDASS21DepressionLevel(score: number): string {
  if (score <= 9) return 'Normal';
  if (score <= 13) return 'Leve';
  if (score <= 20) return 'Moderado';
  return 'Severo';
}

export function getMBIExhaustionLevel(score: number): string {
  if (score <= 16) return 'Bajo';
  if (score <= 26) return 'Medio';
  return 'Alto';
}

export function getMBIDepersonalizationLevel(score: number): string {
  if (score <= 6) return 'Bajo';
  if (score <= 12) return 'Medio';
  return 'Alto';
}

export function getMBIPersonalAccomplishmentLevel(score: number): string {
  if (score >= 39) return 'Alto (bueno)';
  if (score >= 32) return 'Medio';
  return 'Bajo (riesgo)';
}

export function getPCQLevel(score: number): string {
  if (score >= 6) return 'Alto';
  if (score >= 4.5) return 'Medio';
  return 'Bajo (alerta)';
}
