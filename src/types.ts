export interface Patient {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  dob: string;
  age: number;
  phone: string;
  allergies?: string;
  riskLevel: 'Bajo Riesgo' | 'Medio Riesgo' | 'Alto Riesgo';
}

export type AppointmentStatus = 'Confirmada' | 'En Espera' | 'Atrasada' | 'Pendiente';

export interface Appointment {
  id: string;
  time: string;
  patient: Patient;
  treatment: string;
  status: AppointmentStatus;
  doctor: 'Dr. Pérez' | 'Dra. Gómez' | 'Higiene 1';
  startHour: number; // en horas decimales (ej. 8.75 para las 8:45 AM)
  durationHours: number; // ej. 0.75 para 45 minutos
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
  time: string;
}

export interface Chat {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  isNew: boolean;
  messages: ChatMessage[];
}

export interface BudgetItem {
  code: string;
  description: string;
  tooth: string; // ej. "14", "38" o "-"
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  patientName: string;
  status: 'Pendiente' | 'Aprobado' | 'Enviado';
  items: BudgetItem[];
  discountPercent: number;
}

export interface ToothState {
  id: number; // 1-32 para adultos, o letras/IDs para infantil
  isPediatric: boolean;
  hasCaries: boolean;
  hasFracture: boolean;
  hasMissing: boolean;
  hasCrown: boolean;
  hasImplant: boolean;
  isSelected?: boolean;
}
