import { prisma } from '../server/db';
import { createSeedData } from '../server/seed';

async function main() {
  const userCount = await prisma.usuario.count();
  if (userCount > 0) return;

  const data = await createSeedData();

  await prisma.$transaction(async (tx) => {
    if (data.users.length) {
      await tx.usuario.createMany({
        data: data.users.map((u) => ({
          id: u.id,
          nombre: u.name,
          email: u.email,
          claveHash: u.passwordHash,
          rol: u.role,
          fechaCreacion: new Date(u.createdAt)
        }))
      });
    }

    if (data.patients.length) {
      await tx.paciente.createMany({
        data: data.patients.map((p) => ({
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
          fechaActualizacion: new Date(p.updatedAt)
        }))
      });
    }

    if (data.appointments.length) {
      await tx.cita.createMany({
        data: data.appointments.map((a) => ({
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
          fechaActualizacion: new Date(a.updatedAt)
        }))
      });
    }

    if (data.chats.length) {
      await tx.chat.createMany({
        data: data.chats.map((chat) => ({
          id: chat.id,
          nombrePaciente: chat.patientName,
          iniciales: chat.initials,
          avatar: chat.avatar,
          ultimoMensaje: chat.lastMessage,
          hora: chat.time,
          esNuevo: chat.isNew,
          mensajes: JSON.stringify(chat.messages),
          fechaActualizacion: new Date(chat.updatedAt)
        }))
      });
    }

    for (const budget of data.budgets) {
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
              total: item.total
            }))
          }
        }
      });
    }

    for (const odontogram of data.odontograms) {
      await tx.odontograma.create({
        data: {
          pacienteId: odontogram.patientId,
          dientes: JSON.stringify(odontogram.teeth),
          intervenciones: JSON.stringify(odontogram.interventions),
          fechaActualizacion: new Date(odontogram.updatedAt)
        }
      });
    }

    if (data.notifications.length) {
      await tx.notificacion.createMany({
        data: data.notifications.map((n) => ({
          id: n.id,
          titulo: n.title,
          descripcion: n.desc,
          tiempo: n.time,
          leido: n.read,
          fechaCreacion: new Date(n.createdAt)
        }))
      });
    }

    await tx.configuracionClinica.create({
      data: {
        id: 'singleton',
        nombreClinica: data.settings.clinicName,
        eslogan: data.settings.tagline,
        sistemaNotacion: data.settings.notationSystem,
        numeroWhatsApp: data.settings.whatsAppNumber,
        modoCumplimiento: data.settings.complianceMode,
        fechaActualizacion: new Date(data.settings.updatedAt)
      }
    });
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
