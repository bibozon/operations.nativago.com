# NativaGo Booking Service

Microservicio de reservas de NativaGo basado en Next.js 14 (App Router) + Prisma + PostgreSQL Neon.

## Rol del servicio

- Gestionar reservas de NativaGo como **fuente de verdad transaccional** para:
  - `Booking`
  - `BookingEvent`
- Consumido por:
  - marketplace (web/app de clientes)
  - operations.nativago.com (CMS de operaciones)

## Infraestructura

- Next.js 14 (App Router, serverless en Vercel Pro).
- PostgreSQL Neon.
- Prisma ORM, con schema exclusivo `booking.*`.

## Esquema Prisma

Archivo: `prisma/booking.prisma`.

Entidades principales:

- `Booking`
  - `id`, `userId`, `experienceId`, `slotId` (referencias lógicas a otros servicios)
  - `status` (enum `BookingStatus`)
  - `startAt`, `arrivalAt`, `deadline` (regla NativaGo: arrivalAt = startAt - 30m, deadline = startAt + 30m)
  - `durationMinutes`
  - `checkedInAt`
  - `createdAt`, `updatedAt`
- `BookingEvent`
  - `id`, `bookingId`
  - `type` (enum `BookingEventType`, incluye CREATED, CHECKIN, CANCELLED, RESCHEDULED, AUTO_CANCELLED, AUTO_COMPLETED)
  - `payload` (JSON opcional)
  - `createdAt`

Config DB:

- `BOOKING_DATABASE_URL` debe apuntar a Neon con el schema `booking` (por ejemplo `...?schema=booking`).

## Cliente Prisma

- Cliente centralizado en `src/lib/db/client.ts`.
- Scripts en `package.json`:
  - `npm run prisma:generate`
  - `npm run prisma:migrate`
  - `npm run prisma:studio`

## APIs HTTP

### Crear y leer reservas

- `POST /api/booking`
  - Crea una reserva aplicando las reglas NativaGo:
    - `arrival_at = start_at - 30m`
    - `deadline = start_at + 30m`
  - Ejecuta una transacción Prisma:
    - (TODO) validar slot contra Catalog Service
    - crear `Booking`
    - crear `BookingEvent` de tipo `CREATED`.
- `GET /api/booking/{id}`
  - Devuelve booking + events.
- `GET /api/booking/user/{id}`
  - Devuelve todas las reservas de un usuario.

### Checkin / Cancel / Reschedule

- `POST /api/booking/checkin`
  - Body: `{ bookingId }`.
  - Marca la reserva como `CHECKED_IN` y guarda `checkedInAt`.
  - Crea `BookingEvent` de tipo `CHECKIN`.
- `POST /api/booking/cancel`
  - Body: `{ bookingId, reason? }`.
  - Marca la reserva como `CANCELLED`.
  - Crea `BookingEvent` de tipo `CANCELLED` con `payload.reason` opcional.
- `POST /api/booking/reschedule`
  - Body: `{ bookingId, startAt, durationMinutes? }`.
  - Recalcula `startAt`, `arrivalAt` y `deadline` siguiendo las reglas de 30m antes/después.
  - Opcionalmente actualiza `durationMinutes`.
  - Crea `BookingEvent` de tipo `RESCHEDULED`.

Todas las rutas están marcadas como `dynamic = "force-dynamic"` para ejecutarse sólo en runtime (ideal para serverless en Vercel).

## Cron (auto-cancel y auto-complete)

Ruta dedicada para ser llamada por **Vercel Cron** u otro scheduler:

- `POST /api/booking/cron`
  - Auto-cancel `no_start`:
    - Busca reservas con `status = CONFIRMED`, `checkedInAt = null` y `deadline < now`.
    - Las marca como `CANCELLED`.
    - Registra eventos `AUTO_CANCELLED` (simplificado en esta versión; se podría refinar por booking).
  - Auto-complete por duración:
    - Encuentra reservas con `status = CHECKED_IN`.
    - Calcula `endTime = startAt + durationMinutes`.
    - Si `endTime <= now`, marca la reserva como `COMPLETED` y crea un evento `AUTO_COMPLETED`.

Respuesta JSON:

```json
{
  "autoCancelled": 10,
  "autoCompleted": 5,
  "runAt": "2026-02-26T12:34:56.000Z"
}
```

## Puesta en marcha local

1. Instalar dependencias:

```bash
cd booking-service
npm install
```

2. Configurar `.env` en `booking-service/`:

```env
BOOKING_DATABASE_URL=postgresql://user:password@host/db?schema=booking
```

3. Ejecutar migraciones Prisma:

```bash
npm run prisma:migrate
```

4. Levantar el servicio en desarrollo:

```bash
npm run dev
```

El servicio quedará disponible en `http://localhost:3000` y las APIs en `http://localhost:3000/api/booking/...`.

## Despliegue en Vercel

1. Crear un nuevo proyecto en Vercel apuntando al directorio `booking-service`.
2. Framework preset: `Next.js`.
3. Comando de build por defecto: `npm run build`.
4. Definir variables de entorno:
   - `BOOKING_DATABASE_URL` (Neon con schema booking).
5. Configurar un **Vercel Cron Job** apuntando a `POST /api/booking/cron` para ejecutar el auto-cancel/auto-complete con la frecuencia deseada.

Con esto, `booking-service` queda como microservicio independiente, listo para ser consumido por el marketplace y el CMS de operaciones.
