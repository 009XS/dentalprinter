# Corrección Fase 4 — Archivero y Expediente

Este documento detalla la implementación de la **Fase 4** del sistema **Dental Printer**, consistente en la creación del Archivero Clínico y la estructuración del Expediente Individual del Paciente.

---

## 1. Resumen de cambios

Se implementó un nuevo módulo visual que simula un **Archivero Clínico** de expedientes físicos, permitiendo consultar los historiales de los pacientes en formato de folders. 

Al abrir el expediente de un paciente, el sistema despliega una vista detallada organizada en pestañas, logrando una vinculación integral entre sus datos personales, historial de citas, presupuestos emitidos y el acceso a su odontograma. También se dispuso la arquitectura técnica e interfaz necesarias para incorporar la historia clínica final una vez que el cliente la defina.

---

## 2. Archivos modificados

*   **[NEW] [src/components/ArchiveroView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/ArchiveroView.tsx):** Creación del componente principal del archivero, con soporte para grids responsivos de carpetas clínicas, filtros avanzados, ordenamientos e interfaz de expediente clínico con pestañas.
*   **[src/components/Sidebar.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/Sidebar.tsx):** Integración de la pestaña "Archivero" en el menú de navegación lateral izquierdo (Sidebar), usando el icono de carpeta (`Folder`).
*   **[src/App.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/App.tsx):** Registro del caso `'archivero'` en el enrutamiento general de vistas y paso de parámetros de navegación cruzada a los componentes de soporte.
*   **[src/components/PatientsView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/PatientsView.tsx):** Inclusión de una acción rápida ("Expediente") con el icono `FolderOpen` tanto en la tabla de escritorio como en las tarjetas móviles para acceder de inmediato al expediente del paciente en el archivero.
*   **[src/components/AppointmentsView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/AppointmentsView.tsx):** Inclusión de un botón rápido de "Ver Expediente" al lado de cada cita registrada para abrir de manera directa la historia y ficha del paciente involucrado.
*   **[src/components/DashboardView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/DashboardView.tsx):** Adición del botón "Ver Expediente" en el menú contextual de acciones rápidas de cada cita listada en la agenda de hoy.

---

## 3. Vista Archivero

*   **Diseño Visual:** Rejilla responsiva con tarjetas diseñadas con la apariencia de carpetas físicas de archivo clínico, mostrando nombre del paciente, número de expediente (ID), edad, teléfono, nivel de riesgo, alergias importantes y fecha/hora de su última y próxima cita.
*   **Filtros Implementados:**
    *   *Todos:* Muestra la totalidad de pacientes.
    *   *Activo / Inactivo / Archivado:* Filtra según el estado clínico asignado.
    *   *Con Alergias:* Filtra solo aquellos pacientes que tengan alergias documentadas.
    *   *Con Citas Futuras:* Filtra pacientes con reservas agendadas en días futuros.
*   **Criterios de Ordenamiento:**
    *   *Estado (Por defecto):* Ordena situando a los pacientes Activos primero, seguidos por un orden alfabético A-Z.
    *   *Nombre A-Z:* Orden alfabético tradicional.
    *   *Fecha de próxima cita:* Citas futuras más cercanas primero.
    *   *Fecha de última cita:* Citas pasadas más recientes primero.
    *   *Fecha de registro:* De acuerdo al código correlativo temporal del expediente.

---

## 4. Expediente individual

La vista interna del expediente se divide en:
*   **Resumen:** Panel lateral con foto/iniciales, ID, edad, teléfono, nivel de riesgo, alergias reportadas y su estado.
*   **Citas:** Listado cronológico de todas las citas (Hoy, Futuras, Pasadas, Canceladas) vinculadas por ID de paciente, indicando doctor, tratamiento, horario y duración.
*   **Odontograma & Presupuestos:**
    *   Acceso directo mediante botones de acción para abrir la ficha clínica dental ("Abrir Odontograma") o el gestor financiero ("Ver Presupuestos"), autoseleccionando el paciente correspondiente.
    *   Tabla con el listado rápido de presupuestos clínicos del paciente indicando folio, número de tratamientos y estado de aprobación.
*   **Historia Clínica (Pendiente):**
    *   Espacio e interfaz preparada estructuralmente para el cuestionario oficial de salud de César.
    *   Visualización de campos provisionales de Antecedentes Patológicos, No Patológicos, Observaciones y Medicamentos Habituales (mostrando el estado "Pendiente de integrar" y vinculando las Alergias ya cargadas).

---

## 5. Integración con navegación

Se ha configurado la navegación bidireccional entre módulos:
*   Sidebar cuenta con acceso directo e independiente al **Archivero**.
*   Se puede abrir el expediente del paciente con un solo clic desde:
    *   La tabla general de **Pacientes** (`PatientsView.tsx`).
    *   El concentrado general de **Citas** (`AppointmentsView.tsx`).
    *   La agenda del día en el **Dashboard** (`DashboardView.tsx`).
*   Al abrir el expediente desde cualquiera de estos accesos, se auto-selecciona el paciente correcto y se despliega su expediente correspondiente de inmediato. Un botón de "Volver al Archivero" permite al usuario regresar al listado general de folders.

---

## 6. Relación paciente-citas

*   El sistema asocia los datos de forma robusta utilizando el identificador único `patientId` de cada cita.
*   En caso de incompatibilidad con registros antiguos que carezcan de la relación directa, se cuenta con una función de fallback (`getPatientById`) que busca al paciente a partir del ID de la cita o del nombre registrado en las citas locales.

---

## 7. Pruebas realizadas

1.  **TypeScript Check (`npm run lint`):** Completado exitosamente con **0 errores**.
2.  **Vite Production Build (`npm run build`):** Ejecutado satisfactoriamente en 413ms.
3.  **Verificación de Filtros y Ordenamiento:** Se comprobó que el listado de carpetas obedece a las pestañas y al criterio por defecto (Activos primero y luego A-Z).
4.  **Verificación de Navegación Cruzada:** Al hacer clic en "Ver Expediente" desde una cita del Dashboard o de la tabla general de Citas, el sistema redirige instantáneamente a la pestaña Archivero cargando el folder clínico del paciente seleccionado.

---

## 8. Pendientes fuera de esta fase

*   Cuestionario médico definitivo de historia clínica (pendiente de especificación de César).
*   Mecanismo de firma o aceptación del consentimiento informado del consultorio.
*   Módulo para adjuntar documentos o archivos externos al expediente (por ejemplo, radiografías en PDF o imágenes).
*   Exportación del expediente clínico consolidado a formato PDF para impresión.

---

## 9. Notas técnicas

*   La carga de odontograma y presupuestos se enlazó utilizando los estados compartidos `setSelectedPatientId` y `setCurrentTab` heredados de `App.tsx` para evitar la duplicación de código e inconsistencias de estado.
*   La propiedad `patientId` en la interfaz `Appointment` de `src/types.ts` fue declarada opcional (`patientId?`) para no forzar su inclusión en mock-ups o cargas parciales antiguas de citas locales.
