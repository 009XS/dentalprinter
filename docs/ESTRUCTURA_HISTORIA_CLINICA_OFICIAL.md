# Estructura de Historia Clínica Oficial

Este documento detalla el esquema de serialización JSON empleado para representar de forma digital la **Historia Clínica Oficial** basada en el documento `HISTORIA CLINICA.docx` del consultorio, almacenada bajo la columna `officialSections` del modelo `MedicalHistory`.

---

## 1. Mapeo de Secciones en `officialSections`

Los datos se estructuran en un único objeto JSON dentro de la base de datos, donde cada clave de primer nivel representa una de las secciones clínicas del expediente:

```json
{
  "patientData": { ... },
  "systemicHealth": { ... },
  "familyHistory": { ... },
  "personalHistory": { ... },
  "systemsReview": { ... },
  "physicalExam": { ... },
  "intrabucalExam": { ... },
  "consentimiento": { ... },
  "diagnosticoPlan": { ... },
  "evolucionNotes": { ... }
}
```

---

## 2. Detalle de Campos por Sección

### 1. Datos del Paciente & Signos Vitales (`patientData`)
Campos generales del paciente y mediciones físicas tomadas en consulta.

*   `fecha` (string, YYYY-MM-DD): Fecha de registro de la sección.
*   `nombre` (string): Nombre completo (precargado desde `Patient.name`).
*   `sexo` (string): Sexo biológico.
*   `dob` (string, YYYY-MM-DD): Fecha de nacimiento (precargada desde `Patient.dob`).
*   `edad` (number): Edad en años (precargada desde `Patient.age`).
*   `lugarNacimiento` (string): Lugar de origen.
*   `domicilio` (string): Dirección de residencia.
*   `telefono` (string): Teléfono de casa (precargado desde `Patient.phone`).
*   `celular` (string): Número celular.
*   `correo` (string): Dirección de email.
*   `estadoCivil` (string): Soltero/a, casado/a, etc.
*   `religion` (string): Creencia religiosa.
*   `escolaridad` (string): Nivel académico.
*   `ocupacion` (string): Trabajo u oficio.
*   `derechohabiente` (string): 'si' o 'no'.
*   `institucion` (string): ISSSTE, IMSS, Seguro Popular, Otro, Ninguna.
*   `grupoSanguineo` (string): Tipo y factor RH.
*   `alergias` (string): Alergias médicas (precargadas desde `Patient.allergies` o `MedicalHistory.allergies`).
*   `peso` (string): Peso en kg.
*   `altura` (string): Altura en metros.
*   `temperatura` (string): Temperatura en °C.
*   `pulso` (string): Pulso por minuto.
*   `fc` (string): Frecuencia cardiaca.
*   `fr` (string): Frecuencia respiratoria.
*   `ta` (string): Tensión arterial (ej. 120/80).

### 2. Salud Sistémica & Medicamentos (`systemicHealth`)
Padecimientos sistémicos y control de fármacos administrados de forma continua.

*   `medications` (array de objetos): Medicamentos que toma actualmente.
    *   `farmaco` (string): Nombre del medicamento.
    *   `frecuencia` (string): Dosis y horario.
    *   `motivo` (string): Razón del tratamiento.
*   `systemicDiseases` (array de objetos): Diagnósticos sistémicos previos.
    *   `diagnostico` (string): Nombre de la patología.
    *   `tiempoEvolucion` (string): Años o meses transcurridos.
    *   `observaciones` (string): Comentarios médicos.
*   `systemicRisk` (string): Semáforo de riesgo sistémico (`alto`, `medio`, `bajo`).
*   `informantName` (string): Nombre del informante secundario (en caso de menores o incapacidad).
*   `informantParentesco` (string): Parentesco.
*   `informantDomicilio` (string): Dirección del informante.
*   `informantTelefono` (string): Teléfono del informante.
*   `motivoConsulta` (string): Causa principal de la visita.

### 3. Antecedentes Familiares (`familyHistory`)
Matriz de patologías hereditarias familiares.

*   `matrix` (objeto de objetos): Mapea `[patología]_[familiar]` con un booleano (ej. `diabetes_I_padre: true`).
    *   **Patologías:** Infarto, Hipertensión, Diabetes I, Diabetes II, Obesidad, Hipertiroidismo, Hipotiroidismo, Alergias, Cáncer, Infectocontagiosas, Convulsiones, Hemofilia, Adicciones, Otra.
    *   **Familiares:** Padre, Madre, Abuelo Paterno, Abuela Paterna, Abuelo Materno, Abuela Materna, Hijos, Hermanos.
*   `alergiasDetalle` (string): Especificación de alergias en la familia.
*   `infectocontagiosasDetalle` (string): Detalle de infectocontagiosas familiares.
*   `adiccionesDetalle` (string): Detalle de dependencias en familiares.
*   `otraEnfermedadDetalle` (string): Otros padecimientos hereditarios relevantes.

### 4. Antecedentes Personales (`personalHistory`)
Hábitos, antecedentes patológicos individuales, antecedentes gineco-obstétricos y eventos traumáticos.

*   `vivienda` (string): Condiciones de alojamiento.
*   `habitosHigienicos` (string): Frecuencia de higiene.
*   `habitosDieteticos` (string): Hábitos alimentarios.
*   **Gineco-Obstétricos (Mujeres):**
    *   `menarca` (string): Edad de menarca.
    *   `vidaSexualActiva` (string): 'si' o 'no'.
    *   `embarazos` (string): Número de gestaciones.
    *   `embarazosTermino` (string): Embarazos a término.
    *   `menopausia` (string): Edad de menopausia.
*   **Varones:**
    *   `varonVidaSexualActiva` (string): 'si' o 'no'.
    *   `varonGrupoSanguineo` (string): Grupo y tipo sanguíneo.
*   `pathologicalTable` (array de objetos): Tabla editable de enfermedades personales previas.
    *   `enfermedad` (string): Nombre del diagnóstico (ej. Diabetes Mellitus, VIH, Herpes, Asma, etc.).
    *   `edadInicio` (string): Edad al presentarse.
    *   `controlMedico` (string): 'si' o 'no'.
    *   `complicacion` (string): Secuelas o complicaciones asociadas.
*   **Dependencias / Adicciones:**
    *   `tabaquismo`, `alcoholismo`, `adiccionOtra` (objetos):
        *   `activo` (boolean): Si consume actualmente.
        *   `inactivo` (boolean): Si es ex-consumidor.
        *   `edadInicio` (string): Edad de inicio.
        *   `frecuencia` (string): Frecuencia de uso.
        *   `cantidad` (string): Cantidad habitual.
*   **Anestesia y Traumatismos:**
    *   `anestesiaDental` (string): 'si' o 'no' (¿Ha recibido anestesia dental?).
    *   `anestesiaProblema` (string): 'si' o 'no' (¿Ha presentado problemas?).
    *   `anestesiaEspecifique` (string): Descripción de problemas de anestesia.
    *   `transfundido` (string): 'si' o 'no' (¿Ha sido transfundido?).
    *   `traumatismosRecientes` (string): 'si' o 'no' (¿Traumatismos recientes?).
    *   `traumatismosEspecifique` (string): Descripción de los traumatismos.

### 5. Interrogatorio por Aparatos y Sistemas (`systemsReview`)
Revisión por aparatos mediante mapeo de sintomatología clínica.

*   `symptoms` (objeto de objetos): Mapea `[sintoma]` a un objeto con `{ presenta: boolean, frecuencia: string, tiempoEvolucion: string }`.
    *   **Síntomas:** Ansiedad, Depresión, Cefalea, Neuralgia, Temblor, Acúfenos, Fosfenos, Taquicardia, Mareos, Dolor precordial, Disnea, Astenia, Adinamia, Edema, Hematuria, Respiración bucal, Anorexia, Bulimia, Xerostomía, Glosopirosis, Glosodinea, Pirosis, Náuseas, Vómito, Hematemesis, Estreñimiento, Diarrea, Oliguria, Poliuria, Disuria, Polifagia, Polidipsia, Pérdida de peso, Artralgia, Artritis, Mialgia, Calambres.

### 6. Exploración Física (`physicalExam`)
Exploración visual y táctil general del paciente.

*   `actitudPaciente` (string): Postura, comportamiento y orientación.
*   `caraCuello` (objeto): Frente, Cejas, Ojos, Nariz, Labios, Mejillas, Mentón, Cuello.
*   `atmExploracion` (string): Ruidos, saltos, desviación mandibular o dolor en ATM.
*   `musculos` (objeto): Mapea estados booleanos (`true` si presenta dolor/tensión) para maseteros D/I, temporales D/I, pterigoideo ext D/I, pterigoideo int D/I, esternocleidomastoideo D/I, trapecios D/I.

### 7. Exploración Intrabucal & IHOS (`intrabucalExam`)
Inspección oral detallada e Índice de Higiene Oral Simplificado (IHOS).

*   `tejidosBlandos` (objeto): Labios, Mucosa yugal, Frenillos, Encía, Paladar, Orofaringe, Istmo de las fauces, Úvula, Amígdalas, Lengua, Piso de boca.
*   `ihos` (objeto): Mediciones para las 3 etapas (`cita1`, `mitadTx`, `ultimaCita`).
    *   Cada etapa incluye: `fecha`, códigos para los dientes de control (16, 11, 26, 46, 31, 36) en placa de detritus dentobacteriano (`_pdb`) y cálculo supragingival (`_cal`), e `interpretacion` (Alto, Medio, Bajo).

### 8. Odontograma (`odontograma`)
*   Sección informativa con leyenda de colores (Rojo: Caries; Diagonal Roja: Exodoncia; Diagonal Azul: Ausente; Azul: Obturado; I---I---I: Cálculo).
*   Enlaza al componente e historial de odontograma del paciente usando el botón de acción rápida `Abrir Odontograma`.

### 9. Consentimiento Informado (`consentimiento`)
*   `nombrePaciente` (string): Nombre del paciente/responsable.
*   `fechaPaciente` (string): Fecha de aceptación.
*   `nombreTestigo` (string): Nombre de testigo.
*   `fechaTestigo` (string): Fecha del testigo.
*   `acepto` (boolean): Checkbox de aceptación legal conforme al Word.
*   `concluidoConformidad` (boolean): Declaración de conclusión y liquidación total.
*   `conclusionNombrePaciente` (string), `conclusionFechaPaciente` (string), `conclusionNombreTestigo` (string), `conclusionFechaTestigo` (string).

### 10. Diagnóstico & Plan de Tratamiento (`diagnosticoPlan`)
*   `diagnosticoIntegral` (string): Notas médicas completas del diagnóstico global.
*   `planTxList` (array de objetos): Tabla de plan de tratamiento.
    *   `planCosto` (string): Procedimiento planeado y costo.
    *   `txRealizado` (string): Tratamiento realizado.
    *   `costo` (string): Costo del tratamiento realizado.
    *   `aCuenta` (string): Pago inicial o abono.
    *   `fecha` (string): Fecha del tratamiento.
    *   `firma` (string): Iniciales/Firma del responsable.

### 11. Notas de Evolución (`evolucionNotes`)
*   `notes` (array de objetos): Historial cronológico de notas de progreso.
    *   `id` (string): UUID de la nota.
    *   `fecha` (string): Fecha de la nota.
    *   `titulo` (string): Título de la nota clínica.
    *   `nota` (string): Descripción de la evolución del paciente.
    *   `doctor` (string): Profesional a cargo del ajuste.

---

## 3. Precarga de Datos desde `Patient`
Para agilizar el llenado clínico y evitar redundancia, al consultar el cuestionario oficial de un paciente por primera vez, se precargan dinámicamente los siguientes valores del registro base:

1.  **Nombre completo:** `Patient.name` -> `patientData.nombre`
2.  **Fecha de nacimiento:** `Patient.dob` -> `patientData.dob`
3.  **Edad actual:** `Patient.age` -> `patientData.edad`
4.  **Teléfono principal:** `Patient.phone` -> `patientData.telefono`
5.  **Alergias:** `Patient.allergies` o el campo `MedicalHistory.allergies` existente.

> [!IMPORTANT]
> El guardado de la Historia Clínica actualiza automáticamente el campo general `Patient.allergies` para mantener una única fuente de verdad sobre riesgos críticos, garantizando sincronía entre el Expediente y el Dashboard.

---

## 4. Relación con Odontograma y Presupuestos
*   **Odontograma:** No se duplica código de renderizado de dientes. En la Sección 8 se proporciona un acceso directo para abrir la vista interactiva del odontograma del expediente del paciente en `ArchiveroView.tsx` (`activeExpedienteTab = 'odontograma'`).
*   **Presupuestos:** Se enlaza visualmente a través del Plan de Tratamiento y la pestaña lateral general de presupuestos vinculados al expediente del paciente, manteniendo cada módulo especializado por separado.

---

## 5. Pendientes para el Futuro
*   **Exportación PDF:** Incorporación de motor para renderizado e impresión formal del expediente de 11 secciones.
*   **Firma Digital:** Soporte de firma táctil y autenticación de consentimiento y notas de evolución.
