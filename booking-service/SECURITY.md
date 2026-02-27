# NativaGo Booking Service – Seguridad y Autenticación

## Tokens soportados

- **Session JWT**: para usuarios finales, partners y admins.
  - Campos obligatorios:
    - `sub` (string)
    - `role` (`user` | `partner` | `admin` | `service`)
    - `exp` (segundos desde epoch)
    - `iss = "nativago-auth"`
    - `aud = "nativago-services"`
- **Service Token**: para llamadas internas entre microservicios.
  - Si el token del header coincide con `SERVICE_TOKEN`, se acepta como `role = service`.

## Validación JWT

La validación se implementa en [src/lib/auth.ts](src/lib/auth.ts) usando `jose`:

- Verifica:
  - Firma con `AUTH_JWT_SECRET` (HMAC compartido).
  - `exp` (caducidad gestionada por `jose`).
  - `iss = "nativago-auth"`.
  - `aud = "nativago-services"`.
  - `role` ∈ {`user`, `partner`, `admin`, `service`}.

Si el token es exactamente igual a `SERVICE_TOKEN`, se interpreta como llamada interna con:

- `sub = "service"`
- `role = "service"`
- `iss = "nativago-auth"`
- `aud = "nativago-services"`

## Middleware de autenticación y helpers

### middleware.ts (enforcement global en Booking)

El archivo [middleware.ts](middleware.ts) aplica autenticación obligatoria a todos los endpoints `/api` **en este microservicio de Booking**:

- Lee el header `Authorization: Bearer <token>`.
- Verifica el token vía `verifyToken`.
- Si es válido, inyecta en las cabeceras internas:
  - `x-nativago-sub`
  - `x-nativago-role`
  - `x-nativago-iss`
  - `x-nativago-aud`
- Si es inválido o falta, responde `401 Unauthorized`.

> En Booking **no hay endpoints públicos**: todo `/api` requiere token.

### Helpers genéricos (para todos los microservicios)

En [src/lib/auth.ts](src/lib/auth.ts) se exponen helpers reutilizables por otros servicios (Catalog, Partner, Communication):

- `requireAuth(req, { roles? })` – para endpoints privados:
  - Lee `Authorization`.
  - Verifica JWT o `SERVICE_TOKEN`.
  - Opcionalmente aplica control de rol.
  - Devuelve `AuthContext` o un `NextResponse` con `401/403`.
- `allowPublic(req)` – para endpoints **de lectura pública** (p.ej. catálogo):
  - Si no hay token → devuelve `null` (acceso anónimo permitido).
  - Si hay token válido → devuelve `AuthContext` (se puede personalizar respuesta).
  - Si el token es inválido → ignora y devuelve `null`.
- `requireRole(auth, roles)` – cuando ya tienes `AuthContext` (p.ej. via middleware):
  - Valida el rol contra `roles` o `service`.
  - Devuelve `null` si OK o `NextResponse` `403` si no autorizado.

### Matriz de roles (Booking)

Según el requisito:

- Booking Service: `user` | `partner` | `admin`.
- Service tokens (`role = service` o `SERVICE_TOKEN`) siempre se aceptan para llamadas internas.

Aplicación concreta en endpoints:

- `/api/booking` (crear reserva): `user`, `partner`, `admin`, `service`.
- `/api/booking/checkin`: `user`, `partner`, `admin`, `service`.
- `/api/booking/cancel`: `user`, `partner`, `admin`, `service`.
- `/api/booking/reschedule`: `user`, `partner`, `admin`, `service`.
- `/api/booking/[id]` (detalle): `user`, `partner`, `admin`, `service`.
- `/api/booking/user/[id]`: `user`, `partner`, `admin`, `service`.
- `/api/booking/cron`: `admin`, `service`.

> Nota: aunque `assertRoleAllowed` sólo recibe `allowedRoles`, internamente **siempre** acepta `role = service`, por lo que los service tokens pueden invocar cualquier endpoint.

### Matriz de roles por servicio (visión global)

Para todo el ecosistema NativaGo, la matriz de roles prevista es:

- **Catalog**:
  - `GET` públicos (lectura catálogo) → pueden usar `allowPublic`.
  - `POST/PUT` → `requireAuth({ roles: ["admin", "partner"] })`.
- **Partner**:
  - Todo → `requireAuth({ roles: ["admin"] })`.
- **Booking** (este microservicio):
  - `requireAuth({ roles: ["user", "partner", "admin"] })` en todos los endpoints.
- **Communication**:
  - `requireAuth({ roles: ["admin", "service"] })`.

## Variables de entorno

Configurar en el entorno de ejecución del microservicio:

- `AUTH_JWT_SECRET` – clave HMAC para firmar/verificar JWT (`HS256` recomendado).
- `SERVICE_TOKEN` – token estático para llamadas internas entre microservicios.
- `BOOKING_DATABASE_URL` – conexión a PostgreSQL (Neon) con `schema=booking`.

## Interoperabilidad entre microservicios

Todos los microservicios NativaGo deben emitir tokens con:

- `iss = "nativago-auth"`
- `aud = "nativago-services"`

y respetar la matriz de roles por servicio:

- Catalog: `admin` | `partner`.
- Partner: `admin`.
- Booking: `user` | `partner` | `admin`.
- Communication: `service` | `admin`.

Las llamadas internas pueden usar:

- Un JWT con `role = service`.
- O el token estático `SERVICE_TOKEN` como `Bearer <token>`.

Esto evita fugas de seguridad entre servicios y garantiza que sólo emisores autorizados (`nativago-auth`) pueden invocar los microservicios.
