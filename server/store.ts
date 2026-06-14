import { Prisma } from '@prisma/client';
import type { ClinicData, User, Patient, Appointment, Chat, Budget, Odontogram, ClinicSettings, Notification, AuditLog } from './types';
import { createSeedData } from './seed';
import { prisma } from './db';

const toIso = (value: Date | string) => value instanceof Date ? value.toISOString() : value;

async function ensureSeeded() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;
  const seed = await createSeedData();
  await prisma.$transaction(async (tx) => {
    if (seed.users.length) await tx.user.createMany({ data: seed.users });
    if (seed.patients.length) await tx.patient.createMany({ data: seed.patients });
    if (seed.appointments.length) await tx.appointment.createMany({ data: seed.appointments });
    if (seed.chats.length) {
      await tx.chat.createMany({
        data: seed.chats.map((chat) => ({
          id: chat.id,
          patientName: chat.patientName,
          initials: chat.initials,
          avatar: chat.avatar,
          lastMessage: chat.lastMessage,
          time: chat.time,
          isNew: chat.isNew,
          messages: JSON.stringify(chat.messages),
          updatedAt: chat.updatedAt,
        })),
      });
    }
    for (const budget of seed.budgets) {
      await tx.budget.create({
        data: {
          id: budget.id,
          patientId: budget.patientId!,
          status: budget.status,
          discountPercent: budget.discountPercent,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
          items: {
            create: budget.items.map((item) => ({
              id: item.id!,
              code: item.code,
              description: item.description,
              tooth: item.tooth,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });
    }
    for (const odontogram of seed.odontograms) {
      await tx.odontogram.create({
        data: {
          patientId: odontogram.patientId,
          teeth: JSON.stringify(odontogram.teeth),
          interventions: JSON.stringify(odontogram.interventions),
          updatedAt: odontogram.updatedAt,
        },
      });
    }
    if (seed.notifications.length) await tx.notification.createMany({ data: seed.notifications });
    await tx.clinicSettings.create({ data: { id: 'singleton', ...seed.settings } });
  });
}

function mapUser(user: Awaited<ReturnType<typeof prisma.user.findMany>>[number]): User {
  return { ...user, role: user.role as User['role'], createdAt: toIso(user.createdAt) };
}

function mapPatient(patient: Awaited<ReturnType<typeof prisma.patient.findMany>>[number]): Patient {
  return {
    ...patient,
    avatar: patient.avatar || undefined,
    allergies: patient.allergies || undefined,
    riskLevel: patient.riskLevel as Patient['riskLevel'],
    createdAt: toIso(patient.createdAt),
    updatedAt: toIso(patient.updatedAt),
  };
}

function mapAppointment(appointment: Awaited<ReturnType<typeof prisma.appointment.findMany>>[number]): Appointment {
  return {
    ...appointment,
    status: appointment.status as Appointment['status'],
    doctor: appointment.doctor as Appointment['doctor'],
    createdAt: toIso(appointment.createdAt),
    updatedAt: toIso(appointment.updatedAt),
  };
}

type BudgetWithItems = Prisma.BudgetGetPayload<{ include: { items: true } }>;

function mapBudget(budget: BudgetWithItems): Budget {
  return {
    id: budget.id,
    patientId: budget.patientId,
    status: budget.status as Budget['status'],
    discountPercent: budget.discountPercent,
    createdAt: toIso(budget.createdAt),
    updatedAt: toIso(budget.updatedAt),
    items: budget.items.map((item) => ({
      id: item.id,
      code: item.code,
      description: item.description,
      tooth: item.tooth,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
  };
}

export async function readData(): Promise<ClinicData> {
  await ensureSeeded();
  const [users, patients, appointments, chats, budgets, odontograms, notifications, auditLogs, settings] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.patient.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.appointment.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.chat.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.budget.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } }),
    prisma.odontogram.findMany(),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
    prisma.clinicSettings.findUnique({ where: { id: 'singleton' } }),
  ]);

  return {
    users: users.map(mapUser),
    patients: patients.map(mapPatient),
    appointments: appointments.map(mapAppointment),
    chats: chats.map((chat): Chat => ({
      id: chat.id,
      patientName: chat.patientName,
      initials: chat.initials,
      avatar: chat.avatar || undefined,
      lastMessage: chat.lastMessage,
      time: chat.time,
      isNew: chat.isNew,
      messages: JSON.parse(chat.messages) as Chat['messages'],
      updatedAt: toIso(chat.updatedAt),
    })),
    budgets: budgets.map(mapBudget),
    odontograms: odontograms.map((odontogram): Odontogram => ({
      patientId: odontogram.patientId,
      teeth: JSON.parse(odontogram.teeth) as Odontogram['teeth'],
      interventions: JSON.parse(odontogram.interventions) as Odontogram['interventions'],
      updatedAt: toIso(odontogram.updatedAt),
    })),
    notifications: notifications.map((notification): Notification => ({
      ...notification,
      createdAt: toIso(notification.createdAt),
    })),
    auditLogs: auditLogs.map((auditLog): AuditLog => ({
      ...auditLog,
      entityId: auditLog.entityId || undefined,
      ip: auditLog.ip || undefined,
      createdAt: toIso(auditLog.createdAt),
    })),
    settings: settings ? {
      clinicName: settings.clinicName,
      tagline: settings.tagline,
      notationSystem: settings.notationSystem as ClinicSettings['notationSystem'],
      whatsAppNumber: settings.whatsAppNumber,
      complianceMode: settings.complianceMode as ClinicSettings['complianceMode'],
      updatedAt: toIso(settings.updatedAt),
    } : (await createSeedData()).settings,
  };
}
