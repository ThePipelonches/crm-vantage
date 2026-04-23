import type {
  User, Lead, Client, Appointment, Session,
  PsychometricTest, Closer, SaleRecord,
} from '@/types';

const KEYS = {
  USERS: 'vantage_users',
  LEADS: 'vantage_leads',
  CLIENTS: 'vantage_clients',
  APPOINTMENTS: 'vantage_appointments',
  SESSIONS: 'vantage_sessions',
  TESTS: 'vantage_tests',
  CLOSERS: 'vantage_closers',
  SALES: 'vantage_sales',
  CURRENT_USER: 'vantage_current_user',
  VERIFICATION_CODES: 'vantage_verification_codes',
  INITIALIZED: 'vantage_initialized',
};

function seedData() {
  // Real users
  const users: User[] = [
    { id: 'u1', email: 'andresclinicapsicologica@gmail.com', name: 'Andrés', role: 'admin', password: 'vantage2024', firstLogin: true },
    { id: 'u2', email: 'chav.negocios@gmail.com', name: 'Chav', role: 'admin', password: 'vantage2024', firstLogin: true },
    { id: 'u3', email: 'sebastian@bbr.mx', name: 'Sebastián', role: 'admin', password: 'vantage2024', firstLogin: true },
    { id: 'u4', email: 'christian@metodovantage.com', name: 'Christian Rendón', role: 'psychologist', password: 'vantage2024', firstLogin: true },
    { id: 'u5', email: 'valentina@metodovantage.com', name: 'Valentina Ríos', role: 'psychologist', password: 'vantage2024', firstLogin: true },
    { id: 'u6', email: 'isabel@metodovantage.com', name: 'María Isabel', role: 'closer', password: 'vantage2024', firstLogin: true },
    { id: 'u7', email: 'setter@metodovantage.com', name: 'Setter Vantage', role: 'setter', password: 'vantage2024', firstLogin: false },
  ];

  const closers: Closer[] = [
    { id: 'cl1', name: 'María Isabel', email: 'isabel@metodovantage.com', active: true, createdAt: new Date().toISOString() },
  ];

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
  const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

  const leads: Lead[] = [
    {
      id: 'l1', fullName: 'Alejandro Rueda', phone: '+52 55 1234 5678', email: 'a.rueda@email.com',
      origin: 'calendly', status: 'new', createdAt: new Date(now.getTime() - 3 * 60000).toISOString(),
    },
    {
      id: 'l2', fullName: 'Diana Montoya', phone: '+52 55 2345 6789', email: 'd.montoya@email.com',
      origin: 'referral', status: 'new', createdAt: new Date(now.getTime() - 12 * 60000).toISOString(),
    },
    {
      id: 'l3', fullName: 'Roberto Cienfuegos', phone: '+52 55 3456 7890', email: 'r.cien@email.com',
      origin: 'web', status: 'contacted', createdAt: yesterday, contactedAt: yesterday,
    },
    {
      id: 'l4', fullName: 'Sofia Herrera', phone: '+52 55 4567 8901', email: 's.herrera@email.com',
      origin: 'calendly', status: 'scheduled', createdAt: twoDaysAgo, contactedAt: twoDaysAgo, scheduledAt: twoDaysAgo,
      closerId: 'cl1',
    },
    {
      id: 'l5', fullName: 'Fernando Valle', phone: '+52 55 5678 9012', email: 'f.valle@email.com',
      origin: 'direct', status: 'no_answer', createdAt: yesterday, contactedAt: yesterday,
    },
  ];

  const clients: Client[] = [
    {
      id: 'c1', fullName: 'Sofia Herrera', phone: '+52 55 4567 8901', email: 's.herrera@email.com',
      psychologistId: 'u4', psychologistName: 'Christian Rendón',
      consultationReason: 'Toma de decisiones bajo presión, dificultad para delegar',
      packageType: 'basic', totalSessions: 12, completedSessions: 3, paymentStatus: 'complete', rolRisk: 'yellow',
      createdAt: twoDaysAgo, updatedAt: twoDaysAgo,
    },
    {
      id: 'c2', fullName: 'Eduardo Mansilla', phone: '+52 55 6789 0123', email: 'e.mansilla@email.com',
      psychologistId: 'u4', psychologistName: 'Christian Rendón',
      consultationReason: 'Burnout severo, aislamiento social, irritabilidad crónica',
      packageType: 'intensive', totalSessions: 20, completedSessions: 8, paymentStatus: 'compromised', rolRisk: 'red',
      createdAt: lastWeek, updatedAt: yesterday,
    },
    {
      id: 'c3', fullName: 'Camila Restrepo', phone: '+52 55 7890 1234', email: 'c.restrepo@email.com',
      psychologistId: 'u5', psychologistName: 'Valentina Ríos',
      consultationReason: 'Manejo de equipos de alta exigencia, comunicación asertiva',
      packageType: 'executive', totalSessions: 24, completedSessions: 18, paymentStatus: 'complete', rolRisk: 'green',
      createdAt: lastWeek, updatedAt: yesterday,
    },
    {
      id: 'c4', fullName: 'Martín Paredes', phone: '+52 55 8901 2345', email: 'm.paredes@email.com',
      psychologistId: 'u5', psychologistName: 'Valentina Ríos',
      consultationReason: 'Transición a rol de liderazgo, síndrome del impostor',
      packageType: 'basic', totalSessions: 12, completedSessions: 1, paymentStatus: 'compromised', rolRisk: 'yellow',
      createdAt: threeDaysAgo, updatedAt: threeDaysAgo,
    },
  ];

  const appointments: Appointment[] = [
    { id: 'a1', clientId: 'c1', clientName: 'Sofia Herrera', psychologistId: 'u4', date: tomorrow, time: '09:00', duration: 60, status: 'confirmed', createdAt: yesterday },
    { id: 'a2', clientId: 'c2', clientName: 'Eduardo Mansilla', psychologistId: 'u4', date: tomorrow, time: '11:00', duration: 90, status: 'confirmed', createdAt: yesterday },
    { id: 'a3', clientId: 'c3', clientName: 'Camila Restrepo', psychologistId: 'u5', date: today, time: '15:00', duration: 60, status: 'confirmed', createdAt: twoDaysAgo },
    { id: 'a4', clientId: 'c1', clientName: 'Sofia Herrera', psychologistId: 'u4', date: today, time: '10:00', duration: 60, status: 'completed', createdAt: twoDaysAgo },
    { id: 'a5', clientId: 'c2', clientName: 'Eduardo Mansilla', psychologistId: 'u4', date: yesterday.split('T')[0], time: '14:00', duration: 90, status: 'completed', createdAt: lastWeek },
    { id: 'a6', clientId: 'c4', clientName: 'Martín Paredes', psychologistId: 'u5', date: yesterday.split('T')[0], time: '16:00', duration: 60, status: 'no_show', createdAt: lastWeek },
  ];

  const sessions: Session[] = [
    { id: 's1', clientId: 'c1', psychologistId: 'u4', date: today, evolutionNotes: 'Primera sesión. Presenta alta resistencia inicial. Logró identificar 3 triggers principales de estrés.', tasks: 'Practicar breathing exercise 2x/día.', createdAt: now.toISOString() },
    { id: 's2', clientId: 'c2', psychologistId: 'u4', date: yesterday.split('T')[0], evolutionNotes: 'Segunda sesión. Reporta mejoría en sueño. Aún presenta irritabilidad en contextos familiares.', tasks: 'Ejercicio de delegación con 1 tarea esta semana.', createdAt: yesterday },
    { id: 's3', clientId: 'c3', psychologistId: 'u5', date: yesterday.split('T')[0], evolutionNotes: 'Sesión de cierre de fase intermedia. Excelente progreso en comunicación asertiva.', tasks: 'Continuar práctica de feedback constructivo.', createdAt: yesterday },
  ];

  // Seed psychometric tests
  const tests: PsychometricTest[] = [
    {
      id: 't1', clientId: 'c2', psychologistId: 'u4', name: 'dass21', category: 'pre',
      date: lastWeek.split('T')[0], dassStress: 28, dassAnxiety: 18, dassDepression: 24,
      createdAt: lastWeek,
    },
    {
      id: 't2', clientId: 'c2', psychologistId: 'u4', name: 'mbi', category: 'pre',
      date: lastWeek.split('T')[0], mbiExhaustion: 32, mbiDepersonalization: 14, mbiPersonalAccomplishment: 28,
      createdAt: lastWeek,
    },
    {
      id: 't3', clientId: 'c2', psychologistId: 'u4', name: 'dass21', category: 'post',
      date: yesterday.split('T')[0], dassStress: 22, dassAnxiety: 14, dassDepression: 18,
      createdAt: yesterday,
    },
    {
      id: 't4', clientId: 'c3', psychologistId: 'u5', name: 'pcq', category: 'pre',
      date: lastWeek.split('T')[0], pcqSelfEfficacy: 5.2, pcqHope: 4.8, pcqResilience: 5.5, pcqOptimism: 4.2,
      createdAt: lastWeek,
    },
  ];

  // Seed sales records
  const sales: SaleRecord[] = [
    { id: 'sl1', closerId: 'cl1', clientName: 'Sofia Herrera', packageType: 'basic', upfrontValue: 15000, totalValue: 36000, callDate: twoDaysAgo.split('T')[0], fathomLink: 'https://fathom.video/share/abc123', noShow: false, createdAt: twoDaysAgo },
    { id: 'sl2', closerId: 'cl1', clientName: 'Eduardo Mansilla', packageType: 'intensive', upfrontValue: 25000, totalValue: 60000, callDate: lastWeek.split('T')[0], fathomLink: 'https://fathom.video/share/def456', noShow: false, createdAt: lastWeek },
    { id: 'sl3', closerId: 'cl1', clientName: 'Camila Restrepo', packageType: 'executive', upfrontValue: 35000, totalValue: 90000, callDate: lastWeek.split('T')[0], fathomLink: 'https://fathom.video/share/ghi789', noShow: false, createdAt: lastWeek },
    { id: 'sl4', closerId: 'cl1', clientName: 'Cliente Potencial', packageType: 'basic', upfrontValue: 0, totalValue: 36000, callDate: yesterday.split('T')[0], noShow: true, createdAt: yesterday },
  ];

  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  localStorage.setItem(KEYS.TESTS, JSON.stringify(tests));
  localStorage.setItem(KEYS.CLOSERS, JSON.stringify(closers));
  localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  localStorage.setItem(KEYS.INITIALIZED, 'true');
}

function init() {
  if (!localStorage.getItem(KEYS.INITIALIZED)) {
    seedData();
  }
}

// ============ USERS ============
export function getUsers(): User[] { init(); return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'); }

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  return users[idx];
}

export function addUser(user: User): User {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  return user;
}

// ============ AUTH ============
export function authenticateUser(email: string, password: string): User | null {
  init();
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (user) {
    const { password: _, ...safeUser } = user;
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
    return safeUser as User;
  }
  return null;
}

export function getCurrentUser(): User | null {
  init();
  const stored = localStorage.getItem(KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
}

export function logoutUser() {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

// Verification codes
export function generateVerificationCode(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codes = JSON.parse(localStorage.getItem(KEYS.VERIFICATION_CODES) || '{}');
  codes[email.toLowerCase()] = { code, expires: Date.now() + 10 * 60000 }; // 10 min
  localStorage.setItem(KEYS.VERIFICATION_CODES, JSON.stringify(codes));
  return code;
}

export function verifyCode(email: string, code: string): boolean {
  const codes = JSON.parse(localStorage.getItem(KEYS.VERIFICATION_CODES) || '{}');
  const entry = codes[email.toLowerCase()];
  if (!entry) return false;
  if (Date.now() > entry.expires) return false;
  return entry.code === code;
}

export function clearVerificationCode(email: string) {
  const codes = JSON.parse(localStorage.getItem(KEYS.VERIFICATION_CODES) || '{}');
  delete codes[email.toLowerCase()];
  localStorage.setItem(KEYS.VERIFICATION_CODES, JSON.stringify(codes));
}

// ============ LEADS ============
export function getLeads(): Lead[] { init(); return JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]'); }
export function getLeadById(id: string): Lead | undefined { return getLeads().find((l) => l.id === id); }
export function addLead(lead: Lead): Lead {
  const leads = getLeads();
  leads.unshift(lead);
  localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
  return lead;
}
export function updateLead(id: string, updates: Partial<Lead>): Lead | null {
  const leads = getLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...updates };
  localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
  return leads[idx];
}

// ============ CLIENTS ============
export function getClients(): Client[] { init(); return JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]'); }
export function getClientById(id: string): Client | undefined { return getClients().find((c) => c.id === id); }
export function addClient(client: Client): Client {
  const clients = getClients();
  clients.unshift(client);
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  return client;
}
export function updateClient(id: string, updates: Partial<Client>): Client | null {
  const clients = getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  clients[idx] = { ...clients[idx], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  return clients[idx];
}

// ============ APPOINTMENTS ============
export function getAppointments(): Appointment[] { init(); return JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]'); }
export function addAppointment(appointment: Appointment): Appointment {
  const appointments = getAppointments();
  appointments.unshift(appointment);
  localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  return appointment;
}
export function updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
  const appointments = getAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  appointments[idx] = { ...appointments[idx], ...updates };
  localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  return appointments[idx];
}

// ============ SESSIONS ============
export function getSessions(): Session[] { init(); return JSON.parse(localStorage.getItem(KEYS.SESSIONS) || '[]'); }
export function getSessionsByClient(clientId: string): Session[] { return getSessions().filter((s) => s.clientId === clientId); }
export function addSession(session: Session): Session {
  const sessions = getSessions();
  sessions.unshift(session);
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  return session;
}

// ============ PSYCHOMETRIC TESTS ============
export function getTests(): PsychometricTest[] { init(); return JSON.parse(localStorage.getItem(KEYS.TESTS) || '[]'); }
export function getTestsByClient(clientId: string): PsychometricTest[] { return getTests().filter((t) => t.clientId === clientId); }
export function addTest(test: PsychometricTest): PsychometricTest {
  const tests = getTests();
  tests.unshift(test);
  localStorage.setItem(KEYS.TESTS, JSON.stringify(tests));
  return test;
}

// ============ CLOSERS ============
export function getClosers(): Closer[] { init(); return JSON.parse(localStorage.getItem(KEYS.CLOSERS) || '[]'); }
export function addCloser(closer: Closer): Closer {
  const closers = getClosers();
  closers.push(closer);
  localStorage.setItem(KEYS.CLOSERS, JSON.stringify(closers));
  return closer;
}

// ============ SALES ============
export function getSales(): SaleRecord[] { init(); return JSON.parse(localStorage.getItem(KEYS.SALES) || '[]'); }
export function addSale(sale: SaleRecord): SaleRecord {
  const sales = getSales();
  sales.unshift(sale);
  localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  return sale;
}
