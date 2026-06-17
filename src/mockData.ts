import { Patient, Appointment, Chat, Budget } from './types';

export const initialPatients: Patient[] = [
  {
    id: 'DP-2023-8492',
    name: 'Carlos Mendoza',
    initials: 'CM',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWlkRnIAghGB7qWBHizvxf_HpnruBRfPLDz82C2db-iiZ6OJMNdoAi-vMTMw_q7HCO6vUY8aineX1Nh0LeMcae9p12HzFC5y3lr_RFNt3zY4xi-02-fkBVL_lfCW9d1E4hzyeHsk_GwhHuwib8NOX9KJEt2qtn-RBH0dH9TVQP23a2YEvSD0opO6SZxg9KgUUIhYlnN2MMbf9d4eUYeorbAC4iexvatBBCks91PS1Hln1pPQbJiGFcX6gbSgDTMM3xbOKi9BnvBhYs',
    dob: '12 Oct 1985',
    age: 40,
    phone: '+1 (555) 019-2834',
    allergies: 'Penicilina',
    riskLevel: 'Bajo Riesgo',
    status: 'Activo',
  },
  {
    id: 'DP-2023-1102',
    name: 'Elena Martínez',
    initials: 'EM',
    dob: '18 Abr 1991',
    age: 35,
    phone: '+1 (555) 021-9988',
    allergies: 'Látex',
    riskLevel: 'Bajo Riesgo',
    status: 'Activo',
  },
  {
    id: 'DP-2023-4561',
    name: 'David Chen',
    initials: 'DC',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJZzEwFoWHoA__sOKc1iom8EdhCIHvF6vISsR9PhAI_D94Qd_H46DNjT0OKNc2W7sP0LeNDVzzcA-1k0pEVeYP3QDjepX4pDXEUJ2QmM1hxA9RySgtC4KLH_QfNa9OGSkBPTmRvFBzBd41kep3uwOLLJqV9WvLO3gy-Jp95zfOhMoLLtRq9G8hiKYOe4MTY4cVktI5GU29vFREPbPNAtgSCYektockqbyXGzqQloC8sAKfNMdEG0JXx_sTWiCQ5x8cubr_--E5pJO',
    dob: '05 Sep 1994',
    age: 31,
    phone: '+1 (555) 091-2331',
    allergies: undefined,
    riskLevel: 'Medio Riesgo',
    status: 'Activo',
  },
  {
    id: 'DP-2023-0941',
    name: 'Sofía Jenkins',
    initials: 'SJ',
    dob: '22 Nov 1989',
    age: 36,
    phone: '+1 (555) 102-4581',
    allergies: 'Sulfamidas',
    riskLevel: 'Bajo Riesgo',
    status: 'Activo',
  },
  {
    id: 'DP-2023-8821',
    name: 'María García',
    initials: 'MG',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBe2rkXy84sOKYzOBuNtMouSsWFhtWmOMRy_bjR00Dc_BOtbjX7lDS4qMEJP2QxYq4jE7a2Wj5-cO0SM5acxSD-M27CvKny6oJ9GB156jeHeiiXd1i6RrnYHjiiZC6NLIbWCfX1jTGbCzgPoKOKPOXB8m3bYfoiFpIfjIj2UmC5CSv2Xhmf72wmYxdqDAtMWDdVaaVvlsSOf6HQYbzLXG0g10iXlZfR_nry9Y3REOSbLpvIBKzScsw4pzOSAlr7sUielwgjErGd4z05',
    dob: '12 Ene 1978',
    age: 48,
    phone: '+1 (555) 234-5678',
    allergies: undefined,
    riskLevel: 'Alto Riesgo',
    status: 'Activo',
  },
  {
    id: 'DP-2023-3881',
    name: 'Elena Rodríguez',
    initials: 'ER',
    dob: '14 Feb 1996',
    age: 30,
    phone: '+1 (555) 881-2356',
    allergies: undefined,
    riskLevel: 'Bajo Riesgo',
    status: 'Activo',
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'appt-1',
    date: '2026-06-16',
    time: '09:00 AM',
    patient: initialPatients[1], // Elena Martínez
    treatment: 'Tratamiento de Conducto',
    status: 'Confirmada',
    doctor: 'Dr. Pérez',
    startHour: 9.0,
    durationHours: 1.0,
  },
  {
    id: 'appt-2',
    date: '2026-06-16',
    time: '10:30 AM',
    patient: initialPatients[2], // David Chen
    treatment: 'Limpieza e Inspección',
    status: 'En Espera',
    doctor: 'Dr. Pérez',
    startHour: 10.5,
    durationHours: 0.75,
  },
  {
    id: 'appt-3',
    date: '2026-06-16',
    time: '11:15 AM',
    patient: initialPatients[3], // Sofía Jenkins
    treatment: 'Evaluación de Blanqueamiento',
    status: 'Atrasada',
    doctor: 'Dr. Pérez',
    startHour: 11.25,
    durationHours: 0.75,
  },
  {
    id: 'appt-4',
    date: '2026-06-16',
    time: '01:00 PM',
    patient: initialPatients[4], // María García
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
    date: '2026-06-16',
    time: '10:00 AM',
    patient: initialPatients[0], // Carlos Mendoza
    treatment: 'Tratamiento de Conducto',
    status: 'Confirmada',
    doctor: 'Dr. Pérez',
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
