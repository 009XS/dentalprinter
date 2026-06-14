import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import type { ClinicData, Patient } from './types';

const now = () => new Date().toISOString();

const patient = (p: Omit<Patient, 'createdAt' | 'updatedAt'>): Patient => ({
  ...p,
  createdAt: now(),
  updatedAt: now(),
});

export async function createSeedData(): Promise<ClinicData> {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2026', 12);

  return {
    users: [
      {
        id: uuid(),
        name: 'Dr. Pérez',
        email: 'admin@dentalprinter.local',
        passwordHash,
        role: 'admin',
        createdAt: now(),
      },
    ],
    patients: [],
    appointments: [],
    chats: [],
    budgets: [],
    odontograms: [],
    notifications: [
      {
        id: uuid(),
        title: 'Entorno clínico inicializado',
        desc: 'La API local segura, autenticación y base de datos persistente están activas.',
        time: 'Ahora',
        read: false,
        createdAt: now(),
      },
    ],
    auditLogs: [],
    settings: {
      clinicName: 'Dentalprinter',
      tagline: 'Excelencia Clínica',
      notationSystem: 'universal',
      whatsAppNumber: '+1 (555) 0123-DENTAL',
      complianceMode: 'demo',
      updatedAt: now(),
    },
  };
}

