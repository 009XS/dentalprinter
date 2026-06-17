# Auditoría Técnica — Dental Printer

Este documento presenta una auditoría técnica completa del estado actual del sistema **Dental Printer**, identificando bugs críticos, componentes faltantes y una propuesta de ruta de desarrollo para llevar el proyecto a un nivel de producción óptimo.

---

## 1. Resumen Ejecutivo

*   **¿Qué funciona?:**
    *   Registro y actualización de pacientes en la base de datos local (SQLite).
    *   Interactividad en el Odontograma (selección de dientes, aplicación de estados de caries, fracturas, coronas, implantes) y sincronización con el servidor.
    *   Creación de presupuestos clínicos asociados a pacientes, visualización del subtotal/descuentos y previsualización de mensajes para WhatsApp.
    *   Sistema de registro de auditoría (`AuditLog`) y de notificaciones locales.
    *   Autenticación básica basada en JWT y protección de rutas en la API.
*   **¿Qué está incompleto?:**
    *   **Vistas de Calendario:** Solo está programada la vista diaria. Las vistas semanales y mensuales están bloqueadas por un placeholder visual.
    *   **Directorio de Pacientes:** No cuenta con un estado activo/inactivo formal, ni con filtros por dicho estado.
    *   **Historia Clínica:** No existe ningún módulo ni base de datos para registrar antecedentes patológicos o alergias estructuradas más allá de un campo de texto plano de alergias en el paciente.
    *   **Expediente / Archivero:** No existe una vista unificada que centralice la información personal, historial de citas, presupuestos y odontograma de un paciente con una apariencia de "archivero".
*   **¿Qué está roto?:**
    *   **Error crítico al agendar citas (P0):** La verificación de traslapes en el backend no filtra por fecha (ya que el modelo no almacena la fecha de la cita). Por ende, si se reserva un horario un día, ese bloque queda deshabilitado para el médico en todo el historial del sistema. Además, el calendario está limitado permanentemente al día "Hoy" por falta de selector de fecha.
*   **¿Qué es prioridad?:**
    *   **P0:** Resolver el bug de traslape y falta de fechas en las citas (Base de datos + API + Modal del Frontend).
    *   **P0:** Diseñar e implementar las vistas semanal y mensual en el Calendario.
    *   **P1:** Construir la interfaz de Archivero para expedientes de pacientes.

---

## 2. Estructura Detectada del Proyecto

El sistema está configurado como un proyecto monorepo ligero con frontend en React y backend en Express:

```text
dentalprinter-clinic/
├── docs/                                # Documentación de la auditoría y guías
│   └── AUDITORIA_DENTAL_PRINTER.md      # Este reporte de auditoría
├── prisma/                              # Configuración de base de datos
│   ├── dev.db                           # Base de datos SQLite local
│   ├── schema.prisma                    # Esquema de base de datos (Prisma ORM)
│   └── seed.ts                          # Script de datos de prueba
├── server/                              # Servidor API (Express + TypeScript)
│   ├── index.ts                         # Rutas, controladores y lógica de negocio
│   ├── db.ts                            # Cliente Prisma inicializado
│   ├── store.ts                         # Gestor de lectura de datos clínicos y autoseed
│   └── types.ts                         # Declaración de tipos compartidos del backend
├── src/                                 # Frontend en React
│   ├── components/                      # Componentes/Vistas modulares
│   │   ├── DashboardView.tsx            # KPIs, agenda diaria y chat de IA
│   │   ├── PatientsView.tsx             # Tabla general de pacientes
│   │   ├── CalendarView.tsx             # Timeline diario por doctor del calendario
│   │   ├── OdontogramaView.tsx          # Visor clínico interactivo de dientes
│   │   ├── PresupuestosView.tsx         # Planificador financiero y WhatsApp
│   │   ├── RadiologyView.tsx            # Visor de imágenes clínicas (placeholder)
│   │   ├── SettingsView.tsx             # Ajustes de la clínica y compliance
│   │   ├── Sidebar.tsx                  # Barra de navegación lateral
│   │   └── Header.tsx                   # Panel superior con buscador y notificaciones
│   ├── App.tsx                          # Componente raíz del cliente (modales, login, routing)
│   ├── api.ts                           # Clientes y llamadas HTTP al backend
│   ├── types.ts                         # Tipos TypeScript del frontend
│   ├── mockData.ts                      # Datos iniciales mockeados
│   └── index.css                        # Estilos globales con Tailwind CSS
├── package.json                         # Dependencias y scripts de npm
└── tsconfig.json                        # Configuración de TypeScript
```

---

## 3. Stack Detectado

*   **Backend:** Node.js, Express (servidor API), TypeScript (ejecutado en caliente con `tsx`), Zod (validación de payloads de entrada), bcryptjs (encriptación de contraseñas), jsonwebtoken (autenticación JWT).
*   **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide React (librería de iconos vectoriales).
*   **Base de Datos / ORM:** Prisma ORM interactuando con una base de datos local SQLite (`dev.db`).
*   **Calendario:** Componente personalizado built-in en [CalendarView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/CalendarView.tsx). No se utiliza ninguna librería externa como FullCalendar o DayPilot.

---

## 4. Estado Actual por Módulo

### A. Panel de Control (Dashboard)
*   **Estado:** Funcional pero estático/limitado.
*   **Archivos:** [DashboardView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/DashboardView.tsx)
*   **Qué funciona:** Tarjetas KPI con el conteo de pacientes totales y citas programadas de hoy. Tabla de agenda interactiva que permite cambiar estados y cancelar citas. Chat simulado con pacientes.
*   **Qué falla:** El cálculo financiero de ingresos mensuales es una simulación estática (`45000 + citas * 150`).
*   **Qué falta:** Tarjeta de alertas críticas de pacientes (ej. Pacientes de Alto Riesgo o con Alergias severas que tienen cita hoy) y botones de acceso rápido para registrar paciente o agendar.

### B. Pacientes
*   **Estado:** Parcialmente usable.
*   **Archivos:** [PatientsView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/PatientsView.tsx), [App.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/App.tsx)
*   **Qué funciona:** Listado general en tabla con scroll, avatar/iniciales, ID del expediente, edad, contacto, nivel de riesgo y alergias. Búsqueda por texto. Atajos rápidos para abrir odontograma, agendar cita o ver presupuestos.
*   **Qué falla:** Carece de control de estado del paciente (Activo / Inactivo / Archivado). Todo paciente en la base de datos se muestra en la lista única.
*   **Qué falta:** Filtros rápidos por estado, barra de estadísticas rápidas, y una vista detallada del paciente que reúna toda su información histórica (actualmente redirecciona directamente al Odontograma).

### C. Citas
*   **Estado:** **Roto operativamente (Bug Crítico P0).**
*   **Archivos:** [App.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/App.tsx) (Modales y llamadas), [index.ts (server)](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/server/index.ts)
*   **Qué funciona:** Registro de citas mediante llamadas HTTP `/api/appointments` y visualización básica en el día.
*   **Qué falla:** No se puede agendar citas en el mismo rango horario de un doctor en diferentes días, porque el sistema no almacena ni filtra por fecha de cita.
*   **Qué falta:** Tabla/Historial centralizado de citas (futuras, pasadas y canceladas) para auditoría clínica.

### D. Calendario
*   **Estado:** Parcialmente funcional (solo vista diaria).
*   **Archivos:** [CalendarView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/CalendarView.tsx)
*   **Qué funciona:** Timeline por doctor para el día "Hoy". Visualización y acomodo de citas según su hora decimal (`startHour`). Indicador en tiempo real del progreso del día y slots recomendados por IA.
*   **Qué falla:** Los botones de vista "Semana" y "Mes" muestran un placeholder estático e inoperable.
*   **Qué falta:** Componentes interactivos semanales y mensuales que permitan navegar entre semanas/meses del año y ver los bloques de citas correspondientes.

### E. Expediente / Archivero
*   **Estado:** **No implementado.**
*   **Archivos:** Ninguno.
*   **Qué funciona:** N/A.
*   **Qué falta:** Toda la estructura del módulo. Debe diseñarse una interfaz que simule folders físicos para organizar a los pacientes clínicamente.

### F. Historia Clínica
*   **Estado:** **No implementado.**
*   **Archivos:** Ninguno.
*   **Qué funciona:** N/A (solo hay un campo de texto libre `allergies` en la ficha de paciente).
*   **Qué falta:** Tablas en la base de datos para la historia médica general, campos estructurados (enfermedades sistémicas, medicamentos, cirugías, consentimiento) y la interfaz de llenado en el expediente.

---

## 5. Bugs Críticos Detectados

### Bug 1: Bloqueo permanente de agenda por conflicto de horas sin fecha (P0)

*   **Descripción:** No se pueden agendar múltiples citas en el mismo horario para diferentes días.
*   **Archivos involucrados:**
    *   [schema.prisma](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/prisma/schema.prisma) (Definición del modelo `Appointment`)
    *   [index.ts (server)](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/server/index.ts) (Lógica de creación de citas y validación)
    *   [App.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/App.tsx) (Formulario de creación de cita en el frontend)
*   **Causa probable:**
    *   El modelo `Appointment` en la base de datos no contiene una columna `date` (solo tiene `time` para guardar la hora legible de la cita, ej: "02:15 PM").
    *   En `server/index.ts`, la validación de solapamiento consulta las citas de un doctor sin especificar fecha:
        ```typescript
        const doctorAppointments = await prisma.appointment.findMany({
          where: { doctor: body.doctor, status: { not: 'Cancelada' } }
        });
        ```
    *   Luego, valida el solapamiento decimal basándose únicamente en `startHour` y `durationHours`. Por lo tanto, si el "Dr. Pérez" tiene una cita a las 10:00 AM el lunes, el backend rechazará con error `409 Conflict` cualquier cita a las 10:00 AM del martes, miércoles o de cualquier otro día del año.
*   **Evidencia en código:**
    ```typescript
    // server/index.ts - Línea 228
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
    ```
*   **Solución recomendada:**
    1.  **Migración de DB:** Agregar un campo `date` (tipo `String` en formato `YYYY-MM-DD` o tipo `DateTime`) al modelo `Appointment` en `schema.prisma`.
    2.  **Modificar Backend:** Actualizar el esquema de validación de Zod en `server/index.ts` para requerir el campo `date` y añadir `date: body.date` en el filtro `where` del `findMany` de validación.
    3.  **Modificar Frontend:** Agregar un campo selector de fecha (Date Picker) en el modal "Programar Nueva Reserva" de `src/App.tsx`. Pasar este campo en la petición HTTP.
    4.  **Actualizar Calendario:** Permitir navegar entre fechas en `CalendarView.tsx` y filtrar localmente las citas del día seleccionado.
*   **Riesgo si no se corrige:** Bloqueo total de la agenda clínica tras llenar 7 citas para un doctor.
*   **Prioridad:** P0 (Urgente).

### Bug 2: Cambio de vistas mensual/semanal inhabilitado (P0)

*   **Descripción:** Al cambiar el modo de visualización del calendario a "Semana" o "Mes", el sistema muestra un mensaje de placeholder y no permite navegar ni ver las citas en formato de rejilla mensual o semanal.
*   **Archivos involucrados:**
    *   [CalendarView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/CalendarView.tsx)
*   **Causa probable:**
    *   La lógica del componente tiene una bifurcación que renderiza un panel estático si `viewMode !== 'day'`. No se han desarrollado los componentes de rejilla del calendario para semanas o meses.
*   **Evidencia en código:**
    ```typescript
    // src/components/CalendarView.tsx - Línea 174
    {viewMode !== 'day' ? (
      <div className="bg-white dark:bg-slate-900 rounded-xl ...">
        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500 ...">
          {viewMode === 'week' ? 'Programador Clínico Semanal' : 'Planificación Clínica Mensual'}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Las vistas de varios días están actualmente optimizadas para roles de planificación clínica...
        </p>
        ...
      </div>
    ) : (
      /* Tablero de Consultorios (Día) */
    ...
    ```
*   **Solución recomendada:**
    1.  Crear una rejilla semanal (de lunes a domingo) que posicione horizontalmente las citas de cada doctor o las agrupe por día del calendario.
    2.  Crear una cuadrícula mensual clásica de 35 días donde se muestre el número de citas del día y al hacer clic en un día, cambie automáticamente a la vista de "Día" para esa fecha.
*   **Riesgo si no se corrige:** Incapacidad de planeación a mediano plazo; descontento del personal administrativo.
*   **Prioridad:** P0 (Urgente).

---

## 6. Revisión de Base de Datos

### Tablas Existentes (SQLite)
1.  `User`: Credenciales y roles (`admin`, `doctor`, `recepcionista`).
2.  `Patient`: Ficha básica de filiación.
3.  `Appointment`: Reserva de consultas médicas.
4.  `Chat`: Mensajería simulada con pacientes.
5.  `Budget` & `BudgetItem`: Planes de tratamiento clínicos y costos.
6.  `Odontogram`: Estado gráfico de los dientes e intervenciones.
7.  `Notification`: Historial de alertas clínicas.
8.  `AuditLog`: Registro de seguridad de transacciones de usuarios.
9.  `ClinicSettings`: Nombre de la clínica, sistema de notación dental (`universal` o `fdi`), etc.

### Problemas e Inconsistencias Potenciales
*   **Falta de la columna `status` en `Patient`:** No hay forma de clasificar a un paciente como inactivo o archivado a nivel de base de datos.
*   **Falta de la columna `date` en `Appointment`:** Provoca colisiones infinitas en los horarios de citas.
*   **Límites de SQLite:** SQLite es excelente para el desarrollo y despliegue local de Dental Printer en consultorios individuales, pero si el sistema escala a múltiples clínicas simultáneas, requerirá migrar a MySQL o PostgreSQL.

### Soporte para Historia Clínica (Propuesta Técnica)
Para evitar romper las relaciones de la base de datos actual, se propone crear un modelo independiente llamado `MedicalHistory` con una relación uno-a-uno (`1:1`) con `Patient`.

```prisma
model MedicalHistory {
  patientId         String   @id
  patient           Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  systemicDiseases  String?  // Ej: Diabetes, Hipertensión
  medications       String?  // Medicamentos en uso
  surgeries         String?  // Operaciones recientes
  familyHistory     String?  // Antecedentes hereditarios
  coagulationIssues Boolean  @default(false)
  pregnancyStatus   Boolean  @default(false)
  extraFields       String   @default("{}") // Almacén JSON flexible para los requerimientos de César
  updatedAt         DateTime @updatedAt
}
```

---

## 7. Propuesta de Organización del Archivero

El módulo de "Archivero" se diseñará como una vista interactiva de carpetas colgantes físicas en un gabinete virtual.

### Visualización del Archivero
*   **Interfaz:** Una rejilla de tarjetas de tipo "Folder" (carpetas de manila con pestañas superiores de colores según el nivel de riesgo del paciente).
*   **Organización Recomendada:** **Alfabética (A-Z)** por apellido como orden base para facilitar una búsqueda rápida y limpia sin complicar las consultas SQL iniciales. Se añadirá un selector para ordenar por **Fecha de última cita** (para ver pacientes recientes) y por **Nivel de Riesgo**.

### Contenido del Expediente Individual
Al hacer clic en un "Folder", se abrirá una vista de pantalla dividida o modal expansible que simula un expediente abierto:
1.  **Pestaña 1: Datos de Filiación:** Datos generales, contacto, alergias y nivel de riesgo.
2.  **Pestaña 2: Historia Clínica:** Ficha médica interactiva basada en el modelo `MedicalHistory`.
3.  **Pestaña 3: Historial de Citas:** Cronología vertical de citas pasadas, presentes y futuras, con detalles del tratamiento y el médico que le atendió.
4.  **Pestaña 4: Odontograma:** Acceso directo al visor interactivo del estado de las piezas dentales.

---

## 8. Plan de Corrección por Prioridad

```mermaid
grid
    Fase1["Fase 1: Bugs Urgentes (Citas y Calendario)"]
    Fase2["Fase 2: Listados y Control de Pacientes"]
    Fase3["Fase 3: Panel de Control (Dashboard)"]
    Fase4["Fase 4: Módulo Archivero (Folders)"]
    Fase5["Fase 5: Historia Clínica Estructurada"]
    
    Fase1 --> Fase2 --> Fase3 --> Fase4 --> Fase5
```

### Fase 1 — Bugs urgentes (P0)
*   Modificar esquema Prisma para incluir la columna `date` en `Appointment`.
*   Corregir la ruta POST de citas en la API para filtrar las colisiones de horarios por fecha.
*   Implementar selector de fecha en el modal de citas en el frontend.
*   Desarrollar las rejillas semanales y mensuales de visualización en el componente del calendario.

### Fase 2 — Listados generales (P1)
*   Añadir el campo `status` (`Activo`, `Inactivo`, `Archivado`) al modelo `Patient`.
*   Crear interruptores de estado en la vista del paciente y filtros en la tabla de directorio.
*   Construir una vista centralizada de historial de citas general.

### Fase 3 — Panel de Control (P1)
*   Actualizar los KPIs para que utilicen estadísticas dinámicas de la base de datos de manera exacta.
*   Crear panel de accesos rápidos laterales y widget de alertas médicas diarias.

### Fase 4 — Archivero / Expediente (P2)
*   Crear el componente `ArchiveroView.tsx`.
*   Diseñar las tarjetas folders con orden alfabético y filtros de búsqueda.
*   Crear el contenedor tabulado del expediente del paciente para unificar datos, citas y odontograma.

### Fase 5 — Historia Clínica (P2)
*   Crear la tabla `MedicalHistory` en la base de datos.
*   Implementar el formulario clínico estructurado y el campo flexible JSON para las adiciones futuras de César.

---

## 9. Criterios de Aceptación

1.  **Agendado sin conflictos:** Se puede guardar una cita a las 10:00 AM para el paciente A el lunes y a las 10:00 AM para el paciente B el martes con el mismo doctor, sin que el servidor retorne un error de traslape.
2.  **Navegación del calendario:** Al hacer clic en "Semana" y "Mes", se despliega la rejilla interactiva correspondiente y permite cambiar de semana/mes visualizando las citas correctas.
3.  **Filtros de pacientes:** El sistema permite filtrar la vista del directorio de pacientes por su estado clínico (Activo, Inactivo, Archivado).
4.  **Apertura del folder:** Al hacer clic en cualquier paciente del archivero, se abre la vista del folder mostrando sus datos generales, historial completo de citas y acceso al odontograma.
5.  **Historia Clínica persistente:** Se puede guardar y actualizar la historia clínica del paciente, y los datos persisten al recargar el navegador.

---

## 10. Recomendaciones Técnicas

> [!IMPORTANT]
> **Antes de realizar cambios:**
> *   Ejecutar un respaldo manual de la base de datos local copiando el archivo `prisma/dev.db` a una carpeta de respaldo segura externa.
> *   Ejecutar `npm run build` y `npm run lint` antes de realizar las migraciones de base de datos para asegurar el estado inicial limpio.

> [!WARNING]
> *   **Ruta de Citas:** Modificar el backend y la base de datos en simultáneo. Si se migra la base de datos sin agregar el datepicker en el frontend, el backend fallará al recibir valores nulos para `date` en las peticiones.
> *   **Integridad de Datos:** Al agregar campos nuevos a Prisma (`date` en `Appointment` y `status` en `Patient`), definir valores por defecto (ej. `status = "Activo"`, `date = "2026-06-16"`) o campos opcionales para evitar la pérdida de los datos demo existentes.

---

## 11. Lista Final de Tareas

- [ ] **Tarea 1:** Agregar campo `date` en `prisma/schema.prisma` a la tabla `Appointment`.
    *   *Prioridad:* P0 (Urgente)
    *   *Módulo:* Base de Datos / Citas
    *   *Archivo:* `prisma/schema.prisma`
    *   *Dificultad:* Baja
- [ ] **Tarea 2:** Actualizar validación de solapamiento de horarios en la API añadiendo el filtro de fecha.
    *   *Prioridad:* P0 (Urgente)
    *   *Módulo:* Citas (Backend)
    *   *Archivo:* `server/index.ts`
    *   *Dificultad:* Baja
- [ ] **Tarea 3:** Agregar Date Picker al modal "Programar Nueva Reserva" y enlazarlo con la petición HTTP de envío.
    *   *Prioridad:* P0 (Urgente)
    *   *Módulo:* Citas (Frontend)
    *   *Archivo:* `src/App.tsx`
    *   *Dificultad:* Media
- [ ] **Tarea 4:** Implementar visualizador de calendario semanal interactivo en el cliente.
    *   *Prioridad:* P0 (Urgente)
    *   *Módulo:* Calendario
    *   *Archivo:* `src/components/CalendarView.tsx`
    *   *Dificultad:* Alta
- [ ] **Tarea 5:** Implementar visualizador de calendario mensual interactivo en el cliente.
    *   *Prioridad:* P0 (Urgente)
    *   *Módulo:* Calendario
    *   *Archivo:* `src/components/CalendarView.tsx`
    *   *Dificultad:* Alta
- [ ] **Tarea 6:** Añadir campo `status` a `prisma/schema.prisma` en `Patient` y configurar los filtros por estado en el frontend.
    *   *Prioridad:* P1 (Alta)
    *   *Módulo:* Pacientes
    *   *Archivo:* `prisma/schema.prisma`, `src/components/PatientsView.tsx`
    *   *Dificultad:* Media
- [ ] **Tarea 7:** Diseñar y codificar el componente modular `ArchiveroView.tsx` para visualización tipo folders.
    *   *Prioridad:* P1 (Alta)
    *   *Módulo:* Expediente / Archivero
    *   *Archivo:* `src/components/ArchiveroView.tsx` (Nuevo)
    *   *Dificultad:* Alta
- [ ] **Tarea 8:** Diseñar e integrar la tabla `MedicalHistory` para dar soporte estructurado a las historias clínicas.
    *   *Prioridad:* P2 (Media)
    *   *Módulo:* Historia Clínica
    *   *Archivo:* `prisma/schema.prisma`, `server/index.ts`
    *   *Dificultad:* Media
