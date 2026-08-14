# Informe Ejecutivo de Calidad — CMS NativaGo
**Previo a autorización de salida a producción**

Fecha: 2026-08-01 · Alcance: CMS (`Proyecto_ongo_v1`), fuente única de verdad del Marketplace · Metodología: análisis estático completo del código real (no se asumió ninguna funcionalidad sin verificarla en el repositorio) + diseño BDD (Gherkin/Cucumber/Playwright) módulo por módulo, en orden de riesgo.

Reportes por módulo: `qa/reports/modulo-01-operadores-verificacion.md` … `modulo-06-autenticacion-sesion.md`. Este documento consolida los seis.

---

## 1. Resumen ejecutivo

El CMS es funcional y su arquitectura (capas domain/infrastructure/services, aislamiento multi-país, roles jerárquicos) está bien pensada — no es un sistema descuidado. El problema no es de diseño general: es que **la regla más importante del negocio — "solo operadores verificados aparecen en el Marketplace" — no se aplica en el punto donde realmente importa.**

Se identificaron **68 reglas de negocio** reales a lo largo de 6 módulos. De ellas:
- **~27 tienen cobertura automatizada completa** (ya en `tests/bdd/`, 33 escenarios corriendo en verde).
- **~13 tienen cobertura parcial** (se ejercen indirectamente pero sin un escenario dedicado).
- **~31 no tienen ningún tipo de cobertura.**

Cobertura funcional efectiva estimada: **~56%**, por debajo del 95% objetivo. La brecha no es pareja: está concentrada en Experiencias, Reservas y en las reglas de seguridad/ownership de los tres módulos centrales — no en el módulo de Roles, que ya quedó bien cubierto ayer.

**El inventario funcional real tiene 14 módulos, no 35.** Varios módulos del listado original de referencia (Comisiones, Idiomas, Videos/Multimedia, Auditoría/Logs, Notificaciones/Email, Integraciones, Permisos como matriz configurable) no existen en este CMS — están o bien ausentes por completo, o son placeholders sin funcionalidad (`/admin/settings` es un "Coming Soon" literal). Se documenta explícitamente para que el 95% de cobertura se mida contra lo que existe, no contra una lista aspiracional.

---

## 2. Bloqueadores de producción (P0)

| # | Hallazgo | Módulo | Naturaleza |
|---|---|---|---|
| 1 | **`POST /api/catalog/experience` no valida `verificationStatus` del operador.** Un operador `DRAFT`, `PENDING`, `INFO_NEEDED`, `REJECTED` o incluso `SUSPENDED` puede publicar experiencias reales llamando la API directamente — la única protección existente es un mensaje de UI en un solo formulario, no un gate en el servidor. | 01, 02, 05 (mismo defecto raíz, visto desde tres ángulos) | **Defecto de seguridad/integridad de datos**, confirmado por análisis estático completo (no una hipótesis) |
| 2 | `requireOperator()` redirige a aceptar el contrato de intermediación mirando solo `contractAccepted`, nunca `verificationStatus` — un operador nunca verificado puede aceptar un contrato. | 01 | Defecto de lógica de autorización |
| 3 | El contrato PDF se genera escribiendo a `public/contracts/` en filesystem local — no persiste en Vercel serverless; la aprobación no se revierte si falla, así que puede fallar en silencio en producción. | 01 | Riesgo de infraestructura/despliegue |
| 4 | **La funcionalidad "Publicar/Despublicar" no existe** — `Experience.status` está en el schema pero ningún código lo lee, escribe ni filtra. Toda experiencia es pública para siempre desde que se crea. | 02, 05 | Funcionalidad ausente, no defecto de código — decisión de producto pendiente |
| 5 | `POST /api/auth/login` no tiene rate limiting ni bloqueo por intentos fallidos, a diferencia de otras rutas del sistema que sí lo tienen. | 06 | Defecto de seguridad (fuerza bruta de credenciales) |

**Recomendación:** los hallazgos #1, #2 y #4 comparten una sola causa técnica de fondo — ningún punto de lectura/escritura del catálogo filtra por el estado real del operador ni de la experiencia. Un solo cambio en `PrismaExperienceRepository.findMany` (agregar `where: { operator: { verificationStatus: 'APPROVED' } }`, y cuando exista, `status: 'PUBLISHED'`) más el gate faltante en `POST /api/catalog/experience`, cierra los tres al mismo tiempo. No son tres tareas — es una.

---

## 3. Matriz de riesgo por módulo

| Módulo | Riesgo | Reglas | Cobertura | P0 | Impacto Marketplace |
|---|---|---|---|---|---|
| 01 — Operadores/Verificación | **Muy Alto** | 16 | Media | 1 (#1, #2, #3) | Directo — controla quién puede publicar |
| 02 — Experiencias | Alto | 12 | Baja | 1 (#4) | Directo — es el catálogo mismo |
| 03 — Reservas/Cupo/Check-in | Alto | 15 | Baja | 0 (P1: check-in sin validar estado) | Indirecto — dinero real, confianza del operador |
| 04 — Roles/Soporte/Equipos | Medio | 9 | **Alta** | 0 | Ninguno (interno al CMS) |
| 05 — Catálogo público | Alto | 8 | Media | 1 (=#1, mismo hallazgo) | Directo — es la API que el Marketplace consume |
| 06 — Autenticación | Alto | 8 | Baja | 1 (#5) | Indirecto — compromete todo lo demás transitivamente |

---

## 4. Cobertura por tipo (real, no aspiracional)

- **Funcional (UI/E2E):** 33 escenarios automatizados, `tests/bdd/`, Playwright + playwright-bdd + Cucumber, corriendo en verde contra CMS y Marketplace reales.
- **API:** cubierta indirectamente por los mismos 33 escenarios (varios pasos llaman `page.request` directo a la API, ej. control de cupo, login) — no hay suite API-only separada todavía.
- **Base de datos:** sin pruebas dedicadas de integridad referencial (ej. el escenario diseñado de "eliminar experiencia con reservas" en Módulo 02 no está automatizado).
- **Seguridad:** 0 escenarios automatizados de los ~9 diseñados en este informe (ownership cruzado, IDOR, rate limiting, exposición de datos). Es el hueco más grande y el de mayor impacto por hallazgo.
- **Performance:** no evaluada — no hay ninguna prueba de carga/stress/spike/soak en el repo.
- **Accesibilidad:** no evaluada — no hay ninguna prueba WCAG/ARIA/teclado en el repo.
- **Responsive:** no evaluada como suite automatizada (sí hubo verificación manual con capturas en sesiones anteriores, pero no es parte de la suite de regresión).

---

## 5. Funcionalidades del listado original sin equivalente en el código

Para que el objetivo de cobertura se mida contra la realidad: **Permisos** (no hay matriz configurable, son roles fijos en código), **Subcategorías**, **Países como CRUD** (son seed, sin UI admin), **Comisiones** (placeholder vacío en Configuración), **Idiomas** (tabla de referencia, sin admin UI), **Videos/Galería multimedia** (una sola imagen por experiencia), **Integraciones**, **Auditoría/Logs**, **Notificaciones/Emails** (no hay servicio de email en el CMS), **Calendarios** como módulo separado (es lo mismo que Disponibilidad).

---

## 6. Escenarios priorizados (consolidado de los 6 módulos)

**P0 — antes de Go-Live:**
- Fix + escenario de seguridad para el gate de verificación en `POST /api/catalog/experience` (Módulos 01/02/05).
- Decisión de producto sobre "Publicar/Despublicar" (Módulo 02).
- Rate limiting en `/api/auth/login` (Módulo 06).
- Decisión de negocio sobre check-in de reservas canceladas/futuras (Módulo 03).

**P1 — siguiente sprint:**
- Ownership sin cobertura: edición/eliminación de experiencias ajenas, reservas de otro operador (Módulos 02, 03).
- Mover generación de contrato PDF a blob storage (Módulo 01).
- Concurrencia real del control de cupo con 2 requests simultáneos (Módulo 03).
- Demostrar con un escenario el riesgo ya aceptado de no-revocación de JWT (Módulos 01, 04, 06).

**P2:** validación de entrada en API de reservas, manejo de errores al borrar categorías/ciudades/experiencias en uso, filtrar operadores no aprobados de la API pública, cerrar el IDOR de aislamiento por país con un test explícito.

**P3 / manual, no automatizar:** concurrencia de doble aprobación (bajo impacto), limpieza de UX en mensajes silenciosos (categorías/ciudades/soporte con nombre o email duplicado), unificar las dos UIs de creación de experiencia.

---

## 7. Plan de mitigación sugerido

1. **Esta semana:** decidir y aplicar el fix consolidado de verificación (bloqueador #1/#2/#4) — es el de mayor impacto y menor esfuerzo relativo.
2. **Antes de Go-Live:** rate limiting en login; decisión de producto sobre despublicar y sobre reglas de check-in.
3. **Sprint siguiente:** cerrar los P1 de ownership (son pocos cambios de código, cada uno ya tiene un patrón idéntico ya resuelto en otro punto del mismo módulo — es replicar el guard, no inventarlo).
4. **Backlog, sin bloquear:** performance, accesibilidad, limpieza de UX en errores silenciosos, deuda técnica ya documentada en `ARCHITECTURE.md`.

---

## 8. Documentación corregida durante esta auditoría

`ARCHITECTURE.md` afirmaba que `src/app/admin/page.tsx` estaba roto (llamaba a una ruta `/api/auth/me` inexistente). Se verificó que ya no es así — se corrigió en trabajo posterior a la fecha de ese documento sin actualizarlo. Ya corregido en `ARCHITECTURE.md` como parte de esta auditoría.

---

## 9. Siguiente paso

Este informe es Fase 1-5 (comprensión, reglas, riesgo, diseño). La automatización de los escenarios P1/P2 nuevos (no solo el diseño Gherkin) es el siguiente bloque de trabajo natural, empezando por los P0 una vez el equipo decida cuáles corregir en código. Ninguno de los hallazgos de seguridad de este informe fue explotado ni modificado — todo el trabajo fue de lectura y diseño de pruebas, sin tocar código de producto.
