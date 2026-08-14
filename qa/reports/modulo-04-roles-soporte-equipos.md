# Módulo 04 — Roles / Soporte / Equipos multi-usuario

**Clasificación de riesgo del módulo: MEDIO**
Es el módulo con mejor cobertura de la suite hoy — la mayoría de sus reglas ya se automatizaron ayer.

Rutas: `/admin/users`, `/admin/team`, sidebar dinámico (`menuForAuth` en `src/app/admin/layout.tsx`).

---

## 1. Catálogo de reglas de negocio

| ID | Regla | Criticidad | Riesgo | Cobertura actual |
|---|---|---|---|---|
| RN-ROL-01 | `SUPERADMIN`/`SUPPORT` operan Dashboard/Experiencias/Reservas/Check-in/Operadores; solo `SUPERADMIN` administra Ciudades/Categorías/Usuarios/Configuración | Alta | Bajo | ✅ Automatizado |
| RN-ROL-02 | El sidebar se calcula dinámicamente por rol — Soporte ve exactamente 5 ítems, sin Ciudades/Categorías/Usuarios/Configuración | Media | Bajo | ✅ Automatizado |
| RN-ROL-03 | Usuario de Soporte se crea con contraseña temporal aleatoria (`crypto.randomBytes`, sin caracteres ambiguos), mostrada una única vez vía cookie `httpOnly`/30s | Alta | Bajo | ✅ Automatizado (feliz) — sin escenario que confirme que expira/no reaparece tras 30s |
| RN-ROL-04 | Email duplicado al crear un usuario de Soporte falla en silencio (`if (existing) return`, sin mensaje) | Media | Medio | ❌ Sin cobertura — mismo patrón "silent no-op" ya visto en Categorías/Ciudades, mala UX repetida en 3 módulos distintos |
| RN-ROL-05 | Solo `OperatorRole.ADMIN` administra `/admin/team`; `STAFF` es redirigido a su dashboard | Alta | Bajo | ✅ Automatizado |
| RN-ROL-06 | Un `STAFF` opera experiencias/reservas/check-in de su operador igual que `ADMIN` — la única diferencia real es la gestión del equipo | Media | Bajo | ⚠️ Solo se prueba que STAFF *no* ve "Equipo"; nunca se prueba que STAFF *sí puede* crear una experiencia (afirmación positiva pendiente) |
| RN-ROL-07 | El JWT no se revoca al cambiar o quitar un rol — la sesión vieja conserva permisos hasta expirar (7 días) | Alta | **Alto** | ❌ Sin cobertura — riesgo aceptado, nunca demostrado con un escenario real (degradar a alguien y verificar que su sesión sigue viva) |
| RN-ROL-08 | `regeneratePassword` reutiliza el mismo mecanismo de cookie flash que la creación | Baja | Bajo | ❌ Sin cobertura |
| RN-ROL-09 | `User.email` es único **globalmente** — un mismo email no puede pertenecer a un Operador y a un Soporte a la vez; el intento también falla en silencio | Media | Medio | ❌ Sin cobertura |

---

## 2. Escenarios diseñados (nuevos)

```gherkin
# language: es
@negativo
Escenario: Crear un usuario de Soporte con un email ya usado no crea nada ni avisa
  Dado que inicié sesión como SuperAdmin
  Y ya existe un usuario de Soporte registrado
  Cuando intento crear otro usuario de Soporte con ese mismo email
  Entonces no se agrega ningún usuario nuevo a la lista de Soporte
  # Documenta el comportamiento actual (silencioso) — candidato a mejorar UX, no es un blocker.

@feliz
Escenario: Un miembro STAFF puede crear experiencias para su operador
  Dado que tengo una cuenta de operador agencia aprobada y con contrato aceptado
  Cuando agrego un miembro STAFF a mi equipo
  Y inicio sesión con las credenciales de ese miembro STAFF
  Y publico una experiencia como STAFF
  Entonces la experiencia aparece en el panel del operador

@borde @seguridad
Escenario: Degradar un operador a otro rol no corta su sesión activa
  Dado que tengo una cuenta de operador agencia aprobada y con contrato aceptado
  Y agrego un miembro STAFF a mi equipo
  Cuando el equipo de NativaGo suspende la cuenta del operador
  Entonces la sesión ya iniciada del miembro STAFF sigue pudiendo operar durante el resto de su token
  # Riesgo aceptado y documentado — este escenario demuestra el comportamiento, no lo corrige.
```

---

## 3. Matriz de trazabilidad

| Regla | Escenario existente | Estado |
|---|---|---|
| RN-ROL-01, 02 | `El SuperAdmin crea un usuario de Soporte con sidebar reducido` | `04-roles-soporte-y-equipos.feature` ✅ |
| RN-ROL-03 (parcial) | ídem | ✅ |
| RN-ROL-05 | `El operador ADMIN agrega un miembro STAFF...` / `Un miembro STAFF no puede administrar el equipo` | ✅ |
| RN-ROL-04, 06, 07, 08, 09 | Sin escenario | Gap |

## 4. Priorización

- **P1:** RN-ROL-07 (demostrar el riesgo de revocación con un escenario real, aunque el resultado esperado sea "no se corta" — sirve para que quede visible en cada corrida de regresión, no solo en un documento).
- **P2:** RN-ROL-06 (afirmación positiva de STAFF creando experiencias — hoy solo se prueba lo que STAFF *no* puede hacer).
- **P3:** RN-ROL-04, RN-ROL-09 (UX de error silencioso — mismo hallazgo transversal que en Módulo 01/Categorías, ver recomendación consolidada en el informe ejecutivo).
