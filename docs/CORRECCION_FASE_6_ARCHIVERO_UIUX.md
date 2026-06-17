# Corrección Fase 6 — Rediseño UI/UX del Archivero

Este documento detalla la implementación de la **Fase 6** del proyecto **Dental Printer**, en la cual se rediseñó por completo el módulo de **Archivero** para emular visual y funcionalmente un archivador clínico físico digital en base a la imagen de referencia.

---

## 1. Resumen de cambios

Se eliminó la estructura previa de doble panel (con lista de pacientes lateral y panel de folders) para consolidar la interfaz en un **único archivero central grande**. El nuevo diseño simula un cajón metálico de archivador de clínica real extraído, organizado mediante pestañas de rangos alfabéticos horizontales, con carpetas de estilo de manila para cada paciente y tirador/manija metálica con etiqueta en la parte inferior.

---

## 2. Imagen de referencia

Se tomó la imagen provista en la solicitud de cambio como fuente principal de verdad visual para la interfaz, logrando una réplica de alta fidelidad utilizando clases puras de Tailwind CSS. Toda la interfaz está conectada a la base de datos y a las citas reales del sistema.

---

## 3. Archivos modificados

*   **[MODIFY] [src/components/ArchiveroView.tsx](file:///c:/Users/Vallejo/OneDrive/Desktop/dentalprinter-clinic/src/components/ArchiveroView.tsx):** Rediseño completo de la interfaz del archivero, adición de estados alfabéticos, menú de filtros dropdown interactivo y paginación con contadores reales.

---

## 4. Estructura del nuevo Archivero

El componente general se estructuró de la siguiente forma:

1.  **Header Superior:**
    *   Título de vista `Archivero` y descripción con icono de folder abierto.
    *   Buscador rápido con borrado de texto instantáneo.
    *   Botón interactivo de `Filtros` que despliega un menú flotante para filtrar por estado de expediente (Activo, Inactivo, Archivado, con Alergias, con Citas Futuras) y seleccionar criterios de ordenamiento.
2.  **Tabs Alfabéticos:**
    *   Línea de pestañas horizontales con scroll responsivo dividida en rangos: `A-C`, `D-F`, `G-I`, `J-L`, `M-O`, `P-R`, `S-U`, `V-Z`.
3.  **Cajón Central de Gabinete:**
    *   **Cabecera:** Barra interna con aspecto de borde de cajón metálico, mostrando la etiqueta del rango activo y un badge de conteo de expedientes.
    *   **Contenedor / Fondo de Cajón:** Fondo con sombreado de profundidad y gradiente donde reposan las carpetas en un grid de hasta 3 columnas.
    *   **Frente de Cajón Metálico (Pie):**
        *   Contador lateral de registros mostrados y totales.
        *   Tirador/Manija central plateada que incorpora la etiqueta física del rango activo (ej. `A-C`).
        *   Paginador de alta precisión (⏮, ◀, número de página, ▶, ⏭) para navegar en listados con múltiples pacientes.

---

## 5. Lógica Alfabética y Búsqueda

*   Se implementó una función normalizadora que extrae la primera letra del nombre del paciente ignorando tildes y diéresis para ubicarlo exactamente en el rango alfabético correspondiente:
    ```ts
    const getSortableChar = (name: string) => {
      return name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().charAt(0) || 'A';
    };
    ```
*   El filtro alfabético coexiste armónicamente con la barra de búsqueda y los filtros de estado/alergias.

---

## 6. Diseño de las Carpetas (Folders Manila)

Cada carpeta tiene un estilo visual manila crema (`#fefcf7`) con una pestaña sobresaliente en la parte superior izquierda que simula una ficha física y muestra el código resumido del expediente (ej: `EXP-73DE7A`).
En el cuerpo de la carpeta se detalla:
*   Avatar circular con iniciales y nombre completo.
*   Badge de estado clínico en color de acuerdo a su estado (Activo, Inactivo, Archivado).
*   Datos de contacto y edad en una sección dividida con bordes finos.
*   Advertencia de alergia crítica o nivel de riesgo según corresponda.
*   Cálculo dinámico en base a citas reales para la **Última visita** (citas pasadas) y la **Próxima cita** (citas futuras agendadas con formato en verde si están activas).
*   Si no hay citas, se muestra un guion simple (`—`) sin fallos de renderizado.

---

## 7. Compatibilidad con el Expediente

La pestaña interactiva de Historia Clínica integrada en la Fase 5, el odontograma, las citas y presupuestos permanecen intactos y son plenamente accesibles al hacer clic en cualquier folder. Un botón de "Volver al Archivero" devuelve la visualización al cajón activo manteniendo la página y filtros previamente seleccionados.

---

## 8. Pruebas realizadas

*   **Pruebas de Filtros y Búsqueda:** Se verificó que los expedientes de cada letra inicial aparecen únicamente en su pestaña correspondiente. La búsqueda y filtros adicionales (ej: activos/inactivos) operan simultáneamente limitando los registros mostrados de forma correcta.
*   **Pruebas de Paginación:** Se paginaron los folders en bloques de 6 por cajón. Al avanzar de página se actualiza el contador de pie de cajón. El cambio de tab alfabético o el ingreso de texto en la búsqueda resetean el paginador a la página 1 previniendo desbordamientos.
*   **Pruebas de Compilación (`npm run lint` & `npm run build`):**
    *   `npm run lint` finaliza con **0 errores** de tipado.
    *   `npm run build` genera el bundle óptimo de Vite en 491ms.

---

## 9. Pendientes fuera de esta fase

*   Ajustes visuales adicionales de acuerdo a retroalimentación posterior de César.
*   Exportar o imprimir la ficha consolidada en PDF.
*   Carga de documentos externos / radiografías.

---

## 10. Notas técnicas

*   La manija y etiqueta central del pie del archivero se diseñaron con clases nativas de Tailwind CSS, evitando el uso de imágenes externas o dependencias que ralenticen la carga.
