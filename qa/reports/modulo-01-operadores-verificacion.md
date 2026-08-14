# Módulo 01 — Operadores / Verificación / Equipo

**Clasificación de riesgo del módulo: MUY ALTO**
Impacto negocio: alto (es el gate de confianza de toda la plataforma) · Impacto Marketplace: alto (controla qué aparece públicamente) · Impacto económico: alto (comisión 15/85 depende de operadores reales) · Impacto seguridad: alto (hallazgo P0 abajo).

Rutas cubiertas: `/register/operator[/terms]`, `/operator/dashboard`, `/legal/operador/aceite`, `/admin/operators[/verification][/[id]/edit]`, `/admin/team`, `/admin/users`, `POST /api/auth/login`, `POST /api/catalog/experience` (como consumidor del estado del operador).

---

## 1. Catálogo de reglas de negocio

| ID | Regla | Criticidad | Riesgo | Cobertura actual |
|---|---|---|---|---|
| RN-OP-01 | El registro exige `name`, `email`, `password`, `cityId`, `identityDocumentNumber`, `liabilityAccepted` | Alta | Medio | ✅ Automatizado (feliz + negativo campo vacío) |
| RN-OP-02 | `password` ≥ 8 caracteres | Media | Bajo | ✅ Automatizado |
| RN-OP-03 | `email` único en `User` | Alta | Medio | ✅ Automatizado (camino feliz de colisión) — falta variante de **concurrencia** (ver RN-OP-03b) |
| RN-OP-03b | Bajo dos registros concurrentes con el mismo email, el segundo `create()` puede violar el `@unique` de Prisma (P2002) sin manejo — devolvería un error 500 genérico en vez del mensaje amigable | Media | Medio | ❌ Sin cobertura — no hay `catch` para `P2002` en `registerOperator()` |
| RN-OP-04 | `cityId` debe resolver a un país válido; el `countryId` de escritura se deriva del servidor, nunca del cliente | Alta | Bajo | ⚠️ Cubierto indirectamente (registro feliz usa ciudad válida) — falta negativo con `cityId` inexistente/manipulado |
| RN-OP-05 | Al registrarse se crean `User` + `Operator` + `OperatorMember(role=ADMIN)` en una única transacción | Alta | Bajo | ✅ Automatizado (implícito en todo registro feliz) |
| RN-OP-06 | `prestadorTipo` (NATURAL/JURIDICA) determina `OperatorType` (FREELANCE/AGENCY) — no es un campo libre | Media | Bajo | ✅ Automatizado (4 perfiles del Esquema del escenario) |
| RN-OP-07 | Todo operador nuevo nace en `DRAFT` | Alta | Bajo | ✅ Automatizado |
| RN-OP-08 | Solo `SUPERADMIN`/`SUPPORT` pueden cambiar `verificationStatus` (`requireStaffOrAbove()`) | Muy Alta | Medio | ⚠️ Cubierto por control de acceso general de Soporte — falta el negativo directo: un OPERATOR intentando `POST` a la acción de aprobar |
| RN-OP-08b | Dos aprobaciones concurrentes sobre el mismo operador deben ser idempotentes | Baja | Bajo | ❌ Sin cobertura |
| RN-OP-09 | Al aprobar se genera el contrato PDF (`generateOperatorContract`); si falla, la aprobación **no se revierte** — falla silenciosa | Alta | **Alto** | ❌ Sin cobertura automatizable — **riesgo de infraestructura**: el PDF se escribe a `public/contracts/` en filesystem local; en Vercel (serverless) ese directorio no es persistente/escribible entre invocaciones. Recomendación: mover a blob storage (`src/lib/blob.ts` ya existe y se usa para documentos de operador) antes de Go-Live. |
| RN-OP-10 | El operador debe aceptar el contrato (`contractAccepted=true`) antes de llegar al panel completo | Alta | Medio | ✅ Automatizado |
| **RN-OP-11** | 🔴 **`requireOperator()` redirige a `/legal/operador/aceite` mirando solo `contractAccepted`, nunca `verificationStatus`** — un operador DRAFT puede aceptar un contrato sin haber sido verificado por nadie | Alta | **Muy Alto** | ✅ Automatizado hoy como escenario negativo ("no llega al formulario de crear experiencias") — **pero el escenario documenta el síntoma, no corrige la causa** |
| **RN-OP-12** | 🔴 **`POST /api/catalog/experience` no valida `verificationStatus` en ningún punto** — un operador DRAFT/PENDING/INFO_NEEDED/REJECTED/SUSPENDED puede publicar experiencias reales llamando la API directamente | Muy Alta | **Muy Alto (P0)** | ❌ **Sin cobertura — gap crítico, ver escenario de seguridad diseñado abajo** |
| RN-OP-13 | Solo `OperatorRole.ADMIN` administra `/admin/team`; `STAFF` es redirigido | Alta | Bajo | ✅ Automatizado |
| RN-OP-14 | Multi-usuario (`OperatorMember`) es conceptualmente válido para cualquier tipo de operador, pero la UI de Equipo no distingue AGENCY/FREELANCE | Baja | Bajo | ⚠️ No verificado si un FREELANCE puede acceder a `/admin/team` — pendiente |
| RN-OP-15 | Los claims del JWT (`role`, `operatorId`, `operatorRole`) no se revocan hasta expirar (7 días) — un operador SUSPENDIDO conserva su sesión activa | Alta | **Alto** | ❌ Sin cobertura — riesgo aceptado documentado en sesión previa, pero nunca probado con un escenario real (suspender → seguir usando la sesión vieja) |
| RN-OP-16 | `SUPERADMIN`/`SUPPORT` ven/gestionan operadores de cualquier país; el resto se restringe a su propio operador | Alta | Medio | ⚠️ No hay escenario cross-país explícito (dos operadores de países distintos, uno intenta ver al otro) |

---

## 2. Escenario de seguridad diseñado — RN-OP-12 (P0)

No se automatiza todavía (a pedido tuyo, queda documentado). Diseño listo para cuando se priorice:

```gherkin
# language: es
@seguridad @P0
Escenario: Un operador sin aprobar no puede publicar una experiencia llamando la API directamente
  Dado los datos de un nuevo operador con perfil "CO natural"
  Cuando completo el formulario de registro de operador con esos datos
  # Mi cuenta queda en DRAFT — nunca fui aprobado por nadie
  Cuando envío una petición POST a la API de creación de experiencias con mis propias credenciales
  Entonces la API responde con estado 403 y no se crea ninguna experiencia
  Y la experiencia no aparece en el catálogo público del marketplace
```

**Fix sugerido (no aplicado):** agregar el mismo chequeo `operator.verificationStatus !== 'APPROVED'` que ya existe en `/admin/experiences/new/page.tsx` dentro de `POST /api/catalog/experience` (y en `PUT` para reforzar en edición), antes de llamar a `createExperience()`. Es una validación de una línea en el punto correcto (la API), no en cada UI que la consume.

---

## 3. Matriz de trazabilidad (regla → escenario → estado)

| Regla | Escenario Gherkin existente | Archivo |
|---|---|---|
| RN-OP-01, 05, 06, 07 | `Un operador se registra, es aprobado y publica su primera experiencia` (Esquema, 4 ejemplos) | `02-registro-y-aprobacion-operador.feature` |
| RN-OP-02 | `El registro falla con una contraseña de menos de 8 caracteres` | ídem |
| RN-OP-03 | `El registro falla si el email ya está registrado` | ídem |
| RN-OP-08 (parcial) | `El equipo de NativaGo pide información adicional en vez de aprobar` | ídem |
| RN-OP-10, 11 (síntoma) | `Un operador sin aprobar no llega al formulario de crear experiencias` | ídem |
| RN-OP-13 | `Un miembro STAFF no puede administrar el equipo del operador` | `04-roles-soporte-y-equipos.feature` |
| RN-OP-16 (parcial, vía Soporte) | `Un usuario de Soporte no puede administrar categorías` | ídem |
| RN-OP-03b, 04(neg), 08(neg directo), 08b, 09, **12**, 14, 15, 16(cross-país) | **Sin escenario** | — |

---

## 4. Recomendación de priorización (P0–P3)

- **P0 — antes de Go-Live:** RN-OP-12 (fix + escenario de seguridad), RN-OP-09 (mover contrato a blob storage).
- **P1 — siguiente sprint:** RN-OP-11 (corregir la causa, no solo el síntoma), RN-OP-15 (probar revocación real o documentar mitigación de producto), RN-OP-03b.
- **P2:** RN-OP-08 (negativo directo), RN-OP-16 (cross-país), RN-OP-04 (negativo).
- **P3 / manual:** RN-OP-08b (concurrencia de aprobación doble — bajo impacto, difícil de reproducir de forma determinística en CI).
