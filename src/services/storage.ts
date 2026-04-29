import type {
  User,
  UserRole,
  Lead,
  Client,
  Appointment,
  Session,
  PsychometricTest,
  Closer,
  SaleRecord,
} from '@/types';

//////////////////////////////////////////////////
// KEYS
//////////////////////////////////////////////////

const KEYS = {
  USERS: 'v_users',
  CURRENT_USER: 'v_current_user',
  CLOSERS: 'v_closers',
  LEADS: 'v_leads',
  CLIENTS: 'v_clients',
};

//////////////////////////////////////////////////
// INIT USERS
//////////////////////////////////////////////////

function seedUsers() {
  const users: User[] = [
    {
      id: 'u1',
      email: 'andresclinicapsicologica@gmail.com',
      name: 'Andres',
      role: 'admin',
      password: '1234',
      mustChangePassword: true,
    },
    {
      id: 'u2',
      email: 'isabel@metodovantage.com',
      name: 'Maria Isabel',
      role: 'closer',
      password: '1234',
      mustChangePassword: true,
    },
    {
      id: 'u3',
      email: 'christian@metodovantage.com',
      name: 'Christian',
      role: 'psychologist',
      password: '1234',
      mustChangePassword: true,
    },
    {
      id: 'u4',
      email: 'setter@metodovantage.com',
      name: 'Diana',
      role: 'setter',
      password: '1234',
      mustChangePassword: true,
    },
  ];

  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

function init() {
  if (!localStorage.getItem(KEYS.USERS)) {
    seedUsers();
  }
}

//////////////////////////////////////////////////
// USERS
//////////////////////////////////////////////////

export function getUsers(): User[] {
  init();
  return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
}

function saveUsers(users: User[]) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export function addUser(user: User) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

//////////////////////////////////////////////////
// AUTH
//////////////////////////////////////////////////

export function authenticateUser(email: string, password: string) {
  const users = getUsers();

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );

  if (!user) return null;

  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));

  return user;
}

export function getCurrentUser(): User | null {
  return JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || 'null');
}

export function logoutUser() {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

//////////////////////////////////////////////////
// CHANGE PASSWORD
//////////////////////////////////////////////////

export function changePassword(userId: string, newPassword: string) {
  const users = getUsers();

  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  users[idx].password = newPassword;
  users[idx].mustChangePassword = false;

  saveUsers(users);

  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(users[idx]));

  return users[idx];
}

//////////////////////////////////////////////////
// CLOSERS
//////////////////////////////////////////////////

export function getClosers(): Closer[] {
  return JSON.parse(localStorage.getItem(KEYS.CLOSERS) || '[]');
}

export function addCloser(closer: Closer) {
  const closers = getClosers();
  closers.push(closer);
  localStorage.setItem(KEYS.CLOSERS, JSON.stringify(closers));
}

//////////////////////////////////////////////////
// VERIFICATION CODE (SIMULADO)
//////////////////////////////////////////////////

export function generateVerificationCode(_email: string): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

//////////////////////////////////////////////////
// LEADS (BÁSICO)
//////////////////////////////////////////////////

export function getLeads(): Lead[] {
  return JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
}

export function saveLeads(leads: Lead[]) {
  localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
}

//////////////////////////////////////////////////
// CLIENTS (BÁSICO)
//////////////////////////////////////////////////

export function getClients(): Client[] {
  return JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]');
}

export function addClient(client: Client) {
  const clients = getClients();
  clients.push(client);
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
}

export function getClientById(id: string): Client | undefined {
  return getClients().find((c) => c.id === id);
}

export function updateClient(id: string, updates: Partial<Client>) {
  const clients = getClients();

  const updated = clients.map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );

  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(updated));
}

//////////////////////////////////////////////////
// PLACEHOLDERS (para evitar errores en otras páginas)
//////////////////////////////////////////////////

export function getAppointments(): Appointment[] {
  return [];
}

export function updateAppointment(_id: string, _data: Partial<Appointment>) {}

export function getSessions(): Session[] {
  return [];
}

export function getSessionsByClient(_id: string): Session[] {
  return [];
}

export function getTestsByClient(_id: string): PsychometricTest[] {
  return [];
}

export function getSales(): SaleRecord[] {
  return [];
}

export function convertLeadToClient(_id: string) {}