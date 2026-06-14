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

  const patients = [
    patient({
      id: 'DP-2023-8492',
      name: 'Carlos Mendoza',
      initials: 'CM',
      dob: '12 Oct 1985',
      age: 40,
      phone: '+1 (555) 019-2834',
      allergies: 'Penicilina',
      riskLevel: 'Bajo Riesgo',
    }),
    patient({
      id: 'DP-2023-1102',
      name: 'Elena Martínez',
      initials: 'EM',
      dob: '18 Abr 1991',
      age: 35,
      phone: '+1 (555) 021-9988',
      allergies: 'Látex',
      riskLevel: 'Bajo Riesgo',
    }),
    patient({
      id: 'DP-2023-4561',
      name: 'David Chen',
      initials: 'DC',
      dob: '05 Sep 1994',
      age: 31,
      phone: '+1 (555) 091-2331',
      riskLevel: 'Medio Riesgo',
    }),
    patient({
      id: 'DP-2023-0941',
      name: 'Sofía Jenkins',
      initials: 'SJ',
      dob: '22 Nov 1989',
      age: 36,
      phone: '+1 (555) 102-4581',
      allergies: 'Sulfamidas',
      riskLevel: 'Bajo Riesgo',
    }),
    patient({
      id: 'DP-2023-8821',
      name: 'María García',
      initials: 'MG',
      dob: '12 Ene 1978',
      age: 48,
      phone: '+1 (555) 234-5678',
      riskLevel: 'Alto Riesgo',
    }),
    patient({
      id: 'DP-2023-3881',
      name: 'Elena Rodríguez',
      initials: 'ER',
      dob: '14 Feb 1996',
      age: 30,
      phone: '+1 (555) 881-2356',
      riskLevel: 'Bajo Riesgo',
    }),
  ];

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
    patients,
    appointments: [
      {
        id: uuid(),
        time: '09:00 AM',
        patientId: 'DP-2023-1102',
        treatment: 'Tratamiento de Conducto',
        status: 'Confirmada',
        doctor: 'Dr. Pérez',
        startHour: 9.0,
        durationHours: 1.0,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuid(),
        time: '10:30 AM',
        patientId: 'DP-2023-4561',
        treatment: 'Limpieza e Inspección',
        status: 'En Espera',
        doctor: 'Dr. Pérez',
        startHour: 10.5,
        durationHours: 0.75,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuid(),
        time: '01:00 PM',
        patientId: 'DP-2023-8821',
        treatment: 'Control de Implante',
        status: 'Pendiente',
        doctor: 'Dr. Pérez',
        startHour: 13.0,
        durationHours: 1.25,
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    chats: [
      {
        id: uuid(),
        patientName: 'Luis Mendoza',
        initials: 'LM',
        lastMessage: 'Necesito reprogramar mi cita para la próxima semana.',
        time: '10:24 AM',
        isNew: true,
        updatedAt: now(),
        messages: [
          {
            id: uuid(),
            sender: 'patient',
            text: 'Buenos días, ¿es posible cambiar mi cita para el próximo martes?',
            time: '10:20 AM',
            createdAt: now(),
          },
          {
            id: uuid(),
            sender: 'doctor',
            text: '¡Hola Luis! Sí, tenemos disponibilidad a las 11:00 AM o a las 3:30 PM. ¿Cuál te queda mejor?',
            time: '10:22 AM',
            createdAt: now(),
          },
          {
            id: uuid(),
            sender: 'patient',
            text: 'Necesito reprogramar mi cita para la próxima semana.',
            time: '10:24 AM',
            createdAt: now(),
          },
        ],
      },
    ],
    budgets: [
      {
        id: 'PR-2023-1042',
        patientId: 'DP-2023-3881',
        status: 'Pendiente',
        discountPercent: 5,
        createdAt: now(),
        updatedAt: now(),
        items: [
          {
            id: uuid(),
            code: 'D2740',
            description: 'Corona - Porcelana / Sustrato Cerámico',
            tooth: '14',
            unitPrice: 850,
            total: 850,
          },
          {
            id: uuid(),
            code: 'D3330',
            description: 'Terapia Endodóntica - Molar',
            tooth: '14',
            unitPrice: 950,
            total: 950,
          },
          {
            id: uuid(),
            code: 'D0220',
            description: 'Radiografía Intraoral - Periapical Primera Imagen',
            tooth: '-',
            unitPrice: 25,
            total: 25,
          },
        ],
      },
    ],
    odontograms: [
      {
        patientId: 'DP-2023-8492',
        updatedAt: now(),
        teeth: {
          '14': {
            id: 14,
            isPediatric: false,
            hasCaries: true,
            hasFracture: false,
            hasMissing: false,
            hasCrown: false,
            hasImplant: false,
            notes: 'Caries profunda - distal',
            updatedAt: now(),
          },
          '38': {
            id: 38,
            isPediatric: false,
            hasCaries: false,
            hasFracture: false,
            hasMissing: false,
            hasCrown: true,
            hasImplant: false,
            notes: 'Control de corona requerido',
            updatedAt: now(),
          },
        },
        interventions: [
          {
            id: uuid(),
            title: 'Diente 14 - Resina Compuesta',
            desc: 'Registro de semilla importado',
            type: 'healthy',
            createdAt: now(),
          },
        ],
      },
    ],
    notifications: [
      {
        id: uuid(),
        title: 'Entorno clínico inicializado',
        desc: 'La API local segura, autenticación y base de datos persistente están activas.',
        time: 'Ahora',
        read: false,
        createdAt: now(),
      },
      {
        id: uuid(),
        title: 'Revisar cumplimiento de producción',
        desc: 'Asegúrese de configurar variables de entorno seguras y habilitar copias de seguridad antes de almacenar datos reales.',
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
