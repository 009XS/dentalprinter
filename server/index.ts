import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { readData } from './store';
import { prisma } from './db';
import type { Appointment, Budget, BudgetItem, Doctor, Patient, Role, User } from './types';

const app = express();
app.set('trust proxy', true);
const port = Number(process.env.API_PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-before-deploy';
const now = () => new Date().toISOString();

function relativeTimeLabel(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

app.use(helmet());
app.use(cors({ origin: process.env.APP_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '256kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

interface AuthRequest extends Request {
  user?: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

const asyncHandler = (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

function signUser(user: User) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    jwtSecret,
    { expiresIn: '8h' },
  );
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      sub: string;
      email: string;
      name: string;
      role: Role;
    };
    req.user = { id: decoded.sub, email: decoded.email, name: decoded.name, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

async function audit(req: AuthRequest, action: string, entityType: string, entityId?: string) {
  if (!req.user) return;
  await prisma.auditLog.create({
    data: {
      id: uuid(),
      actorId: req.user.id,
      actorEmail: req.user.email,
      action,
      entityType,
      entityId: entityId || null,
      ip: req.ip || null,
    }
  });
}

async function notify(title: string, desc: string) {
  await prisma.notification.create({
    data: {
      id: uuid(),
      title,
      desc,
      time: relativeTimeLabel(),
      read: false,
    }
  });
}

const patientSchema = z.object({
  name: z.string().min(2).max(120),
  initials: z.string().min(1).max(4),
  dob: z.string().min(4).max(20),
  age: z.number().int().min(0).max(130),
  phone: z.string().min(7).max(40),
  allergies: z.string().max(200).optional(),
  riskLevel: z.enum(['Bajo Riesgo', 'Medio Riesgo', 'Alto Riesgo']),
});

const appointmentSchema = z.object({
  time: z.string().min(4).max(20),
  patientId: z.string().min(1),
  treatment: z.string().min(2).max(200),
  status: z.enum(['Confirmada', 'En Espera', 'Atrasada', 'Pendiente', 'Cancelada']).default('Pendiente'),
  doctor: z.enum(['Dr. Pérez', 'Dra. Gómez', 'Higiene 1']),
  startHour: z.number().min(0).max(24),
  durationHours: z.number().min(0.25).max(8),
});

const budgetItemSchema = z.object({
  code: z.string().min(2).max(20),
  description: z.string().min(2).max(240),
  tooth: z.string().min(1).max(8),
  unitPrice: z.number().min(0).max(100000),
  total: z.number().min(0).max(100000).optional(),
});

const budgetSchema = z.object({
  patientId: z.string().min(1),
  status: z.enum(['Pendiente', 'Aprobado', 'Enviado']).default('Pendiente'),
  discountPercent: z.number().min(0).max(100).default(0),
  items: z.array(budgetItemSchema).default([]),
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'dentalprinter-api', time: now() });
});

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }).parse(req.body);
  
  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = signUser({
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role as Role,
    createdAt: user.createdAt.toISOString()
  });
  
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

app.get('/api/bootstrap', requireAuth, asyncHandler(async (_req, res) => {
  const data = await readData();
  res.json(data);
}));

app.get('/api/patients', requireAuth, asyncHandler(async (_req, res) => {
  const patients = await prisma.patient.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(patients);
}));

app.post('/api/patients', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = patientSchema.parse(req.body);
  const id = `DP-${new Date().getFullYear()}-${uuid().slice(0, 8).toUpperCase()}`;
  
  const created = await prisma.patient.create({
    data: {
      id,
      name: body.name,
      initials: body.initials,
      dob: body.dob,
      age: body.age,
      phone: body.phone,
      allergies: body.allergies || null,
      riskLevel: body.riskLevel,
    }
  });

  await audit(req, 'create', 'patient', created.id);
  await notify('Nueva ficha de paciente', `Se creó el expediente de ${created.name} en la clínica.`);
  
  res.status(201).json(created);
}));

app.put('/api/patients/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = patientSchema.partial().parse(req.body);
  
  const updated = await prisma.patient.update({
    where: { id: req.params.id },
    data: {
      ...body,
      allergies: body.allergies !== undefined ? (body.allergies || null) : undefined,
    }
  });

  await audit(req, 'update', 'patient', updated.id);
  res.json(updated);
}));

app.get('/api/appointments', requireAuth, asyncHandler(async (_req, res) => {
  const appointments = await prisma.appointment.findMany({
    include: { patient: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(appointments);
}));

app.post('/api/appointments', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = appointmentSchema.parse(req.body);
  
  const patientExists = await prisma.patient.findUnique({ where: { id: body.patientId } });
  if (!patientExists) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }

  // Verificar solapamiento para el mismo doctor y citas activas (no canceladas)
  const doctorAppointments = await prisma.appointment.findMany({
    where: {
      doctor: body.doctor,
      status: { not: 'Cancelada' }
    }
  });

  const overlaps = doctorAppointments.some((a) =>
    body.startHour < a.startHour + a.durationHours &&
    body.startHour + body.durationHours > a.startHour
  );

  if (overlaps) {
    return res.status(409).json({ error: 'La cita se traslapa con una reservación existente' });
  }

  const created = await prisma.appointment.create({
    data: {
      id: uuid(),
      time: body.time,
      patientId: body.patientId,
      treatment: body.treatment,
      status: body.status,
      doctor: body.doctor,
      startHour: body.startHour,
      durationHours: body.durationHours,
    },
    include: { patient: true }
  });

  await audit(req, 'create', 'appointment', created.id);
  await notify('Cita reservada', `${body.treatment} programada para las ${body.time}.`);
  
  res.status(201).json(created);
}));

app.patch('/api/appointments/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = appointmentSchema.partial().parse(req.body);
  
  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: body,
    include: { patient: true }
  });

  await audit(req, 'update', 'appointment', updated.id);
  res.json(updated);
}));

app.delete('/api/appointments/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const id = req.params.id;
  
  await prisma.appointment.update({
    where: { id },
    data: { status: 'Cancelada' }
  });

  await audit(req, 'cancel', 'appointment', id);
  await notify('Cita cancelada', `La cita ${id} fue cancelada.`);
  
  res.status(204).end();
}));

app.get('/api/budgets', requireAuth, asyncHandler(async (_req, res) => {
  const budgets = await prisma.budget.findMany({
    include: { items: true, patient: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(budgets);
}));

app.post('/api/budgets', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = budgetSchema.parse(req.body);
  
  const patientExists = await prisma.patient.findUnique({ where: { id: body.patientId } });
  if (!patientExists) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }

  const id = `PR-${new Date().getFullYear()}-${uuid().slice(0, 8).toUpperCase()}`;
  
  const created = await prisma.budget.create({
    data: {
      id,
      patientId: body.patientId,
      status: body.status,
      discountPercent: body.discountPercent,
      items: {
        create: body.items.map((item) => ({
          id: uuid(),
          code: item.code,
          description: item.description,
          tooth: item.tooth,
          unitPrice: item.unitPrice,
          total: item.total ?? item.unitPrice,
        }))
      }
    },
    include: { items: true, patient: true }
  });

  await audit(req, 'create', 'budget', created.id);
  await notify('Presupuesto creado', `El presupuesto estimado ${created.id} fue creado.`);
  
  res.status(201).json(created);
}));

app.post('/api/budgets/:id/items', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = budgetItemSchema.parse(req.body);
  
  const budgetExists = await prisma.budget.findUnique({ where: { id: req.params.id } });
  if (!budgetExists) {
    return res.status(404).json({ error: 'Presupuesto no encontrado' });
  }

  const createdItem = await prisma.budgetItem.create({
    data: {
      id: uuid(),
      budgetId: req.params.id,
      code: body.code,
      description: body.description,
      tooth: body.tooth,
      unitPrice: body.unitPrice,
      total: body.total ?? body.unitPrice,
    }
  });

  await audit(req, 'add_item', 'budget', req.params.id);
  res.status(201).json(createdItem);
}));

app.get('/api/odontograms/:patientId', requireAuth, asyncHandler(async (req, res) => {
  const odontogram = await prisma.odontogram.findUnique({ where: { patientId: req.params.patientId } });
  res.json(odontogram ? {
    patientId: odontogram.patientId,
    teeth: JSON.parse(odontogram.teeth),
    interventions: JSON.parse(odontogram.interventions),
    updatedAt: odontogram.updatedAt.toISOString()
  } : {
    patientId: req.params.patientId,
    teeth: {},
    interventions: [],
    updatedAt: now()
  });
}));

app.put('/api/odontograms/:patientId', requireAuth, requireRole('admin', 'doctor'), asyncHandler(async (req, res) => {
  const schema = z.object({
    teeth: z.record(z.string(), z.object({
      id: z.number().int().min(1).max(99),
      isPediatric: z.boolean(),
      hasCaries: z.boolean(),
      hasFracture: z.boolean(),
      hasMissing: z.boolean(),
      hasCrown: z.boolean(),
      hasImplant: z.boolean(),
      notes: z.string().max(2000).optional(),
      updatedAt: z.string().optional(),
    })),
    interventions: z.array(z.object({
      id: z.string(),
      title: z.string(),
      desc: z.string(),
      type: z.enum(['healthy', 'info', 'warning']),
      createdAt: z.string(),
    })).default([]),
  });
  const body = schema.parse(req.body);

  const teeth = Object.fromEntries(
    Object.entries(body.teeth).map(([key, tooth]) => [key, { ...tooth, updatedAt: tooth.updatedAt || now() }]),
  );

  const saved = await prisma.odontogram.upsert({
    where: { patientId: req.params.patientId },
    create: {
      patientId: req.params.patientId,
      teeth: JSON.stringify(teeth),
      interventions: JSON.stringify(body.interventions),
    },
    update: {
      teeth: JSON.stringify(teeth),
      interventions: JSON.stringify(body.interventions),
    }
  });

  res.json({
    patientId: saved.patientId,
    teeth: JSON.parse(saved.teeth),
    interventions: JSON.parse(saved.interventions),
    updatedAt: saved.updatedAt.toISOString()
  });
}));

app.get('/api/chats', requireAuth, asyncHandler(async (_req, res) => {
  const chats = await prisma.chat.findMany({ orderBy: { updatedAt: 'desc' } });
  res.json(chats.map(c => ({
    ...c,
    messages: JSON.parse(c.messages)
  })));
}));

app.put('/api/chats/:id', requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({
    lastMessage: z.string(),
    time: z.string(),
    isNew: z.boolean().default(false),
    messages: z.array(z.object({
      id: z.string(),
      sender: z.enum(['patient', 'doctor']),
      text: z.string(),
      time: z.string(),
    })),
  });
  const body = schema.parse(req.body);

  const updated = await prisma.chat.upsert({
    where: { id: req.params.id },
    create: {
      id: req.params.id,
      patientName: req.body.patientName || 'Paciente',
      initials: req.body.initials || 'P',
      avatar: req.body.avatar || null,
      lastMessage: body.lastMessage,
      time: body.time,
      isNew: body.isNew,
      messages: JSON.stringify(body.messages),
    },
    update: {
      lastMessage: body.lastMessage,
      time: body.time,
      isNew: body.isNew,
      messages: JSON.stringify(body.messages),
    }
  });

  res.json({
    ...updated,
    messages: JSON.parse(updated.messages)
  });
}));

app.get('/api/notifications', requireAuth, asyncHandler(async (_req, res) => {
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(notifications);
}));

app.post('/api/notifications/read-all', requireAuth, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    data: { read: true }
  });
  await audit(req, 'read_all', 'notification');
  res.status(204).end();
}));

app.get('/api/audit-logs', requireAuth, requireRole('admin'), asyncHandler(async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json(logs);
}));

app.get('/api/settings', requireAuth, asyncHandler(async (_req, res) => {
  const settings = await prisma.clinicSettings.findUnique({ where: { id: 'singleton' } });
  res.json(settings);
}));

app.put('/api/settings', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const body = z.object({
    clinicName: z.string().min(2).max(80),
    tagline: z.string().min(2).max(120),
    notationSystem: z.enum(['universal', 'fdi']),
    whatsAppNumber: z.string().min(7).max(40),
    complianceMode: z.enum(['demo', 'production']).default('demo'),
  }).parse(req.body);

  const settings = await prisma.clinicSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...body },
    update: body,
  });

  res.json(settings);
}));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Error de validación', details: err.flatten() });
  }
  const maybe = err as Error & { status?: number };
  res.status(maybe.status || 500).json({ error: maybe.message || 'Error inesperado del servidor' });
});

app.listen(port, () => {
  console.log(`Dentalprinter API listening on http://localhost:${port}`);
});
