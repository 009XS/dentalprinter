import { Prisma } from '@prisma/client';
import type { ClinicData, User, Patient, Appointment, Chat, Budget, Odontogram, ClinicSettings, Notification, AuditLog } from './types';
import { createSeedData } from './seed';
import { prisma } from './db';

const toIso = (value: Date | string) => value instanceof Date ? value.toISOString() : value;

async function ensureSeeded() {
  const userCount = await prisma.usuario.count();
  if (userCount > 0) return;
  const seed = await createSeedData();
  await prisma.$transaction(async (tx) => {
    if (seed.users.length) {
      await tx.usuario.createMany({
        data: seed.users.map((u) => ({
          id: u.id,
          nombre: u.name,
          email: u.email,
          claveHash: u.passwordHash,
          rol: u.role,
          fechaCreacion: new Date(u.createdAt),
        })),
      });
    }
    if (seed.patients.length) {
      await tx.paciente.createMany({
        data: seed.patients.map((p) => ({
          id: p.id,
          nombre: p.name,
          avatar: p.avatar,
          iniciales: p.initials,
          fechaNacimiento: p.dob,
          edad: p.age,
          telefono: p.phone,
          alergias: p.allergies,
          nivelRiesgo: p.riskLevel,
          estado: p.status,
          fechaCreacion: new Date(p.createdAt),
          fechaActualizacion: new Date(p.updatedAt),
        })),
      });
    }
    if (seed.appointments.length) {
      await tx.cita.createMany({
        data: seed.appointments.map((a) => ({
          id: a.id,
          fecha: a.date,
          hora: a.time,
          pacienteId: a.patientId,
          tratamiento: a.treatment,
          estado: a.status,
          doctor: a.doctor,
          horaInicio: a.startHour,
          duracionHoras: a.durationHours,
          fechaCreacion: new Date(a.createdAt),
          fechaActualizacion: new Date(a.updatedAt),
        })),
      });
    }
    if (seed.chats.length) {
      await tx.chat.createMany({
        data: seed.chats.map((chat) => ({
          id: chat.id,
          nombrePaciente: chat.patientName,
          iniciales: chat.initials,
          avatar: chat.avatar,
          ultimoMensaje: chat.lastMessage,
          hora: chat.time,
          esNuevo: chat.isNew,
          mensajes: JSON.stringify(chat.messages),
          fechaActualizacion: new Date(chat.updatedAt),
        })),
      });
    }
    for (const budget of seed.budgets) {
      await tx.presupuesto.create({
        data: {
          id: budget.id,
          pacienteId: budget.patientId!,
          estado: budget.status,
          porcentajeDescuento: budget.discountPercent,
          fechaCreacion: new Date(budget.createdAt),
          fechaActualizacion: new Date(budget.updatedAt),
          items: {
            create: budget.items.map((item) => ({
              id: item.id!,
              codigo: item.code,
              descripcion: item.description,
              diente: item.tooth,
              precioUnitario: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });
    }
    for (const odontogram of seed.odontograms) {
      await tx.odontograma.create({
        data: {
          pacienteId: odontogram.patientId,
          dientes: JSON.stringify(odontogram.teeth),
          intervenciones: JSON.stringify(odontogram.interventions),
          fechaActualizacion: new Date(odontogram.updatedAt),
        },
      });
    }
    if (seed.notifications.length) {
      await tx.notificacion.createMany({
        data: seed.notifications.map((n) => ({
          id: n.id,
          titulo: n.title,
          descripcion: n.desc,
          tiempo: n.time,
          leido: n.read,
          fechaCreacion: new Date(n.createdAt),
        })),
      });
    }
    await tx.configuracionClinica.create({
      data: {
        id: 'singleton',
        nombreClinica: seed.settings.clinicName,
        eslogan: seed.settings.tagline,
        sistemaNotacion: seed.settings.notationSystem,
        numeroWhatsApp: seed.settings.whatsAppNumber,
        modoCumplimiento: seed.settings.complianceMode,
        fechaActualizacion: new Date(seed.settings.updatedAt),
      },
    });
  });
}

function mapUser(user: Awaited<ReturnType<typeof prisma.usuario.findMany>>[number]): User {
  return {
    id: user.id,
    name: user.nombre,
    email: user.email,
    passwordHash: user.claveHash,
    role: user.rol as User['role'],
    createdAt: toIso(user.fechaCreacion),
  };
}

function mapPatient(patient: Awaited<ReturnType<typeof prisma.paciente.findMany>>[number]): Patient {
  return {
    id: patient.id,
    name: patient.nombre,
    avatar: patient.avatar || undefined,
    initials: patient.iniciales,
    dob: patient.fechaNacimiento,
    age: patient.edad,
    phone: patient.telefono,
    allergies: patient.alergias || undefined,
    riskLevel: patient.nivelRiesgo as Patient['riskLevel'],
    status: patient.estado as Patient['status'],
    createdAt: toIso(patient.fechaCreacion),
    updatedAt: toIso(patient.fechaActualizacion),
  };
}

function mapAppointment(appointment: any): Appointment {
  return {
    id: appointment.id,
    date: appointment.fecha,
    time: appointment.hora,
    patientId: appointment.pacienteId,
    patient: mapPatient(appointment.paciente),
    treatment: appointment.tratamiento,
    status: appointment.estado as Appointment['status'],
    doctor: appointment.doctor as Appointment['doctor'],
    startHour: appointment.horaInicio,
    durationHours: appointment.duracionHoras,
    createdAt: toIso(appointment.fechaCreacion),
    updatedAt: toIso(appointment.fechaActualizacion),
  };
}

type BudgetWithItems = Prisma.PresupuestoGetPayload<{ include: { items: true } }>;

function mapBudget(budget: BudgetWithItems): Budget {
  return {
    id: budget.id,
    patientId: budget.pacienteId,
    status: budget.estado as Budget['status'],
    discountPercent: budget.porcentajeDescuento,
    createdAt: toIso(budget.fechaCreacion),
    updatedAt: toIso(budget.fechaActualizacion),
    items: budget.items.map((item) => ({
      id: item.id,
      code: item.codigo,
      description: item.descripcion,
      tooth: item.diente,
      unitPrice: item.precioUnitario,
      total: item.total,
    })),
  };
}

export async function readData(): Promise<ClinicData> {
  await ensureSeeded();
  const [users, patients, appointments, chats, budgets, odontograms, notifications, auditLogs, settings] = await Promise.all([
    prisma.usuario.findMany({ orderBy: { fechaCreacion: 'asc' } }),
    prisma.paciente.findMany({ orderBy: { fechaCreacion: 'asc' } }),
    prisma.cita.findMany({ include: { paciente: true }, orderBy: { fechaCreacion: 'asc' } }),
    prisma.chat.findMany({ orderBy: { fechaActualizacion: 'desc' } }),
    prisma.presupuesto.findMany({ include: { items: true }, orderBy: { fechaCreacion: 'desc' } }),
    prisma.odontograma.findMany(),
    prisma.notificacion.findMany({ orderBy: { fechaCreacion: 'desc' }, take: 100 }),
    prisma.registroAuditoria.findMany({ orderBy: { fechaCreacion: 'desc' }, take: 1000 }),
    prisma.configuracionClinica.findUnique({ where: { id: 'singleton' } }),
  ]);

  return {
    users: users.map(mapUser),
    patients: patients.map(mapPatient),
    appointments: appointments.map(mapAppointment),
    chats: chats.map((chat): Chat => ({
      id: chat.id,
      patientName: chat.nombrePaciente,
      initials: chat.iniciales,
      avatar: chat.avatar || undefined,
      lastMessage: chat.ultimoMensaje,
      time: chat.hora,
      isNew: chat.esNuevo,
      messages: JSON.parse(chat.mensajes) as Chat['messages'],
      updatedAt: toIso(chat.fechaActualizacion),
    })),
    budgets: budgets.map(mapBudget),
    odontograms: odontograms.map((odontogram): Odontogram => ({
      patientId: odontogram.pacienteId,
      teeth: JSON.parse(odontogram.dientes) as Odontogram['teeth'],
      interventions: JSON.parse(odontogram.intervenciones) as Odontogram['interventions'],
      updatedAt: toIso(odontogram.fechaActualizacion),
    })),
    notifications: notifications.map((notification): Notification => ({
      id: notification.id,
      title: notification.titulo,
      desc: notification.descripcion,
      time: notification.tiempo,
      read: notification.leido,
      createdAt: toIso(notification.fechaCreacion),
    })),
    auditLogs: auditLogs.map((auditLog): AuditLog => ({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorEmail: auditLog.actorEmail,
      action: auditLog.accion,
      entityType: auditLog.tipoEntidad,
      entityId: auditLog.entidadId || undefined,
      ip: auditLog.ip || undefined,
      createdAt: toIso(auditLog.fechaCreacion),
    })),
    settings: settings ? {
      clinicName: settings.nombreClinica,
      tagline: settings.eslogan,
      notationSystem: settings.sistemaNotacion as ClinicSettings['notationSystem'],
      whatsAppNumber: settings.numeroWhatsApp,
      complianceMode: settings.modoCumplimiento as ClinicSettings['complianceMode'],
      updatedAt: toIso(settings.fechaActualizacion),
    } : (await createSeedData()).settings,
  };
}
