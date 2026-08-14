# Módulo 02 — Experiencias (crear / editar / eliminar / disponibilidad)

**Clasificación de riesgo del módulo: ALTO**
Impacto negocio: alto · Impacto Marketplace: muy alto (es el catálogo mismo) · Impacto económico: medio · Impacto disponibilidad: alto.

Rutas: `/admin/experiences[/new][/[id]/edit][/[id]/availability]`, `/admin/new` (UI paralela), `POST|PUT /api/catalog/experience`, `POST /api/catalog/slots`.

---

## 1. Catálogo de reglas de negocio

| ID | Regla | Criticidad | Riesgo | Cobertura actual |
|---|---|---|---|---|
| RN-EXP-01 | `title`, `description`, `price`, `durationMinutes`, `categoryId`, `cityId` son obligatorios | Alta | Bajo | ⚠️ No probado explícitamente (solo caminos felices que ya los llenan) |
| RN-EXP-02 | `cityId` debe pertenecer al país del operador — `assertCityBelongsToCountry` rechaza ciudad de otro país aunque el `<select>` sea manipulado client-side | Alta | Medio | ❌ Sin cobertura — es una regla de aislamiento multi-país central, sin escenario |
| RN-EXP-03 | Para operadores no-staff, `operatorId` se ignora del body y se fuerza a `authUser.operatorId` (protección IDOR) | Muy Alta | Bajo (ya mitigado) | ❌ Sin escenario de seguridad que confirme el IDOR está cerrado |
| RN-EXP-04 | `countryId` de la experiencia se deriva del operador en el servidor, nunca del cliente | Alta | Bajo | ⚠️ Implícito, no probado directamente |
| RN-EXP-05 | Un operador solo edita/ve disponibilidad/elimina **sus propias** experiencias (`operatorId === auth.operatorId`) — verificado en 3 puntos independientes (edit page, PUT API, availability page+actions, delete action) | Muy Alta | Medio | ❌ **Sin ningún escenario** — es la regla de ownership más repetida del módulo y no tiene ni un test |
| RN-EXP-06 | La creación de experiencias no valida `verificationStatus` del operador | Muy Alta | Muy Alto (P0) | Documentado en Módulo 01 (RN-OP-12) — no se duplica aquí |
| RN-EXP-07 | Existen dos UIs de creación independientes (`/admin/new` vía API cliente, `/admin/experiences/new` vía Server Action) con validaciones que ya divergieron (una sí filtra por `verificationStatus`, la otra no) | Alta | Alto | ⚠️ Cubierto solo el camino Server Action; `/admin/new` nunca se probó |
| RN-EXP-08 | El campo "Cupo" (`capacity`) que se llena en `/admin/new` se descarta silenciosamente — `createExperience()` no lo acepta. Solo es fijable después vía `PUT` directo (sin UI) | Media | Medio | ❌ Sin cobertura — es un bug de UX confirmado (usuario llena un campo que no hace nada) |
| **RN-EXP-09** | 🔴 **No existe ninguna implementación de "Publicar/Despublicar".** `Experience.status: ExperienceStatus` existe en el schema (`DRAFT`/`PUBLISHED`, default `DRAFT`) pero **ningún código en `src/app/`, `src/services/` o el repositorio lo lee, lo escribe, ni lo filtra** — toda experiencia creada es pública de inmediato y para siempre, sin importar el valor de `status` | Alta | **Muy Alto** | ❌ Gap funcional completo, no solo de tests — impacta directamente la regla que el propio brief cita como ejemplo ("experiencia despublicada → debe desaparecer del Marketplace"). Hoy es **imposible** despublicar sin borrar. |
| RN-EXP-10 | `deleteExp` no maneja el caso de una experiencia con `Booking`/`AvailabilitySlot` asociados — el schema no define `onDelete`, por lo que Postgres aplicaría `RESTRICT` por defecto | Media | Medio | ❌ Sin cobertura — probable **crash no controlado** (error 500) en vez de mensaje de negocio al intentar borrar una experiencia con reservas activas |
| RN-EXP-11 | `AvailabilitySlot.capacity` (cupo por fecha/hora) es un campo distinto de `Experience.capacity` (cupo global, no expuesto en UI) — dos conceptos de "cupo" coexisten con nombres idénticos | Baja | Medio | Riesgo de confusión de mantenimiento, no de comportamiento — documentar, no testear |
| RN-EXP-12 | `addSlot`/`deleteSlot` en disponibilidad respetan el mismo ownership que el resto del módulo | Alta | Bajo | ❌ Sin escenario propio (solo se ejerce indirectamente vía el control de cupo del Módulo 03) |

---

## 2. Hallazgo funcional — RN-EXP-09 (no es un defecto de código, es una funcionalidad ausente)

No hay nada que "arreglar" puntualmente: falta construir la feature completa (acción `publish`/`unpublish`, filtro `where: { status: 'PUBLISHED' }` en `PrismaExperienceRepository.findMany`, UI de toggle). Lo dejo fuera del catálogo de escenarios automatizables por ahora porque no hay comportamiento real que probar — lo registro como **bloqueador de producto**, no de QA, para que quede en el radar antes de Go-Live si "despublicar" es una promesa que el negocio ya hizo.

---

## 3. Escenarios diseñados (nuevos, no automatizados todavía)

```gherkin
# language: es
@negativo @seguridad
Escenario: Un operador no puede editar una experiencia de otro operador
  Dado que tengo una cuenta de operador aprobada con una experiencia publicada
  Y existe otra experiencia que pertenece a un operador distinto
  Cuando intento editar esa experiencia ajena por su URL directa
  Entonces soy redirigido fuera del formulario de edición
  Y la experiencia ajena no cambia

@negativo @seguridad
Escenario: Un operador no puede eliminar una experiencia de otro operador
  Dado que tengo una cuenta de operador aprobada con una experiencia publicada
  Y existe otra experiencia que pertenece a un operador distinto
  Cuando intento eliminar esa experiencia ajena por su formulario
  Entonces la experiencia ajena sigue existiendo

@negativo
Escenario: El registro rechaza una ciudad que no pertenece al país del operador
  Dado que tengo una cuenta de operador aprobada en Colombia
  Cuando intento crear una experiencia con una ciudad de Brasil manipulando el formulario
  Entonces la creación falla y no se publica ninguna experiencia

@borde
Escenario: Eliminar una experiencia con reservas activas no debe romper la página
  Dado que tengo una experiencia publicada con al menos una reserva confirmada
  Cuando intento eliminar esa experiencia
  Entonces veo un mensaje de negocio explicando por qué no se puede eliminar
  Y la experiencia sigue visible en mi panel
  # Hoy este escenario fallaría: no hay manejo de error, es un hallazgo esperado.
```

---

## 4. Matriz de trazabilidad

| Regla | Escenario existente | Estado |
|---|---|---|
| RN-EXP-06 (=RN-OP-12) | Ver Módulo 01 | P0 documentado |
| RN-EXP-01, 04 | Cubiertos implícitamente en `02-registro-y-aprobacion-operador.feature` (creación de experiencia dentro del flujo feliz) | Parcial |
| RN-EXP-02, 03, 05, 07 (parcial), 08, 09, 10, 12 | Sin escenario | Gap |

## 5. Priorización

- **P0:** RN-EXP-09 (decidir si "despublicar" es una promesa activa del producto — si sí, es trabajo de desarrollo, no de QA).
- **P1:** RN-EXP-05 (ownership de edit/delete/availability — la regla más repetida del módulo, cero cobertura), RN-EXP-10 (manejo de error al borrar con reservas).
- **P2:** RN-EXP-02, RN-EXP-03 (cerrar el IDOR con un test que lo demuestre), RN-EXP-07 (decidir cuál de las 2 UIs de creación es la oficial y retirar la otra — ya recomendado en `ARCHITECTURE.md` §7.7).
- **P3:** RN-EXP-08 (quitar el campo "Cupo" de `/admin/new` si no va a implementarse, para no confundir al usuario), RN-EXP-11 (renombrar para claridad).
