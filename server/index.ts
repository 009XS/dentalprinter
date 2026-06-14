import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { readData, updateData } from './store';
import type { Appointment, Budget, BudgetItem, Doctor, Patient, Role, User } from './types';

const app = express();
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
  await updateData((data) => {
    data.auditLogs.unshift({
      id: uuid(),
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action,
      entityType,
      entityId,
      ip: req.ip,
      createdAt: now(),
    });
    data.auditLogs = data.auditLogs.slice(0, 1000);
  });
}

async function notify(title: string, desc: string) {
  await updateData((data) => {
    data.notifications.unshift({
      id: uuid(),
      title,
      desc,
      time: relativeTimeLabel(),
      read: false,
      createdAt: now(),
    });
    data.notifications = data.notifications.slice(0, 100);
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
  const data = await readData();
  const user = data.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signUser(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

app.get('/api/bootstrap', requireAuth, asyncHandler(async (_req, res) => {
  const data = await readData();
  const patientsById = new Map(data.patients.map((p) => [p.id, p]));
  res.json({
    user: (_req as AuthRequest).user,
    patients: data.patients,
    appointments: data.appointments.map((a) => ({ ...a, patient: patientsById.get(a.patientId) })),
    chats: data.chats,
    budgets: data.budgets.map((b) => ({ ...b, patient: patientsById.get(b.patientId) })),
    odontograms: data.odontograms,
    notifications: data.notifications,
    settings: data.settings,
  });
}));

app.get('/api/patients', requireAuth, asyncHandler(async (_req, res) => {
  const data = await readData();
  res.json(data.patients);
}));

app.post('/api/patients', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = patientSchema.parse(req.body);
  let created: Patient | undefined;
  await updateData((data) => {
    const id = `DP-${new Date().getFullYear()}-${uuid().slice(0, 8).toUpperCase()}`;
    created = { id, ...body, createdAt: now(), updatedAt: now() };
    data.patients.push(created);
  });
  await audit(req, 'create', 'patient', created?.id);
  await notify('Nueva ficha de paciente', `Se creó el expediente de ${created?.name} en la clínica.`);
  res.status(201).json(created);
}));

app.put('/api/patients/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = patientSchema.partial().parse(req.body);
  let updated: Patient | undefined;
  await updateData((data) => {
    const index = data.patients.findIndex((p) => p.id === req.params.id);
    if (index === -1) return;
    data.patients[index] = { ...data.patients[index], ...body, updatedAt: now() };
    updated = data.patients[index];
  });
  if (!updated) return res.status(404).json({ error: 'Paciente no encontrado' });
  await audit(req, 'update', 'patient', updated.id);
  res.json(updated);
}));

app.get('/api/appointments', requireAuth, asyncHandler(async (_req, res) => {
  const data = await readData();
  const patientsById = new Map(data.patients.map((p) => [p.id, p]));
  res.json(data.appointments.map((a) => ({ ...a, patient: patientsById.get(a.patientId) })));
}));

app.post('/api/appointments', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = appointmentSchema.parse(req.body);
  let created: Appointment | undefined;
  await updateData((data) => {
    if (!data.patients.some((p) => p.id === body.patientId)) throw Object.assign(new Error('Paciente no encontrado'), { status: 404 });
    const overlaps = data.appointments.some((a) =>
      a.doctor === body.doctor &&
      a.status !== 'Cancelada' &&
      body.startHour < a.startHour + a.durationHours &&
      body.startHour + body.durationHours > a.startHour
    );
    if (overlaps) throw Object.assign(new Error('La cita se traslapa con una reservación existente'), { status: 409 });
    created = { id: uuid(), ...body, doctor: body.doctor as Doctor, createdAt: now(), updatedAt: now() };
    data.appointments.push(created);
  });
  await audit(req, 'create', 'appointment', created?.id);
  await notify('Cita reservada', `${body.treatment} programada para las ${body.time}.`);
  res.status(201).json(created);
}));

app.patch('/api/appointments/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = appointmentSchema.partial().parse(req.body);
  let updated: Appointment | undefined;
  await updateData((data) => {
    const index = data.appointments.findIndex((a) => a.id === req.params.id);
    if (index === -1) return;
    data.appointments[index] = { ...data.appointments[index], ...body, updatedAt: now() };
    updated = data.appointments[index];
  });
  if (!updated) return res.status(404).json({ error: 'Cita no encontrada' });
  await audit(req, 'update', 'appointment', updated.id);
  res.json(updated);
}));

app.delete('/api/appointments/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  await updateData((data) => {
    data.appointments = data.appointments.map((a) => a.id === req.params.id ? { ...a, status: 'Cancelada', updatedAt: now() } : a);
  });
  await audit(req, 'cancel', 'appointment', req.params.id);
  await notify('Cita cancelada', `La cita ${req.params.id} fue cancelada.`);
  res.status(204).end();
}));

app.get('/api/budgets', requireAuth, asyncHandler(async (_req, res) => {
  const data = await readData();
  const patientsById = new Map(data.patients.map((p) => [p.id, p]));
  res.json(data.budgets.map((b) => ({ ...b, patient: patientsById.get(b.patientId) })));
}));

app.post('/api/budgets', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = budgetSchema.parse(req.body);
  let created: Budget | undefined;
  await updateData((data) => {
    if (!data.patients.some((p) => p.id === body.patientId)) throw Object.assign(new Error('Paciente no encontrado'), { status: 404 });
    created = {
      id: `PR-${new Date().getFullYear()}-${uuid().slice(0, 8).toUpperCase()}`,
      ...body,
      items: body.items.map((item): BudgetItem => ({ id: uuid(), ...item, total: item.total ?? item.unitPrice })),
      createdAt: now(),
      updatedAt: now(),
    };
    data.budgets.push(created);
  });
  await audit(req, 'create', 'budget', created?.id);
  await notify('Presupuesto creado', `El presupuesto estimado ${created?.id} fue creado.`);
  res.status(201).json(created);
}));

app.post('/api/budgets/:id/items', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = budgetItemSchema.parse(req.body);
  let item: BudgetItem | undefined;
  await updateData((data) => {
    const budget = data.budgets.find((b) => b.id === req.params.id);
    if (!budget) return;
    item = { id: uuid(), ...body, total: body.total ?? body.unitPrice };
    budget.items.push(item);
    budget.updatedAt = now();
  });
  if (!item) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  await audit(req, 'add_item', 'budget', req.params.id);
  res.status(201).json(item);
}));

app.get('/api/odontograms/:patientId', requireAuth, asyncHandler(async (req, res) => {
  const data = await readData();
  const odontogram = data.odontograms.find((o) => o.patientId === req.params.patientId);
  res.json(odontogram || { patientId: req.params.patientId, teeth: {}, interventions: [], updatedAt: now() });
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
  let saved;
  await updateData((data) => {
    const teeth = Object.fromEntries(
      Object.entries(body.teeth).map(([key, tooth]) => [key, { ...tooth, updatedAt: tooth.updatedAt || now() }]),
    );
    const next = { patientId: req.params.patientId, ...body, teeth, updatedAt: now() };
    const index = data.odontograms.findIndex((o) => o.patientId === req.params.patientId);
    if (index >= 0) data.odontograms[index] = next;
    else data.odontograms.push(next);
    saved = next;
  });
  res.json(saved);
}));

app.get('/api/notifications', requireAuth, asyncHandler(async (_req, res) => {
  const data = await readData();
  res.json(data.notifications);
}));

app.post('/api/notifications/read-all', requireAuth, asyncHandler(async (req, res) => {
  await updateData((data) => {
    data.notifications = data.notifications.map((n) => ({ ...n, read: true }));
  });
  await audit(req, 'read_all', 'notification');
  res.status(204).end();
}));

app.get('/api/audit-logs', requireAuth, requireRole('admin'), asyncHandler(async (_req, res) => {
  const data = await readData();
  res.json(data.auditLogs.slice(0, 200));
}));

app.get('/api/settings', requireAuth, asyncHandler(async (_req, res) => {
  const data = await readData();
  res.json(data.settings);
}));

app.put('/api/settings', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const body = z.object({
    clinicName: z.string().min(2).max(80),
    tagline: z.string().min(2).max(120),
    notationSystem: z.enum(['universal', 'fdi']),
    whatsAppNumber: z.string().min(7).max(40),
    complianceMode: z.enum(['demo', 'production']).default('demo'),
  }).parse(req.body);
  let settings;
  await updateData((data) => {
    data.settings = { ...body, updatedAt: now() };
    settings = data.settings;
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
