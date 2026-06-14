export type RiskLevel = 'Bajo Riesgo' | 'Medio Riesgo' | 'Alto Riesgo';
export type AppointmentStatus = 'Confirmada' | 'En Espera' | 'Atrasada' | 'Pendiente' | 'Cancelada';
export type Doctor = 'Dr. Pérez' | 'Dra. Gómez' | 'Higiene 1';
export type BudgetStatus = 'Pendiente' | 'Aprobado' | 'Enviado';
export type Role = 'admin' | 'doctor' | 'recepcionista';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  dob: string;
  age: number;
  phone: string;
  allergies?: string;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  time: string;
  patientId: string;
  treatment: string;
  status: AppointmentStatus;
  doctor: Doctor;
  startHour: number;
  durationHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
  time: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  patientName: string;
  initials: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  isNew: boolean;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  code: string;
  description: string;
  tooth: string;
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  patientId: string;
  status: BudgetStatus;
  items: BudgetItem[];
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ToothState {
  id: number;
  isPediatric: boolean;
  hasCaries: boolean;
  hasFracture: boolean;
  hasMissing: boolean;
  hasCrown: boolean;
  hasImplant: boolean;
  notes?: string;
  updatedAt: string;
}

export interface Odontogram {
  patientId: string;
  teeth: Record<string, ToothState>;
  interventions: Array<{
    id: string;
    title: string;
    desc: string;
    type: 'healthy' | 'info' | 'warning';
    createdAt: string;
  }>;
  updatedAt: string;
}

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  notationSystem: 'universal' | 'fdi';
  whatsAppNumber: string;
  complianceMode: 'demo' | 'production';
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  ip?: string;
  createdAt: string;
}

export interface ClinicData {
  users: User[];
  patients: Patient[];
  appointments: Appointment[];
  chats: Chat[];
  budgets: Budget[];
  odontograms: Odontogram[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: ClinicSettings;
}
