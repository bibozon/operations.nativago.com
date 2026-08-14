# Módulo 05 — Catálogo público (Categorías / Ciudades / API pública)

**Clasificación de riesgo del módulo: ALTO**
Es la superficie que el Marketplace consume directamente — cualquier gap acá es un gap visible para el usuario final, no solo interno.

Rutas: `/admin/categories`, `/admin/cities`, `GET /api/catalog/{experiences,categories,cities,operator,slots}`.

---

## 1. Catálogo de reglas de negocio

| ID | Regla | Criticidad | Riesgo | Cobertura actual |
|---|---|---|---|---|
| RN-CAT-01 | `Category` es taxonomía global — no se duplica ni filtra por país | Media | Bajo | ✅ Automatizado (CRUD feliz) |
| RN-CAT-02 | Nombre vacío al crear categoría/ciudad → no-op silencioso, sin fila nueva | Media | Bajo | ✅ Automatizado |
| RN-CAT-03 | No se puede eliminar una categoría/ciudad en uso por experiencias — protegido a nivel `service` (`deleteCategoryIfUnused`/`deleteCityIfUnused`), pero la UI ya oculta el botón cuando está en uso, así que la protección de servicio nunca se ejerce en la práctica ni tiene manejo de error amigable si se fuerza | Media | Medio | ❌ Sin cobertura — mismo patrón "protegido pero sin mensaje" transversal |
| **RN-CAT-04** | `CountryCategory` (curación de categorías habilitadas/orden por país) está modelada y sembrada en la DB, pero `listCategories()` nunca la consulta — **toda categoría aparece en todos los países sin distinción**, la curación por país no tiene ningún efecto real | Media | Medio | Documentado como deuda técnica en `ARCHITECTURE.md` — no es un bug nuevo, pero nunca se cerró el círculo con un escenario que lo confirme |
| **RN-CAT-05** | El catálogo público no filtra por `verificationStatus` del operador ni por `status` de la experiencia — cualquier experiencia de cualquier operador aparece, verificado o no | Muy Alta | **Muy Alto** | Ver Módulo 01 (RN-OP-12) y Módulo 02 (RN-EXP-09) — mismo defecto raíz, impacto directo en este módulo: **el catálogo público que el Marketplace muestra a viajeros reales puede incluir experiencias de operadores nunca verificados** |
| RN-CAT-06 | `listCities` para el marketplace solo devuelve ciudades con al menos una experiencia (`experiences: { some: {} }`) — evita ciudades vacías en el selector | Baja | Bajo | ❌ Sin cobertura directa |
| RN-CAT-07 | La API de catálogo (`GET`) es pública, sin autenticación, por diseño | Alta | Bajo (es intencional) | ✅ Verificado indirectamente (el marketplace la consume sin login) |
| RN-CAT-08 | `GET /api/catalog/operator` sin autenticar devuelve `{id, name}` de **todos** los operadores, incluyendo `DRAFT`/`REJECTED`/`SUSPENDED` — no filtra por estado | Baja | Medio | ❌ Sin cobertura — fuga de información menor (nombres, no PII sensible) pero innecesaria: nadie externo debería poder listar operadores nunca aprobados |

---

## 2. Nota de consolidación

RN-CAT-05 **no es un hallazgo nuevo** — es la misma causa raíz de RN-OP-12 (Módulo 01) y RN-EXP-09 (Módulo 02), vista desde el lado del consumidor. Los tres deben resolverse juntos: agregar el filtro `verificationStatus: 'APPROVED'` (y, cuando exista, `status: 'PUBLISHED'`) directamente en `PrismaExperienceRepository.findMany` cerraría de una vez los tres síntomas — es un solo cambio en la capa de repositorio, no tres parches distintos en cada punto de entrada.

---

## 3. Escenarios diseñados (nuevos)

```gherkin
# language: es
@negativo
Escenario: Eliminar una categoría en uso falla de forma controlada
  Dado que estoy en la administración de categorías
  Y existe una categoría usada por al menos una experiencia
  Cuando intento eliminar esa categoría forzando la acción
  Entonces veo un mensaje de negocio explicando por qué no se puede eliminar
  Y la categoría sigue existiendo
  # Hoy fallaría con un error no controlado — hallazgo esperado (RN-CAT-03).

@negativo @seguridad
Escenario: El catálogo público no expone operadores sin aprobar
  Cuando consulto la API pública de operadores sin autenticarme
  Entonces solo aparecen operadores con estado aprobado
  # Hoy fallaría: la API devuelve todos sin filtrar (RN-CAT-08).

@negativo @P0
Escenario: El catálogo público no expone experiencias de operadores sin aprobar
  Dado los datos de un nuevo operador con perfil "CO natural"
  Cuando completo el formulario de registro de operador con esos datos
  Y publico una experiencia forzando la API directamente
  Entonces esa experiencia no aparece en GET /api/catalog/experiences
  # Ligado a RN-OP-12/RN-EXP-09/RN-CAT-05 — es el mismo defecto, visto end-to-end.
```

---

## 4. Matriz de trazabilidad

| Regla | Escenario existente | Estado |
|---|---|---|
| RN-CAT-01, 02 | `Crear, listar y eliminar una categoría` / `...ciudad` | `03-crud-superadmin.feature` ✅ |
| RN-CAT-03, 04, 05, 06, 08 | Sin escenario | Gap |
| RN-CAT-07 | Implícito en toda la suite del marketplace | ✅ |

## 5. Priorización

- **P0:** RN-CAT-05 — mismo fix consolidado que RN-OP-12/RN-EXP-09, con el escenario end-to-end de arriba como prueba de cierre una vez corregido.
- **P2:** RN-CAT-03 (manejo de error), RN-CAT-08 (filtrar operadores no aprobados de la API pública).
- **P3:** RN-CAT-04 (conectar `CountryCategory` — es una feature de curación, no un defecto de seguridad).
