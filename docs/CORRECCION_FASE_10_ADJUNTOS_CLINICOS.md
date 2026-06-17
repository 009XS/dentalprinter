# Corrección Fase 10 — Adjuntos y Archivo Clínico Digital del Expediente

Este documento detalla la implementación y corrección de la Fase 10 del sistema Dental Printer, enfocado en permitir la gestión de archivos clínicos adjuntos (radiografías, recetas, documentos, reportes de laboratorio) asociados de forma segura al expediente de cada paciente.

---

## 1. Resumen de Implementación
Se incorporó un módulo completo de gestión documental local en el expediente individual del paciente. Los usuarios con roles autorizados pueden subir archivos, clasificarlos por categorías clínicas relevantes, previsualizar imágenes en la misma aplicación, abrir PDFs en pestañas seguras del navegador, y eliminar adjuntos tanto del registro de base de datos como del almacenamiento en disco del servidor.

## 2. Archivos Modificados
*   `prisma/schema.prisma`: Incorporación del modelo `ClinicalAttachment` y su relación con `Patient`.
*   `server/index.ts`: Configuración de middleware de carga Multer, sanitización de archivos y creación de endpoints de gestión de adjuntos.
*   `server/types.ts`: Incorporación del tipo `ClinicalAttachment` y relación en `Patient` en el backend.
*   `src/types.ts`: Sincronización del tipo `ClinicalAttachment` y relación en `Patient` en el frontend.
*   `src/api.ts`: Creación de llamadas API cliente `getPatientAttachments`, `uploadPatientAttachment` (utilizando `FormData`) y `deleteAttachment`.
*   `src/components/ArchiveroView.tsx`: Creación de la pestaña "Adjuntos", formulario de subida, renderizado de tarjetas, controles de vista/descarga y eliminación, y modal premium de previsualización.
*   `src/components/HistoriaClinicaPrintView.tsx`: Carga asíncrona de adjuntos del paciente y renderizado al pie de página de una tabla resumen en el historial impreso.

## 3. Dependencias Instaladas
Se instalaron las siguientes dependencias para gestionar la carga de archivos multiparte (`multipart/form-data`) de forma correcta en Node.js y TypeScript:
*   `multer`: Procesador de peticiones multipart en Node.
*   `@types/multer` (como DevDependency): Soporte de tipos TypeScript para el objeto `Express.Multer.File`.

## 4. Cambios en Base de Datos
Se agregó una relación `attachments` al modelo `Patient` y se creó el nuevo modelo de base de datos `ClinicalAttachment` en SQLite:

```prisma
model ClinicalAttachment {
  id           String   @id @default(cuid())
  patientId    String
  patient      Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  fileName     String
  originalName String
  mimeType     String
  sizeBytes    Int
  filePath     String

  category     String   @default("General")
  description  String?
  uploadedBy   String?
  createdAt    DateTime @default(now())
}
```

## 5. Endpoints Creados (Backend)
Todos los endpoints están protegidos por el middleware de autenticación `requireAuth` para evitar accesos no autorizados a archivos clínicos y metadatos:

1.  **Listar Adjuntos**: `GET /api/patients/:patientId/attachments`
    *   Devuelve los registros de adjuntos del paciente ordenados cronológicamente descendente, agregando una propiedad `url` segura de descarga directa.
2.  **Subir Adjunto**: `POST /api/patients/:patientId/attachments` (Roles: `admin`, `doctor`, `recepcionista`)
    *   Acepta cargas de archivos con campos adicionales `category` y `description`. Valida formato, tamaño y existencia del paciente.
3.  **Eliminar Adjunto**: `DELETE /api/attachments/:attachmentId` (Roles: `admin`, `doctor`, `recepcionista`)
    *   Elimina físicamente el archivo del disco del servidor y remueve el registro de SQLite de manera segura.
4.  **Ver/Descargar Archivo**: `GET /api/attachments/:attachmentId/file`
    *   Valida la autenticación de la sesión del usuario y transmite el archivo físico desde el disco al cliente con la cabecera `Content-Disposition: inline` (lo cual permite previsualizaciones en navegador para PDFs e imágenes sin exponer la ruta interna física del archivo).

## 6. Almacenamiento Local
Los archivos se almacenan localmente en el servidor en el directorio:
`uploads/patients/{patientId}/`

Cada archivo subido se renombra usando un identificador UUID único aleatorio (ej. `3b2b069d-21fa-4001-92ea-297c8d9c2297.jpg`) para evitar colisiones de nombres y vulnerabilidades de inyección de directorios (Path Traversal).

## 7. Integración en Archivero (UI)
*   **Nueva Pestaña "Adjuntos"**: Ubicada dentro de la carpeta del expediente individual del paciente.
*   **Formulario de Carga**: Con soporte de arrastre y selección de archivo con límite visible, selector de categorías y descripción rápida.
*   **Listado en Rejilla (Grid)**: Tarjetas de diseño premium con iconos de archivo según su tipo MIME (imágenes, PDF o genéricos), tamaño del archivo formateado (ej. `2.50 MB`), fecha de subida, y nombre de usuario responsable.
*   **Modal de Vista Previa**: Componente premium reactivo que obtiene la imagen de forma segura del servidor y la presenta dentro de un lightbox integrado sin recargar la pestaña.
*   **Límites y Mensajes de Error**: Advertencias ante formatos no permitidos, superación del peso máximo (10 MB), y fallas de conexión.

## 8. Tipos Permitidos
*   **Imágenes**: `image/jpeg`, `image/png`, `image/webp`
*   **Documentos**: `application/pdf`
*   **Archivos Prohibidos (Sanitización Backend)**: Bloqueo explícito a nivel de extensión y MIME para extensiones peligrosas como `.exe`, `.bat`, `.cmd`, `.js`, `.html`, `.sh`, `.com`, `.msi`, `.vbs`, etc.

## 9. Seguridad Básica Implementada
*   **Nombre de Archivo Aleatorizado**: Almacenamiento con nombre UUID seguro en disco.
*   **Autenticación Obligatoria**: Incluso el link directo para ver o descargar un archivo (`/api/attachments/:id/file`) requiere un token Bearer válido en las cabeceras HTTP de la petición fetch.
*   **Descarga Segura en Frontend**: El frontend realiza llamadas fetch con la cabecera `Authorization` para obtener el archivo como Blob binario local y generar un ObjectURL temporal, asegurando que los archivos clínicos nunca tengan URLs desprotegidas en internet.
*   **Validaciones Físicas**: Antes de cualquier eliminación física o lectura en disco, se normalizan las rutas absolutas para prevenir Path Traversal.

## 10. Pruebas Realizadas
1.  **Respaldo Exitoso**: Se copió `prisma/dev.db` a `backup/dev-before-phase-10-clinical-attachments.db`.
2.  **Pruebas Automatizadas de Base de Datos**: Ejecución de `npx tsx scratch/test_phase_10.ts` que validó:
    *   Existencia de respaldo físico.
    *   Inserción y guardado de un adjunto clínico.
    *   Persistencia de la relación paciente -> adjuntos.
    *   Eliminación física del archivo en disco y eliminación del registro en SQLite.
3.  **Compilación y Estilo**:
    *   `npm run lint` finalizado con 0 errores.
    *   `npm run build` compilado con éxito total.
