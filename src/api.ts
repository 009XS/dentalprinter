import type { Appointment, Budget, BudgetItem, Patient, MedicalHistory, ClinicalAttachment } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const TOKEN_KEY = 'dentalprinter.session';

export interface BootstrapData {
  user?: { id: string; name: string; email: string; role: string };
  patients: Patient[];
  appointments: Appointment[];
  chats: any[];
  budgets: Budget[];
  odontograms: any[];
  notifications: NotificationItem[];
  settings: any;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  createdAt: string;
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error || 'Request failed');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(email = 'admin@dentalprinter.local', password = 'ChangeMe!2026') {
  const result = await request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  return result.user;
}

export function logout() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function bootstrap() {
  const data = await request<BootstrapData>('/bootstrap');
  if (data.budgets) {
    data.budgets = data.budgets.map((b: any) => ({
      ...b,
      patientName: b.patient?.name || 'Paciente'
    }));
  }
  if (data.chats) {
    data.chats = data.chats.map((c: any) => ({
      ...c,
      name: c.patientName
    }));
  }
  return data;
}

export async function createPatient(input: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) {
  return request<Patient>('/patients', { method: 'POST', body: JSON.stringify(input) });
}

export async function updatePatient(id: string, input: Partial<Patient>) {
  return request<Patient>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function createAppointment(input: {
  date: string;
  time: string;
  patientId: string;
  treatment: string;
  status: 'Confirmada' | 'En Espera' | 'Atrasada' | 'Pendiente';
  doctor: 'Dr. Pérez' | 'Dra. Gómez' | 'Higiene 1';
  startHour: number;
  durationHours: number;
}) {
  return request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateAppointment(id: string, input: Partial<Appointment & { patientId: string }>) {
  return request<Appointment>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function cancelAppointment(id: string) {
  return request<void>(`/appointments/${id}`, { method: 'DELETE' });
}

export async function createBudget(input: {
  patientId: string;
  discountPercent: number;
  status: 'Pendiente' | 'Aprobado' | 'Enviado';
  items?: BudgetItem[];
}) {
  return request<Budget>('/budgets', { method: 'POST', body: JSON.stringify(input) });
}

export async function addBudgetItem(budgetId: string, item: Omit<BudgetItem, 'id'>) {
  return request<BudgetItem>(`/budgets/${budgetId}/items`, { method: 'POST', body: JSON.stringify(item) });
}

export async function getOdontogram(patientId: string) {
  return request<any>(`/odontograms/${patientId}`);
}

export async function saveOdontogram(patientId: string, odontogram: any) {
  return request<any>(`/odontograms/${patientId}`, { method: 'PUT', body: JSON.stringify(odontogram) });
}

export async function getMedicalHistory(patientId: string) {
  return request<MedicalHistory>(`/patients/${patientId}/medical-history`);
}

export async function updateMedicalHistory(patientId: string, payload: Partial<MedicalHistory>) {
  return request<MedicalHistory>(`/patients/${patientId}/medical-history`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}


export async function getSettings() {
  return request<any>('/settings');
}

export async function saveSettings(settings: any) {
  return request<any>('/settings', { method: 'PUT', body: JSON.stringify(settings) });
}

export async function markNotificationsRead() {
  return request<void>('/notifications/read-all', { method: 'POST' });
}

export async function getAuditLogs() {
  return request<any[]>('/audit-logs');
}

export async function updateChat(id: string, input: {
  lastMessage: string;
  time: string;
  isNew: boolean;
  messages: any[];
  patientName?: string;
  initials?: string;
  avatar?: string;
}) {
  return request<any>(`/chats/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function getPatientAttachments(patientId: string): Promise<ClinicalAttachment[]> {
  return request<ClinicalAttachment[]>(`/patients/${patientId}/attachments`);
}

export async function uploadPatientAttachment(
  patientId: string,
  file: File,
  category: string,
  description?: string
): Promise<ClinicalAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (description) {
    formData.append('description', description);
  }

  const token = getToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}/patients/${patientId}/attachments`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error || 'Upload failed');
  }

  return response.json();
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  return request<void>(`/attachments/${attachmentId}`, { method: 'DELETE' });
}

