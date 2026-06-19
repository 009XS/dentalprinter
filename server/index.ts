import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
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
  await prisma.registroAuditoria.create({
    data: {
      id: uuid(),
      actorId: req.user.id,
      actorEmail: req.user.email,
      accion: action,
      tipoEntidad: entityType,
      entidadId: entityId || null,
      ip: req.ip || null,
    }
  });
}

async function notify(title: string, desc: string) {
  await prisma.notificacion.create({
    data: {
      id: uuid(),
      titulo: title,
      descripcion: desc,
      tiempo: relativeTimeLabel(),
      leido: false,
    }
  });
}

// Helpers to map Spanish Database structures to English API Types
function mapDbPatient(p: any) {
  return {
    id: p.id,
    name: p.nombre,
    avatar: p.avatar || undefined,
    initials: p.iniciales,
    dob: p.fechaNacimiento,
    age: p.edad,
    phone: p.telefono,
    allergies: p.alergias || undefined,
    riskLevel: p.nivelRiesgo,
    status: p.estado,
    createdAt: p.fechaCreacion.toISOString(),
    updatedAt: p.fechaActualizacion.toISOString()
  };
}

function mapDbAppointment(a: any) {
  return {
    id: a.id,
    date: a.fecha,
    time: a.hora,
    patientId: a.pacienteId,
    patient: a.paciente ? mapDbPatient(a.paciente) : undefined,
    treatment: a.tratamiento,
    status: a.estado,
    doctor: a.doctor,
    startHour: a.horaInicio,
    durationHours: a.duracionHoras,
    createdAt: a.fechaCreacion.toISOString(),
    updatedAt: a.fechaActualizacion.toISOString()
  };
}

function mapDbBudget(b: any) {
  return {
    id: b.id,
    patientId: b.pacienteId,
    patient: b.paciente ? mapDbPatient(b.paciente) : undefined,
    status: b.estado,
    discountPercent: b.porcentajeDescuento,
    createdAt: b.fechaCreacion.toISOString(),
    updatedAt: b.fechaActualizacion.toISOString(),
    items: b.items ? b.items.map((item: any) => ({
      id: item.id,
      code: item.codigo,
      description: item.descripcion,
      tooth: item.diente,
      unitPrice: item.precioUnitario,
      total: item.total
    })) : []
  };
}

function mapDbAttachment(att: any) {
  return {
    id: att.id,
    patientId: att.pacienteId,
    fileName: att.nombreArchivo,
    originalName: att.nombreOriginal,
    mimeType: att.tipoMime,
    sizeBytes: att.tamanoBytes,
    category: att.categoria,
    description: att.descripcion || undefined,
    uploadedBy: att.subidoPor || undefined,
    createdAt: att.fechaCreacion.toISOString(),
    url: `/api/attachments/${att.id}/file`
  };
}

const patientSchema = z.object({
  name: z.string().min(2).max(120),
  initials: z.string().min(1).max(4),
  dob: z.string().min(4).max(20),
  age: z.number().int().min(0).max(130),
  phone: z.string().min(7).max(40),
  allergies: z.string().max(200).optional(),
  riskLevel: z.enum(['Bajo Riesgo', 'Medio Riesgo', 'Alto Riesgo']),
  status: z.enum(['Activo', 'Inactivo', 'Archivado']).default('Activo'),
});

const appointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

const medicalHistorySchema = z.object({
  allergies: z.string().max(1000).optional().nullable(),
  medications: z.string().max(1000).optional().nullable(),
  diseases: z.string().max(1000).optional().nullable(),
  surgeries: z.string().max(1000).optional().nullable(),
  observations: z.string().max(5000).optional().nullable(),
  officialSections: z.string().max(1000000).optional().default("{}"),
  flexibleSections: z.string().max(10000).optional().default("{}"),
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'dentalprinter-api', time: now() });
});

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }).parse(req.body);
  
  const user = await prisma.usuario.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(body.password, user.claveHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = signUser({
    id: user.id,
    name: user.nombre,
    email: user.email,
    passwordHash: user.claveHash,
    role: user.rol as Role,
    createdAt: user.fechaCreacion.toISOString()
  });
  
  res.json({ token, user: { id: user.id, name: user.nombre, email: user.email, role: user.rol } });
}));

app.get('/api/bootstrap', requireAuth, asyncHandler(async (_req, res) => {
  const data = await readData();
  res.json(data);
}));

app.get('/api/patients', requireAuth, asyncHandler(async (_req, res) => {
  const patients = await prisma.paciente.findMany({ orderBy: { fechaCreacion: 'asc' } });
  res.json(patients.map(mapDbPatient));
}));

app.post('/api/patients', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = patientSchema.parse(req.body);
  const id = `DP-${new Date().getFullYear()}-${uuid().slice(0, 8).toUpperCase()}`;
  
  const created = await prisma.paciente.create({
    data: {
      id,
      nombre: body.name,
      iniciales: body.initials,
      fechaNacimiento: body.dob,
      edad: body.age,
      telefono: body.phone,
      alergias: body.allergies || null,
      nivelRiesgo: body.riskLevel,
      estado: body.status,
    }
  });

  await audit(req, 'create', 'patient', created.id);
  await notify('Nueva ficha de paciente', `Se creó el expediente de ${created.nombre} en la clínica.`);
  
  res.status(201).json(mapDbPatient(created));
}));

app.put('/api/patients/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = patientSchema.partial().parse(req.body);
  
  const updateData: any = {};
  if (body.name !== undefined) updateData.nombre = body.name;
  if (body.initials !== undefined) updateData.initials = body.initials;
  if (body.dob !== undefined) updateData.fechaNacimiento = body.dob;
  if (body.age !== undefined) updateData.edad = body.age;
  if (body.phone !== undefined) updateData.telefono = body.phone;
  if (body.allergies !== undefined) updateData.alergias = body.allergies || null;
  if (body.riskLevel !== undefined) updateData.nivelRiesgo = body.riskLevel;
  if (body.status !== undefined) updateData.estado = body.status;

  const updated = await prisma.paciente.update({
    where: { id: req.params.id },
    data: updateData
  });

  await audit(req, 'update', 'patient', updated.id);
  res.json(mapDbPatient(updated));
}));

app.get('/api/patients/:patientId/medical-history', requireAuth, asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  
  const patientExists = await prisma.paciente.findUnique({ where: { id: patientId } });
  if (!patientExists) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }

  const history = await prisma.historialMedico.findUnique({
    where: { pacienteId: patientId }
  });

  if (!history) {
    return res.json({
      patientId,
      allergies: '',
      medications: '',
      diseases: '',
      surgeries: '',
      observations: '',
      officialSections: '{}',
      flexibleSections: '{}'
    });
  }

  res.json({
    patientId: history.pacienteId,
    allergies: history.alergias || '',
    medications: history.medicamentos || '',
    diseases: history.enfermedades || '',
    surgeries: history.cirugias || '',
    observations: history.observaciones || '',
    officialSections: history.seccionesOficiales,
    flexibleSections: history.seccionesFlexibles
  });
}));

app.put('/api/patients/:patientId/medical-history', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const body = medicalHistorySchema.parse(req.body);

  const patientExists = await prisma.paciente.findUnique({ where: { id: patientId } });
  if (!patientExists) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }

  const currentHistory = await prisma.historialMedico.findUnique({
    where: { pacienteId: patientId }
  });

  let mergedOfficial = '{}';
  if (currentHistory && currentHistory.seccionesOficiales) {
    try {
      const currentParsed = JSON.parse(currentHistory.seccionesOficiales);
      const incomingParsed = typeof body.officialSections === 'string'
        ? JSON.parse(body.officialSections)
        : body.officialSections || {};
      
      const mergedObj = {
        ...currentParsed,
        ...incomingParsed
      };
      mergedOfficial = JSON.stringify(mergedObj);
    } catch {
      mergedOfficial = body.officialSections || '{}';
    }
  } else {
    try {
      if (body.officialSections) {
        JSON.parse(body.officialSections);
        mergedOfficial = body.officialSections;
      }
    } catch {
      return res.status(400).json({ error: 'officialSections debe ser una cadena JSON válida' });
    }
  }

  const updated = await prisma.historialMedico.upsert({
    where: { pacienteId: patientId },
    create: {
      pacienteId: patientId,
      alergias: body.allergies || null,
      medicamentos: body.medications || null,
      enfermedades: body.diseases || null,
      cirugias: body.surgeries || null,
      observaciones: body.observations || null,
      seccionesOficiales: mergedOfficial,
      seccionesFlexibles: body.flexibleSections || '{}',
    },
    update: {
      alergias: body.allergies !== undefined ? (body.allergies || null) : undefined,
      medicamentos: body.medications !== undefined ? (body.medications || null) : undefined,
      enfermedades: body.diseases !== undefined ? (body.diseases || null) : undefined,
      cirugias: body.surgeries !== undefined ? (body.surgeries || null) : undefined,
      observaciones: body.observations !== undefined ? (body.observations || null) : undefined,
      seccionesOficiales: mergedOfficial,
      seccionesFlexibles: body.flexibleSections !== undefined ? (body.flexibleSections || '{}') : undefined,
    }
  });

  await audit(req, 'update', 'medical_history', patientId);

  res.json({
    patientId: updated.pacienteId,
    allergies: updated.alergias || '',
    medications: updated.medicamentos || '',
    diseases: updated.enfermedades || '',
    surgeries: updated.cirugias || '',
    observations: updated.observaciones || '',
    officialSections: updated.seccionesOficiales,
    flexibleSections: updated.seccionesFlexibles
  });
}));

app.get('/api/appointments', requireAuth, asyncHandler(async (_req, res) => {
  const appointments = await prisma.cita.findMany({
    include: { paciente: true },
    orderBy: { fechaCreacion: 'asc' }
  });
  res.json(appointments.map(mapDbAppointment));
}));

app.post('/api/appointments', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = appointmentSchema.parse(req.body);
  
  const patientExists = await prisma.paciente.findUnique({ where: { id: body.patientId } });
  if (!patientExists) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }

  // Verificar solapamiento para el mismo doctor, la misma fecha y citas activas (no canceladas)
  const doctorAppointments = await prisma.cita.findMany({
    where: {
      doctor: body.doctor,
      fecha: body.date,
      estado: { not: 'Cancelada' }
    }
  });

  const overlaps = doctorAppointments.some((a) =>
    body.startHour < a.horaInicio + a.duracionHoras &&
    body.startHour + body.durationHours > a.horaInicio
  );

  if (overlaps) {
    return res.status(409).json({ error: 'La cita se traslapa con una reservación existente' });
  }

  const created = await prisma.cita.create({
    data: {
      id: uuid(),
      fecha: body.date,
      hora: body.time,
      pacienteId: body.patientId,
      tratamiento: body.treatment,
      estado: body.status,
      doctor: body.doctor,
      horaInicio: body.startHour,
      duracionHoras: body.durationHours,
    },
    include: { paciente: true }
  });

  await audit(req, 'create', 'appointment', created.id);
  await notify('Cita reservada', `${body.treatment} programada para las ${body.time}.`);
  
  res.status(201).json(mapDbAppointment(created));
}));

app.patch('/api/appointments/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = appointmentSchema.partial().parse(req.body);
  
  const updateData: any = {};
  if (body.date !== undefined) updateData.fecha = body.date;
  if (body.time !== undefined) updateData.hora = body.time;
  if (body.patientId !== undefined) updateData.pacienteId = body.patientId;
  if (body.treatment !== undefined) updateData.tratamiento = body.treatment;
  if (body.status !== undefined) updateData.estado = body.status;
  if (body.doctor !== undefined) updateData.doctor = body.doctor;
  if (body.startHour !== undefined) updateData.horaInicio = body.startHour;
  if (body.durationHours !== undefined) updateData.duracionHoras = body.durationHours;

  const updated = await prisma.cita.update({
    where: { id: req.params.id },
    data: updateData,
    include: { paciente: true }
  });

  await audit(req, 'update', 'appointment', updated.id);
  res.json(mapDbAppointment(updated));
}));

app.delete('/api/appointments/:id', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const id = req.params.id;
  
  await prisma.cita.delete({
    where: { id }
  });

  await audit(req, 'delete', 'appointment', id);
  await notify('Cita eliminada', `La cita ${id} fue eliminada.`);
  
  res.status(204).end();
}));

app.get('/api/budgets', requireAuth, asyncHandler(async (_req, res) => {
  const budgets = await prisma.presupuesto.findMany({
    include: { items: true, paciente: true },
    orderBy: { fechaCreacion: 'desc' }
  });
  res.json(budgets.map(mapDbBudget));
}));

app.post('/api/budgets', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = budgetSchema.parse(req.body);
  
  const patientExists = await prisma.paciente.findUnique({ where: { id: body.patientId } });
  if (!patientExists) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }

  const id = `PR-${new Date().getFullYear()}-${uuid().slice(0, 8).toUpperCase()}`;
  
  const created = await prisma.presupuesto.create({
    data: {
      id,
      pacienteId: body.patientId,
      estado: body.status,
      porcentajeDescuento: body.discountPercent,
      items: {
        create: body.items.map((item) => ({
          id: uuid(),
          codigo: item.code,
          descripcion: item.description,
          diente: item.tooth,
          precioUnitario: item.unitPrice,
          total: item.total ?? item.unitPrice,
        }))
      }
    },
    include: { items: true, paciente: true }
  });

  await audit(req, 'create', 'budget', created.id);
  await notify('Presupuesto creado', `El presupuesto estimado ${created.id} fue creado.`);
  
  res.status(201).json(mapDbBudget(created));
}));

app.post('/api/budgets/:id/items', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const body = budgetItemSchema.parse(req.body);
  
  const budgetExists = await prisma.presupuesto.findUnique({ where: { id: req.params.id } });
  if (!budgetExists) {
    return res.status(404).json({ error: 'Presupuesto no encontrado' });
  }

  const createdItem = await prisma.itemPresupuesto.create({
    data: {
      id: uuid(),
      presupuestoId: req.params.id,
      codigo: body.code,
      descripcion: body.description,
      diente: body.tooth,
      precioUnitario: body.unitPrice,
      total: body.total ?? body.unitPrice,
    }
  });

  await audit(req, 'add_item', 'budget', req.params.id);
  res.status(201).json({
    id: createdItem.id,
    code: createdItem.codigo,
    description: createdItem.descripcion,
    tooth: createdItem.diente,
    unitPrice: createdItem.precioUnitario,
    total: createdItem.total
  });
}));

app.get('/api/odontograms/:patientId', requireAuth, asyncHandler(async (req, res) => {
  const odontogram = await prisma.odontograma.findUnique({ where: { pacienteId: req.params.patientId } });
  res.json(odontogram ? {
    patientId: odontogram.pacienteId,
    teeth: JSON.parse(odontogram.dientes),
    interventions: JSON.parse(odontogram.intervenciones),
    updatedAt: odontogram.fechaActualizacion.toISOString()
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
      surfaces: z.object({
        top: z.enum(['caries', 'fracture', 'crown', 'healthy']).optional(),
        bottom: z.enum(['caries', 'fracture', 'crown', 'healthy']).optional(),
        left: z.enum(['caries', 'fracture', 'crown', 'healthy']).optional(),
        right: z.enum(['caries', 'fracture', 'crown', 'healthy']).optional(),
        center: z.enum(['caries', 'fracture', 'crown', 'healthy']).optional(),
      }).optional(),
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

  const saved = await prisma.odontograma.upsert({
    where: { pacienteId: req.params.patientId },
    create: {
      pacienteId: req.params.patientId,
      dientes: JSON.stringify(teeth),
      intervenciones: JSON.stringify(body.interventions),
    },
    update: {
      dientes: JSON.stringify(teeth),
      intervenciones: JSON.stringify(body.interventions),
    }
  });

  res.json({
    patientId: saved.pacienteId,
    teeth: JSON.parse(saved.dientes),
    interventions: JSON.parse(saved.intervenciones),
    updatedAt: saved.fechaActualizacion.toISOString()
  });
}));

app.get('/api/chats', requireAuth, asyncHandler(async (_req, res) => {
  const chats = await prisma.chat.findMany({ orderBy: { fechaActualizacion: 'desc' } });
  res.json(chats.map(c => ({
    id: c.id,
    patientName: c.nombrePaciente,
    initials: c.iniciales,
    avatar: c.avatar || undefined,
    lastMessage: c.ultimoMensaje,
    time: c.hora,
    isNew: c.esNuevo,
    messages: JSON.parse(c.mensajes)
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
      nombrePaciente: req.body.patientName || 'Paciente',
      iniciales: req.body.initials || 'P',
      avatar: req.body.avatar || null,
      ultimoMensaje: body.lastMessage,
      hora: body.time,
      esNuevo: body.isNew,
      mensajes: JSON.stringify(body.messages),
    },
    update: {
      ultimoMensaje: body.lastMessage,
      hora: body.time,
      esNuevo: body.isNew,
      mensajes: JSON.stringify(body.messages),
    }
  });

  res.json({
    id: updated.id,
    patientName: updated.nombrePaciente,
    initials: updated.iniciales,
    avatar: updated.avatar || undefined,
    lastMessage: updated.ultimoMensaje,
    time: updated.hora,
    isNew: updated.esNuevo,
    messages: JSON.parse(updated.mensajes)
  });
}));

app.get('/api/notifications', requireAuth, asyncHandler(async (_req, res) => {
  const notifications = await prisma.notificacion.findMany({ orderBy: { fechaCreacion: 'desc' }, take: 100 });
  res.json(notifications.map(n => ({
    id: n.id,
    title: n.titulo,
    desc: n.descripcion,
    time: n.tiempo,
    read: n.leido,
    createdAt: n.fechaCreacion.toISOString()
  })));
}));

app.post('/api/notifications/read-all', requireAuth, asyncHandler(async (req, res) => {
  await prisma.notificacion.updateMany({
    data: { leido: true }
  });
  await audit(req, 'read_all', 'notification');
  res.status(204).end();
}));

app.get('/api/audit-logs', requireAuth, requireRole('admin'), asyncHandler(async (_req, res) => {
  const logs = await prisma.registroAuditoria.findMany({ orderBy: { fechaCreacion: 'desc' }, take: 200 });
  res.json(logs.map(al => ({
    id: al.id,
    actorId: al.actorId,
    actorEmail: al.actorEmail,
    action: al.accion,
    entityType: al.tipoEntidad,
    entityId: al.entidadId || undefined,
    ip: al.ip || undefined,
    createdAt: al.fechaCreacion.toISOString()
  })));
}));

app.get('/api/settings', requireAuth, asyncHandler(async (_req, res) => {
  const settings = await prisma.configuracionClinica.findUnique({ where: { id: 'singleton' } });
  res.json(settings ? {
    clinicName: settings.nombreClinica,
    tagline: settings.eslogan,
    notationSystem: settings.sistemaNotacion,
    whatsAppNumber: settings.numeroWhatsApp,
    complianceMode: settings.modoCumplimiento,
    updatedAt: settings.fechaActualizacion.toISOString()
  } : null);
}));

app.put('/api/settings', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const body = z.object({
    clinicName: z.string().min(2).max(80),
    tagline: z.string().min(2).max(120),
    notationSystem: z.enum(['universal', 'fdi']),
    whatsAppNumber: z.string().min(7).max(40),
    complianceMode: z.enum(['demo', 'production']).default('demo'),
  }).parse(req.body);

  const dbData = {
    nombreClinica: body.clinicName,
    eslogan: body.tagline,
    sistemaNotacion: body.notationSystem,
    numeroWhatsApp: body.whatsAppNumber,
    modoCumplimiento: body.complianceMode
  };

  const settings = await prisma.configuracionClinica.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...dbData },
    update: dbData,
  });

  res.json({
    clinicName: settings.nombreClinica,
    tagline: settings.eslogan,
    notationSystem: settings.sistemaNotacion,
    whatsAppNumber: settings.numeroWhatsApp,
    complianceMode: settings.modoCumplimiento,
    updatedAt: settings.fechaActualizacion.toISOString()
  });
}));

// Multer Configuration for Clinical Attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { patientId } = req.params;
    const uploadDir = path.join(process.cwd(), 'uploads', 'patients', patientId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const secureName = `${uuid()}${ext}`;
    cb(null, secureName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('MIME_NOT_ALLOWED'));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const forbiddenExts = ['.exe', '.bat', '.cmd', '.js', '.html', '.htm', '.sh', '.com', '.msi', '.vbs'];
    if (forbiddenExts.includes(ext) || !ext) {
      return cb(new Error('EXT_NOT_ALLOWED'));
    }
    cb(null, true);
  }
});

const uploadSingle = upload.single('file');

// 1. List attachments
app.get('/api/patients/:patientId/attachments', requireAuth, asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const patient = await prisma.paciente.findUnique({ where: { id: patientId } });
  if (!patient) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }

  const attachments = await prisma.adjuntoClinico.findMany({
    where: { pacienteId: patientId },
    orderBy: { fechaCreacion: 'desc' }
  });

  res.json(attachments.map(mapDbAttachment));
}));

// 2. Upload attachment
app.post('/api/patients/:patientId/attachments', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo supera el tamaño permitido.' });
      }
      if (err.message === 'MIME_NOT_ALLOWED' || err.message === 'EXT_NOT_ALLOWED') {
        return res.status(400).json({ error: 'Formato no permitido.' });
      }
      return res.status(400).json({ error: 'No se pudo subir el archivo.' });
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { category, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
  }

  const patient = await prisma.paciente.findUnique({ where: { id: patientId } });
  if (!patient) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return res.status(404).json({ error: 'Paciente no encontrado.' });
  }

  const attachment = await prisma.adjuntoClinico.create({
    data: {
      id: uuid(),
      pacienteId: patientId,
      nombreArchivo: file.filename,
      nombreOriginal: file.originalname,
      tipoMime: file.mimetype,
      tamanoBytes: file.size,
      rutaArchivo: file.path,
      categoria: category || 'General',
      descripcion: description || null,
      subidoPor: req.user?.name || req.user?.email || null,
    }
  });

  await audit(req, 'upload_attachment', 'clinical_attachment', attachment.id);

  res.status(201).json(mapDbAttachment(attachment));
}));

// 3. Delete attachment
app.delete('/api/attachments/:attachmentId', requireAuth, requireRole('admin', 'doctor', 'recepcionista'), asyncHandler(async (req, res) => {
  const { attachmentId } = req.params;
  const attachment = await prisma.adjuntoClinico.findUnique({
    where: { id: attachmentId }
  });

  if (!attachment) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  const absolutePath = path.resolve(attachment.rutaArchivo);
  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (e) {
      console.error('Error al eliminar el archivo físico:', e);
    }
  }

  await prisma.adjuntoClinico.delete({
    where: { id: attachmentId }
  });

  await audit(req, 'delete_attachment', 'clinical_attachment', attachmentId);

  res.status(204).end();
}));

// 4. View/download attachment file
app.get('/api/attachments/:attachmentId/file', requireAuth, asyncHandler(async (req, res) => {
  const { attachmentId } = req.params;
  const attachment = await prisma.adjuntoClinico.findUnique({
    where: { id: attachmentId }
  });

  if (!attachment) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  const absolutePath = path.resolve(attachment.rutaArchivo);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'Archivo físico no encontrado en el servidor' });
  }

  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.nombreOriginal)}"`);
  res.sendFile(absolutePath);
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
