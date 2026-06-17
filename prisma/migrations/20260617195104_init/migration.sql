/*
  Warnings:

  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Budget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BudgetItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClinicSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Odontogram` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Patient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `initials` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `isNew` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessage` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `messages` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Chat` table. All the data in the column will be lost.
  - Added the required column `fechaActualizacion` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iniciales` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mensajes` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombrePaciente` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ultimoMensaje` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Appointment_status_idx";

-- DropIndex
DROP INDEX "Appointment_doctor_startHour_idx";

-- DropIndex
DROP INDEX "Appointment_patientId_idx";

-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_entityType_idx";

-- DropIndex
DROP INDEX "AuditLog_actorId_idx";

-- DropIndex
DROP INDEX "Budget_status_idx";

-- DropIndex
DROP INDEX "Budget_patientId_idx";

-- DropIndex
DROP INDEX "BudgetItem_budgetId_idx";

-- DropIndex
DROP INDEX "Notification_createdAt_idx";

-- DropIndex
DROP INDEX "Notification_read_idx";

-- DropIndex
DROP INDEX "Patient_name_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Appointment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuditLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Budget";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BudgetItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ClinicSettings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Notification";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Odontogram";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Patient";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "claveHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "avatar" TEXT,
    "iniciales" TEXT NOT NULL,
    "fechaNacimiento" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "telefono" TEXT NOT NULL,
    "alergias" TEXT,
    "nivelRiesgo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" TEXT NOT NULL DEFAULT '2026-06-16',
    "hora" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tratamiento" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "doctor" TEXT NOT NULL,
    "horaInicio" REAL NOT NULL,
    "duracionHoras" REAL NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "porcentajeDescuento" REAL NOT NULL DEFAULT 0,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "Presupuesto_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemPresupuesto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "presupuestoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "diente" TEXT NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "total" REAL NOT NULL,
    CONSTRAINT "ItemPresupuesto_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Odontograma" (
    "pacienteId" TEXT NOT NULL PRIMARY KEY,
    "dientes" TEXT NOT NULL,
    "intervenciones" TEXT NOT NULL,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "Odontograma_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tiempo" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "tipoEntidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "ip" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConfiguracionClinica" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "nombreClinica" TEXT NOT NULL,
    "eslogan" TEXT NOT NULL,
    "sistemaNotacion" TEXT NOT NULL,
    "numeroWhatsApp" TEXT NOT NULL,
    "modoCumplimiento" TEXT NOT NULL,
    "fechaActualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HistorialMedico" (
    "pacienteId" TEXT NOT NULL PRIMARY KEY,
    "alergias" TEXT,
    "medicamentos" TEXT,
    "enfermedades" TEXT,
    "cirugias" TEXT,
    "observaciones" TEXT,
    "seccionesOficiales" TEXT NOT NULL DEFAULT '{}',
    "seccionesFlexibles" TEXT NOT NULL DEFAULT '{}',
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "HistorialMedico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdjuntoClinico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'General',
    "descripcion" TEXT,
    "subidoPor" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdjuntoClinico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombrePaciente" TEXT NOT NULL,
    "iniciales" TEXT NOT NULL,
    "avatar" TEXT,
    "ultimoMensaje" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "esNuevo" BOOLEAN NOT NULL DEFAULT false,
    "mensajes" TEXT NOT NULL,
    "fechaActualizacion" DATETIME NOT NULL
);
INSERT INTO "new_Chat" ("avatar", "id") SELECT "avatar", "id" FROM "Chat";
DROP TABLE "Chat";
ALTER TABLE "new_Chat" RENAME TO "Chat";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Paciente_nombre_idx" ON "Paciente"("nombre");

-- CreateIndex
CREATE INDEX "Cita_pacienteId_idx" ON "Cita"("pacienteId");

-- CreateIndex
CREATE INDEX "Cita_doctor_horaInicio_idx" ON "Cita"("doctor", "horaInicio");

-- CreateIndex
CREATE INDEX "Cita_estado_idx" ON "Cita"("estado");

-- CreateIndex
CREATE INDEX "Presupuesto_pacienteId_idx" ON "Presupuesto"("pacienteId");

-- CreateIndex
CREATE INDEX "Presupuesto_estado_idx" ON "Presupuesto"("estado");

-- CreateIndex
CREATE INDEX "ItemPresupuesto_presupuestoId_idx" ON "ItemPresupuesto"("presupuestoId");

-- CreateIndex
CREATE INDEX "Notificacion_leido_idx" ON "Notificacion"("leido");

-- CreateIndex
CREATE INDEX "Notificacion_fechaCreacion_idx" ON "Notificacion"("fechaCreacion");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_actorId_idx" ON "RegistroAuditoria"("actorId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_tipoEntidad_idx" ON "RegistroAuditoria"("tipoEntidad");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_fechaCreacion_idx" ON "RegistroAuditoria"("fechaCreacion");
