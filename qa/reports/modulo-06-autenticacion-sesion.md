# Módulo 06 — Autenticación / Sesión

**Clasificación de riesgo del módulo: ALTO**
Es la puerta de entrada a todo lo demás — cualquier gap acá compromete transitivamente todos los módulos anteriores.

Rutas: `/login`, `POST /api/auth/login`, `POST /api/auth/logout`, `/admin` (index router por rol), `src/lib/auth.ts`, `src/lib/requireRole.ts`.

---

## 1. Corrección a la documentación existente

`ARCHITECTURE.md` (§6, deuda técnica del CMS) afirma que `src/app/admin/page.tsx` está roto porque llama a `/api/auth/me` (ruta inexistente). **Verifiqué el archivo actual y eso ya no es cierto** — hoy usa `requireAuth()` + `redirect()` server-side por rol, sin ningún `fetch`. La documentación quedó desactualizada (probablemente se corrigió en el trabajo de roles Soporte/Equipos de esta sesión sin actualizar el doc). Lo marco para corregir `ARCHITECTURE.md` en el informe ejecutivo final, no es un hallazgo de QA.

---

## 2. Catálogo de reglas de negocio

| ID | Regla | Criticidad | Riesgo | Cobertura actual |
|---|---|---|---|---|
| RN-AUTH-01 | JWT firmado con `expiresIn: '7d'`, sin mecanismo de refresh ni revocación activa | Alta | Alto | Ya referenciado como riesgo transversal en Módulos 01/04 (RN-OP-15/RN-ROL-07) — no se duplica |
| RN-AUTH-02 | Contraseñas se hashean con bcrypt antes de persistir, nunca texto plano | Muy Alta | Bajo | ✅ Verificado por lectura de código, no hay escenario que lo demuestre (no es demostrable por UI de todas formas) |
| RN-AUTH-03 | Login devuelve el mismo mensaje genérico ante usuario inexistente o contraseña incorrecta (anti user-enumeration) | Alta | Bajo | ✅ Automatizado (ambos casos, mismo mensaje verificado) |
| RN-AUTH-04 | Cookie `auth`: `httpOnly` + `secure` en producción + `sameSite=lax` | Alta | Bajo | ⚠️ No verificado por un test (requiere inspeccionar `Set-Cookie`, no solo comportamiento funcional) |
| RN-AUTH-05 | No existe recuperación de contraseña — el botón "¿Olvidaste tu contraseña?" en `/login` no tiene `onClick`, es un placeholder | Alta | Medio | ❌ Sin cobertura — es una funcionalidad ausente, no un defecto (bloqueada por falta de infraestructura de email, documentado en sesiones previas) |
| **RN-AUTH-06** | 🔴 **`POST /api/auth/login` no tiene rate limiting ni bloqueo por intentos fallidos** — a diferencia de `/api/catalog/bookings` y el checkout del marketplace (que sí usan `checkRateLimit`), el login queda abierto a fuerza bruta de credenciales sin límite | Alta | **Alto** | ❌ Sin cobertura — hallazgo de seguridad nuevo, no documentado previamente |
| RN-AUTH-07 | `/admin` (index) redirige server-side por rol: SUPERADMIN/SUPPORT → dashboard, OPERATOR_AGENCY → agency, OPERATOR_FREELANCE → freelance, sin rol válido → login | Media | Bajo | ⚠️ Cubierto indirectamente en cada escenario que usa `/admin` como destino post-login, sin assert dedicado por rol |
| RN-AUTH-08 | `requireAuth()`/`requireRole()` redirige a `/login` sin sesión válida o expirada | Alta | Bajo | ⚠️ Implícito en cada escenario de control de acceso, sin caso explícito de "token expirado" (no simulable fácilmente sin manipular el reloj o firmar un JWT ya vencido en el test) |

---

## 3. Escenarios diseñados (nuevos)

```gherkin
# language: es
@negativo @seguridad @P1
Escenario: La API de login no bloquea intentos repetidos de fuerza bruta
  Cuando envío 20 intentos de login consecutivos con la misma contraseña incorrecta
  Entonces la API sigue respondiendo 401 sin ningún bloqueo ni retraso creciente
  # Documenta la ausencia de rate limiting — hallazgo esperado (RN-AUTH-06).

@borde
Escenario: Un token expirado no da acceso al panel
  Dado que tengo una cookie de sesión con un JWT ya vencido
  Cuando intento entrar al dashboard de administración
  Entonces soy redirigido a la página de inicio de sesión

@seguridad
Escenario: La cookie de sesión no es accesible desde JavaScript del cliente
  Dado que inicié sesión como SuperAdmin
  Cuando inspecciono las cookies del navegador vía JavaScript
  Entonces la cookie "auth" no aparece en document.cookie
```

---

## 4. Matriz de trazabilidad

| Regla | Escenario existente | Estado |
|---|---|---|
| RN-AUTH-03 | `El inicio de sesión falla con una contraseña incorrecta` / `...un usuario que no existe` | `01-autenticacion.feature` ✅ |
| RN-AUTH-01, 02, 04, 05, 06, 07, 08 | Sin escenario dedicado | Gap |

## 5. Priorización

- **P1:** RN-AUTH-06 (rate limiting en login — es la puerta de entrada de todo el sistema, no tener ningún límite es más grave que el resto de los hallazgos "P1" de otros módulos por su superficie de exposición).
- **P2:** RN-AUTH-04 (verificar flags de cookie con un test real), RN-AUTH-08 (token expirado).
- **P3:** RN-AUTH-05 (decisión de producto, no de QA), RN-AUTH-07.
- **Acción no relacionada a QA:** actualizar `ARCHITECTURE.md` §6 — el hallazgo de `admin/page.tsx` roto ya no aplica.
