import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Cleaning existing data...');
  try {
    await prisma.itemPresupuesto.deleteMany({});
    await prisma.presupuesto.deleteMany({});
    await prisma.cita.deleteMany({});
    await prisma.odontograma.deleteMany({});
    await prisma.historialMedico.deleteMany({});
    await prisma.adjuntoClinico.deleteMany({});
    await prisma.paciente.deleteMany({});
    await prisma.chat.deleteMany({});
    console.log('Clean completed.');
  } catch (err) {
    console.error('Error cleaning DB:', err);
  }

  console.log('Seeding patients...');

  // Create Patients
  const patients = [
    {
      id: 'PX-88291-LV',
      nombre: 'Eleanor Vance',
      iniciales: 'EV',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
      fechaNacimiento: '1985-05-12',
      edad: 41,
      telefono: '+1 (555) 019-2834',
      alergias: 'Penicilina, Látex',
      nivelRiesgo: 'Medio Riesgo',
      estado: 'Activo',
    },
    {
      id: 'PX-12345-JC',
      nombre: 'Julian Casablancas',
      iniciales: 'JC',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
      fechaNacimiento: '1978-08-27',
      edad: 47,
      telefono: '+1 (555) 021-9988',
      alergias: null,
      nivelRiesgo: 'Bajo Riesgo',
      estado: 'Activo',
    },
    {
      id: 'PX-54321-EF',
      nombre: 'Elena Fisher',
      iniciales: 'EF',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
      fechaNacimiento: '1983-03-23',
      edad: 43,
      telefono: '+1 (555) 091-2331',
      alergias: 'Látex',
      nivelRiesgo: 'Bajo Riesgo',
      estado: 'Activo',
    },
    {
      id: 'PX-98765-DL',
      nombre: 'David Lee',
      iniciales: 'DL',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
      fechaNacimiento: '1990-06-15',
      edad: 36,
      telefono: '+1 (555) 102-4581',
      alergias: null,
      nivelRiesgo: 'Alto Riesgo',
      estado: 'Activo',
    },
    {
      id: 'PX-11111-CM',
      nombre: 'Carlos Mendoza',
      iniciales: 'CM',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200',
      fechaNacimiento: '1980-10-12',
      edad: 45,
      telefono: '+1 (555) 234-5678',
      alergias: 'Penicilina',
      nivelRiesgo: 'Bajo Riesgo',
      estado: 'Activo',
    },
    {
      id: 'PX-22222-SJ',
      nombre: 'Sofía Jenkins',
      iniciales: 'SJ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
      fechaNacimiento: '1989-11-22',
      edad: 36,
      telefono: '+1 (555) 777-8899',
      alergias: 'Sulfamidas',
      nivelRiesgo: 'Bajo Riesgo',
      estado: 'Activo',
    }
  ];

  for (const p of patients) {
    await prisma.paciente.create({
      data: p
    });
  }
  console.log('Patients seeded.');

  console.log('Seeding clinical history (evolucion notes)...');

  // Seed Medical History for Eleanor Vance (includes notes of evolution and pathological table)
  const eleanorHistory = {
    pacienteId: 'PX-88291-LV',
    alergias: 'Penicilina, Látex',
    seccionesOficiales: JSON.stringify({
      personalHistory: {
        vivienda: 'Urbana con servicios',
        habitosHigienicos: 'Excelentes',
        habitosDieteticos: 'Balanceados',
        pathologicalTable: [
          { enfermedad: 'Alergias', presento: true, edad: '12', control: 'si', complicacion: 'Reacción cutánea leve a penicilina' }
        ],
        tabaquismo: { activo: false, inactivo: true }
      },
      evolucionNotes: {
        notes: [
          {
            id: 'note-1',
            fecha: '2023-10-24',
            titulo: 'Control Anual de Rutina',
            nota: 'Paciente asiste a su valoración física anual. Se realiza exploración clínica y limpieza profiláctica. Se detecta inflamación leve en encías del cuadrante superior derecho. Se prescribe enjuague antiséptico y técnica de cepillado.',
            doctor: 'Dr. Aris Thorne'
          },
          {
            id: 'note-2',
            fecha: '2023-04-12',
            titulo: 'Revisión y Ajuste',
            nota: 'Se realiza revisión de resina en pieza 14. Buen estado general. Sensibilidad dental normalizada.',
            doctor: 'Dr. Aris Thorne'
          }
        ]
      }
    })
  };

  // Seed history for others
  const histories = [
    eleanorHistory,
    {
      pacienteId: 'PX-12345-JC',
      seccionesOficiales: JSON.stringify({
        evolucionNotes: {
          notes: [
            {
              id: 'note-jc-1',
              fecha: '2026-06-17',
              titulo: 'Resultados de Laboratorio - Panel A',
              nota: 'Revisión de resultados del panel de coagulación y biometría hemática. Todo dentro de límites normales para cirugía de implante programada.',
              doctor: 'Dr. Pérez'
            }
          ]
        }
      })
    },
    {
      pacienteId: 'PX-54321-EF',
      seccionesOficiales: JSON.stringify({
        evolucionNotes: {
          notes: [
            {
              id: 'note-ef-1',
              fecha: '2026-06-14',
              titulo: 'Control Postoperatorio',
              nota: 'Paciente acude a retiro de puntos tras extracción de tercer molar. Cicatrización de alveolo en excelentes condiciones. Se retiran suturas sin complicaciones.',
              doctor: 'Dra. Gómez'
            }
          ]
        }
      })
    },
    {
      pacienteId: 'PX-98765-DL',
      seccionesOficiales: JSON.stringify({
        evolucionNotes: {
          notes: [
            {
              id: 'note-dl-1',
              fecha: '2026-06-15',
              titulo: 'Evaluación y Trámite de Seguro',
              nota: 'Se llena formulario para pre-autorización de corona de porcelana con aseguradora. Se toman radiografías de diagnóstico correspondientes.',
              doctor: 'Dr. Pérez'
            }
          ]
        }
      })
    }
  ];

  for (const h of histories) {
    await prisma.historialMedico.create({
      data: h
    });
  }
  console.log('Histories seeded.');

  console.log('Seeding appointments...');

  // Seed Appointments
  const appointments = [
    {
      id: 'appt-ev-1',
      fecha: '2023-10-24',
      hora: '10:00 AM',
      pacienteId: 'PX-88291-LV',
      tratamiento: 'Annual Physical Assessment',
      estado: 'Confirmada',
      doctor: 'Dr. Aris Thorne',
      horaInicio: 10.0,
      duracionHoras: 1.0,
    },
    {
      id: 'appt-jc-1',
      fecha: '2026-06-17',
      hora: '09:00 AM',
      pacienteId: 'PX-12345-JC',
      tratamiento: 'Lab Results - Panel A',
      estado: 'En Espera',
      doctor: 'Dr. Pérez',
      horaInicio: 9.0,
      duracionHoras: 0.5,
    },
    {
      id: 'appt-ef-1',
      fecha: '2026-06-14',
      hora: '11:00 AM',
      pacienteId: 'PX-54321-EF',
      tratamiento: 'Post-op Follow-up',
      estado: 'Confirmada',
      doctor: 'Dra. Gómez',
      horaInicio: 11.0,
      duracionHoras: 0.5,
    },
    {
      id: 'appt-dl-1',
      fecha: '2026-06-15',
      hora: '02:30 PM',
      pacienteId: 'PX-98765-DL',
      tratamiento: 'Insurance Authorization',
      estado: 'Confirmada',
      doctor: 'Dr. Pérez',
      horaInicio: 14.5,
      duracionHoras: 0.5,
    }
  ];

  for (const a of appointments) {
    await prisma.cita.create({
      data: a
    });
  }
  console.log('Appointments seeded.');

  console.log('Seeding budgets...');

  // Seed Budgets
  const budgets = [
    {
      id: 'PRE-88291-1',
      pacienteId: 'PX-88291-LV',
      estado: 'Aprobado',
      porcentajeDescuento: 10,
      items: [
        {
          id: 'item-ev-1',
          codigo: 'CONS-01',
          descripcion: 'Consulta y Valoración',
          diente: '-',
          precioUnitario: 500,
          total: 500
        },
        {
          id: 'item-ev-2',
          codigo: 'RES-02',
          descripcion: 'Resina Fotocurable',
          diente: '14',
          precioUnitario: 1200,
          total: 1200
        }
      ]
    },
    {
      id: 'PRE-12345-1',
      pacienteId: 'PX-12345-JC',
      estado: 'Pendiente',
      porcentajeDescuento: 0,
      items: [
        {
          id: 'item-jc-1',
          codigo: 'IMP-01',
          descripcion: 'Implante Dental Titanio',
          diente: '36',
          precioUnitario: 15000,
          total: 15000
        }
      ]
    }
  ];

  for (const b of budgets) {
    const { items, ...bData } = b;
    await prisma.presupuesto.create({
      data: {
        ...bData,
        items: {
          create: items
        }
      }
    });
  }
  console.log('Budgets seeded.');

  console.log('Database populated successfully!');
}

run()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
