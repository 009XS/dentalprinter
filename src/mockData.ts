import { Patient, Appointment, Chat, Budget } from './types';

export const initialPatients: Patient[] = [
  {
    id: 'PX-88291-LV',
    name: 'Eleanor Vance',
    initials: 'EV',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
    dob: '1985-05-12',
    age: 41,
    phone: '+1 (555) 019-2834',
    allergies: 'Penicilina, Látex',
    riskLevel: 'Medio Riesgo',
    status: 'Activo',
  },
  {
    id: 'PX-12345-JC',
    name: 'Julian Casablancas',
    initials: 'JC',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    dob: '1978-08-27',
    age: 47,
    phone: '+1 (555) 021-9988',
    allergies: undefined,
    riskLevel: 'Bajo Riesgo',
    status: 'Activo',
  },
  {
    id: 'PX-54321-EF',
    name: 'Elena Fisher',
    initials: 'EF',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    dob: '1983-03-23',
    age: 43,
    phone: '+1 (555) 091-2331',
    allergies: 'Látex',
    riskLevel: 'Bajo Riesgo',
    status: 'Activo',
  },
  {
    id: 'PX-98765-DL',
    name: 'David Lee',
    initials: 'DL',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    dob: '1990-06-15',
    age: 36,
    phone: '+1 (555) 102-4581',
    allergies: undefined,
    riskLevel: 'Alto Riesgo',
    status: 'Activo',
  },
  {
    id: 'PX-11111-CM',
    name: 'Carlos Mendoza',
    initials: 'CM',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200',
    dob: '1980-10-12',
    age: 45,
    phone: '+1 (555) 234-5678',
    allergies: 'Penicilina',
    riskLevel: 'Bajo Riesgo',
    status: 'Activo',
  },
  {
    id: 'PX-22222-SJ',
    name: 'Sofía Jenkins',
    initials: 'SJ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    dob: '1989-11-22',
    age: 36,
    phone: '+1 (555) 777-8899',
    allergies: 'Sulfamidas',
    riskLevel: 'Bajo Riesgo',
    status: 'Activo',
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'appt-1',
    date: '2026-06-17',
    time: '09:00 AM',
    patient: initialPatients[1], // Julian Casablancas
    treatment: 'Lab Results - Panel A',
    status: 'Confirmada',
    doctor: 'Dr. Pérez',
    startHour: 9.0,
    durationHours: 1.0,
  },
  {
    id: 'appt-2',
    date: '2026-06-14',
    time: '11:00 AM',
    patient: initialPatients[2], // Elena Fisher
    treatment: 'Post-op Follow-up',
    status: 'En Espera',
    doctor: 'Dr. Pérez',
    startHour: 10.5,
    durationHours: 0.75,
  },
  {
    id: 'appt-3',
    date: '2026-06-15',
    time: '02:30 PM',
    patient: initialPatients[3], // David Lee
    treatment: 'Insurance Authorization',
    status: 'Atrasada',
    doctor: 'Dr. Pérez',
    startHour: 11.25,
    durationHours: 0.75,
  },
  {
    id: 'appt-4',
    date: '2026-06-16',
    time: '01:00 PM',
    patient: initialPatients[4], // Carlos Mendoza
    treatment: 'Control de Implante',
    status: 'Pendiente',
    doctor: 'Dr. Pérez',
    startHour: 13.0,
    durationHours: 1.25,
  },
  {
    id: 'appt-5',
    date: '2026-06-16',
    time: '08:45 AM',
    patient: {
      id: 'DP-2023-7721',
      name: 'Emma Watson',
      initials: 'EW',
      dob: '15 Abr 1990',
      age: 36,
      phone: '+1 (555) 332-9012',
      riskLevel: 'Bajo Riesgo',
      status: 'Activo',
    },
    treatment: 'Revisión y Limpieza General',
    status: 'Confirmada',
    doctor: 'Dr. Pérez',
    startHour: 8.75,
    durationHours: 0.75,
  },
  {
    id: 'appt-6',
    date: '2023-10-24',
    time: '10:00 AM',
    patient: initialPatients[0], // Eleanor Vance
    treatment: 'Annual Physical Assessment',
    status: 'Confirmada',
    doctor: 'Dr. Aris Thorne',
    startHour: 10.0,
    durationHours: 1.5,
  },
  {
    id: 'appt-7',
    date: '2026-06-16',
    time: '01:00 PM',
    patient: {
      id: 'DP-2023-5542',
      name: 'Sara Connor',
      initials: 'SC',
      dob: '28 May 1984',
      age: 42,
      phone: '+1 (555) 234-9000',
      riskLevel: 'Medio Riesgo',
      status: 'Activo',
    },
    treatment: 'Ajuste de Ortodoncia',
    status: 'Confirmada',
    doctor: 'Dra. Gómez',
    startHour: 13.0,
    durationHours: 0.75,
  },
  {
    id: 'appt-8',
    date: '2026-06-16',
    time: '08:15 AM',
    patient: {
      id: 'DP-2023-0091',
      name: 'Juan Pérez',
      initials: 'JP',
      dob: '01 Ene 1980',
      age: 46,
      phone: '+1 (555) 909-1234',
      riskLevel: 'Bajo Riesgo',
      status: 'Activo',
    },
    treatment: 'Limpieza Dental',
    status: 'Confirmada',
    doctor: 'Higiene 1',
    startHour: 8.25,
    durationHours: 0.5,
  }
];

export const initialChats: Chat[] = [
  {
    id: 'chat-1',
    name: 'Luis Mendoza',
    initials: 'LM',
    lastMessage: 'Necesito reprogramar mi cita para la próxima semana.',
    time: '10:24 AM',
    isNew: true,
    messages: [
      { id: '1', sender: 'patient', text: 'Buenos días, ¿es posible cambiar mi cita para el próximo martes?', time: '10:20 AM' },
      { id: '2', sender: 'doctor', text: '¡Hola Luis! Sí, tenemos disponibilidad a las 11:00 AM o a las 3:30 PM. ¿Cuál te queda mejor?', time: '10:22 AM' },
      { id: '3', sender: 'patient', text: 'Necesito reprogramar mi cita para la próxima semana.', time: '10:24 AM' }
    ]
  },
  {
    id: 'chat-2',
    name: 'David Chen',
    initials: 'DC',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtwUoFJPyyJ6EmZ34EHU-ApgFQJjqa1EspGyaAw6qmHh7PrOaOfpwXEatM5UE-3C3LZeGtQ_qUUxFwDhbuAhiMAxOLN3cAANW5go95iRCzaFYhixf-SleUeVx4pAVmHpNukRVGMAND53Lpi_1IcZ9wd0hg0MjqM5gkZL7c2Fx2xOmS8f5NIGFYDAeOLGY0hkYMLZ62nWGPMS13QcVHUlq7dA1AyCanjqX8ln2U0goGgomKr9OKHHfzfz4LLBQd9E6XfdXRiTVeZtis',
    lastMessage: 'Estoy esperando en la recepción.',
    time: '09:15 AM',
    isNew: false,
    messages: [
      { id: '1', sender: 'patient', text: 'Hola, acabo de llegar para mi revisión.', time: '09:12 AM' },
      { id: '2', sender: 'doctor', text: '¡Bienvenido David! Toma asiento por favor, en un momento te llamará el asistente.', time: '09:13 AM' },
      { id: '3', sender: 'patient', text: 'Estoy esperando en la recepción.', time: '09:15 AM' }
    ]
  },
  {
    id: 'chat-3',
    name: 'Carlos Pérez',
    initials: 'CP',
    lastMessage: '¿Cuánto cuesta el tratamiento de blanqueamiento?',
    time: 'Ayer',
    isNew: true,
    messages: [
      { id: '1', sender: 'patient', text: '¡Hola al equipo de Dentalprinter! Estaba revisando sus tratamientos de estética dental.', time: 'Ayer 3:40 PM' },
      { id: '2', sender: 'doctor', text: '¡Hola Carlos! Con gusto te asistimos. La evaluación de blanqueamiento cuesta actualmente $149.', time: 'Ayer 3:45 PM' },
      { id: '3', sender: 'patient', text: '¿Cuánto cuesta el tratamiento de blanqueamiento?', time: 'Ayer' }
    ]
  }
];

export const initialBudgets: Budget[] = [
  {
    id: 'PR-2023-1042',
    patientName: 'Elena Rodríguez',
    status: 'Pendiente',
    items: [
      { code: 'D2740', description: 'Corona - Porcelana / Sustrato Cerámico', tooth: '14', unitPrice: 850.0, total: 850.0 },
      { code: 'D3330', description: 'Terapia Endodóntica - Molar', tooth: '14', unitPrice: 950.0, total: 950.0 },
      { code: 'D0220', description: 'Radiografía Intraoral - Periapical Primera Imagen', tooth: '-', unitPrice: 25.0, total: 25.0 }
    ],
    discountPercent: 5,
  },
  {
    id: 'PR-2023-8492',
    patientName: 'Carlos Mendoza',
    status: 'Pendiente',
    items: [
      { code: 'D2391', description: 'Resina Compuesta - 1 Superficie', tooth: '38', unitPrice: 180.0, total: 180.0 }
    ],
    discountPercent: 0,
  }
];
