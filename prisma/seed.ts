import { prisma } from '../server/db';
import { createSeedData } from '../server/seed';

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  const data = await createSeedData();

  await prisma.$transaction(async (tx) => {
    await tx.user.createMany({ data: data.users });
    await tx.patient.createMany({ data: data.patients });
    await tx.appointment.createMany({ data: data.appointments });
    await tx.chat.createMany({
      data: data.chats.map((chat) => ({
        ...chat,
        messages: JSON.stringify(chat.messages),
      })),
    });
    for (const budget of data.budgets) {
      await tx.budget.create({
        data: {
          id: budget.id,
          patientId: budget.patientId,
          status: budget.status,
          discountPercent: budget.discountPercent,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
          items: {
            create: budget.items.map((item) => ({
              id: item.id,
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
    for (const odontogram of data.odontograms) {
      await tx.odontogram.create({
        data: {
          patientId: odontogram.patientId,
          teeth: JSON.stringify(odontogram.teeth),
          interventions: JSON.stringify(odontogram.interventions),
          updatedAt: odontogram.updatedAt,
        },
      });
    }
    await tx.notification.createMany({ data: data.notifications });
    await tx.clinicSettings.create({ data: { id: 'singleton', ...data.settings } });
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
