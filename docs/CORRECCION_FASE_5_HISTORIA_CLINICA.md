# Corrección Fase 5 — Historia Clínica Flexible

Este documento detalla la implementación de la **Fase 5** del sistema **Dental Printer**, consistente en la creación del módulo base y flexible para la Historia Clínica del paciente.

---

## 1. Resumen de cambios

Se implementó el soporte completo de **Historia Clínica** (cuestionario de salud general) para cada paciente en el consultorio. El diseño de la base de datos, del backend y del frontend es flexible para permitir una futura adaptación de la estructura clínica oficial que César apruebe.

La interfaz del archivero clínico ahora cuenta con una pestaña interactiva de Historia Clínica que carga los datos dinámicamente y permite guardarlos en tiempo real, registrando las acciones en el log de auditoría del sistema.

---

## 2. Archivos modificados o creados

*   **[MODIFY] [prisma/schema.prisma](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/prisma/schema.prisma):** Añadido el modelo `MedicalHistory` y la relación 1:1 con el modelo `Patient`.
*   **[MODIFY] [server/types.ts](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/server/types.ts):** Añadido tipo `MedicalHistory` y relación opcional en `Patient` en el backend.
*   **[MODIFY] [src/types.ts](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/types.ts):** Sincronizado el tipo `MedicalHistory` y la relación en el frontend.
*   **[MODIFY] [server/index.ts](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/server/index.ts):** Añadidos el validador Zod `medicalHistorySchema` y los endpoints de API `GET` y `PUT`.
*   **[MODIFY] [src/api.ts](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/api.ts):** Añadidas funciones cliente `getMedicalHistory` y `updateMedicalHistory`.
*   **[MODIFY] [src/components/ArchiveroView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/ArchiveroView.tsx):** Cambiada la pestaña "Historia Clínica (Pendiente)" por una interfaz de cuestionario interactivo funcional con persistencia en base de datos, cargador dinámico y botón de guardado.

---

## 3. Cambios en base de datos

Se agregó la tabla `MedicalHistory` en SQLite usando Prisma Client.

### Modelo Prisma
```prisma
model MedicalHistory {
  patientId        String   @id
  patient          Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  allergies        String?
  medications      String?
  diseases         String?
  surgeries        String?
  observations     String?

  flexibleSections String   @default("{}")

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### Relación en Patient
```prisma
medicalHistory MedicalHistory?
```

### Comandos ejecutados
1.  **Respaldo preventivo:** Copiado `prisma/dev.db` a `backup/dev-before-phase-5-medical-history.db`.
2.  **Sincronización:** Ejecutado `npx.cmd prisma db push` para aplicar el esquema a la base de datos sin perder datos previos.
3.  **Generación de Cliente:** Ejecutado `npx.cmd prisma generate` para regenerar el cliente de Prisma.

---

## 4. Endpoints de API creados

Se crearon dos rutas dentro del backend Express (`server/index.ts`), ambas protegidas por token de sesión:

### GET `/api/patients/:patientId/medical-history`
*   **Permisos:** Cualquier usuario autenticado.
*   **Comportamiento:**
    *   Si el paciente no existe, devuelve error `404 Paciente no encontrado`.
    *   Si el paciente existe pero no tiene registro previo de historia clínica, devuelve una estructura inicial vacía y segura en formato JSON (evitando excepciones en el cliente).
    *   Si existe la historia clínica, la devuelve.

### PUT `/api/patients/:patientId/medical-history`
*   **Permisos:** Usuarios autenticados con rol `admin`, `doctor` o `recepcionista`.
*   **Comportamiento:**
    *   Valida los datos clínicos de entrada usando Zod.
    *   Si el paciente no existe, devuelve error `404 Paciente no encontrado`.
    *   Realiza un `upsert` (crea si no existe, actualiza si ya existe) vinculando la clave única `patientId`.
    *   Crea una entrada en el log de auditoría (`AuditLog`) registrando la acción `update` en la entidad `medical_history`.
    *   Devuelve la historia clínica actualizada.

---

## 5. Integración con el Archivero

*   Se eliminó la vista estática temporal de historia clínica.
*   El componente `ArchiveroView.tsx` ahora consulta de forma asíncrona la base de datos a través de la API al entrar a la sección de un expediente.
*   Muestra un indicador visual de carga clínica al traer la información.
*   Incluye notificaciones de éxito y de error al interactuar con el botón "Guardar Historia Clínica".
*   Permite ver la fecha y hora de la última actualización del expediente en tiempo real.

---

## 6. Campos incluidos en el Cuestionario Clínico

El formulario se diseñó con campos base que guardan compatibilidad de datos y son sencillos para que César los evalúe:

1.  **Alergias Clínicas:** Campo para capturar alergias del expediente médico. Muestra un banner informativo si el paciente ya posee alergias registradas en su ficha general (`Patient.allergies`).
2.  **Medicamentos Habituales:** Medicamentos tomados por el paciente a diario.
3.  **Enfermedades o Padecimientos Relevantes:** Historial patológico del paciente.
4.  **Cirugías o Procedimientos Previos:** Historial quirúrgico.
5.  **Observaciones Clínicas Generales:** Anotaciones generales del dentista.
6.  **Notas Adicionales / Campos Flexibles:** Mapeado al campo `flexibleSections`. Permite guardar un texto genérico o una cadena JSON estructurada, lo que otorga la flexibilidad técnica necesaria para adaptar cualquier plantilla oficial en el futuro.

---

## 7. Pruebas realizadas

*   **Pruebas de Base de Datos:** Se validó la creación de la tabla y la relación 1:1. Se comprobó mediante script automatizado que el `upsert` escribe y actualiza correctamente sin alterar pacientes ni citas preexistentes.
*   **Pruebas de Compilación (TypeScript / Vite):**
    *   `npm run lint` (`tsc --noEmit`): Compilado limpio sin errores.
    *   `npm run build`: Generación de bundle de producción en 470ms sin fallos de assets.
*   **Prueba de Flujo UI:**
    *   Se abrió el archivero y se seleccionó un paciente.
    *   Se consultó su pestaña "Historia Clínica" y se cargaron los campos vacíos con su estado "Sin registros previos".
    *   Se llenaron los inputs y se guardó la información con éxito.
    *   Se verificó que al cambiar de paciente, los datos de cada uno cambian correctamente.
    *   Al recargar la página y abrir el expediente, se comprobó la persistencia de la información y la visualización de la fecha de última actualización.

---

## 8. Pendientes fuera de esta fase

*   Adaptar los campos de la historia clínica al cuestionario de salud definitivo de César.
*   Gestión de consentimiento informado legal con firma digital del paciente.
*   Exportación/Impresión del expediente clínico en formato PDF.
*   Espacio para adjuntar documentos o radiografías en formatos PDF o imágenes.

---

## 9. Notas técnicas

*   El campo `flexibleSections` procesa texto plano convirtiéndolo a un objeto JSON seguro `{"notes": "..."}` si no se suministra un formato JSON estructurado válido, previniendo errores de parseo en el cliente.
*   Se mantuvo compatibilidad absoluta con la ficha del paciente para que sus datos principales permanezcan legibles en la vista lateral de resumen.
