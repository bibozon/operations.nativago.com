# operations.nativago.com

Backoffice SaaS de NativaGo: CMS de operaciones para catálogo (partners, experiencias y slots) sobre una base de datos PostgreSQL Neon **compartida** con el marketplace.

## Arquitectura multi‑servicio (CMS como núcleo)

- **DB única en Neon (PostgreSQL)**, pero separada por **schemas lógicos de servicio**:
	- `catalog.*` → servicio **Catalog** (experiencias, slots, ciudades, categorías)
	- `partner.*` → servicio **Partner** (partners, operators)
	- (opcional) otros schemas para marketplace/transacciones.
- Cada servicio tiene su **propio schema Prisma** y su propio cliente Prisma:
	- Catalog → [prisma/catalog.prisma](Frontend%20backoffice%20ongo/prisma/catalog.prisma)
	- Partner → [prisma/partner.prisma](Frontend%20backoffice%20ongo/prisma/partner.prisma)

### Microservicio Catalog

Definido en [Frontend backoffice ongo/prisma/catalog.prisma](Frontend%20backoffice%20ongo/prisma/catalog.prisma):

- Experience
- ExperienceSlot
- City
- Category

Reglas de integridad clave:

- Una **Experience** siempre referencia un `partnerId` (lógico, del servicio Partner) y opcionalmente `cityId` y `categoryId`.
- Un **ExperienceSlot** siempre referencia una `experience` y su `capacity` debe ser `> 0` (validación en [catalogService](Frontend%20backoffice%20ongo/src/services/catalog/application/catalogService.ts)).
- No se exponen endpoints de borrado de Experience ni de Slot → se evita borrar Experience con Slots.

APIs HTTP internas del servicio Catalog (todas dentro del CMS):

- [GET /api/catalog/experiences](Frontend%20backoffice%20ongo/src/app/api/catalog/experiences/route.ts)
- [GET /api/catalog/experiences/{id}](Frontend%20backoffice%20ongo/src/app/api/catalog/experiences/%5Bid%5D/route.ts)
- [GET /api/catalog/slots](Frontend%20backoffice%20ongo/src/app/api/catalog/slots/route.ts)
- [POST /api/catalog/experience](Frontend%20backoffice%20ongo/src/app/api/catalog/experience/route.ts)
- [PUT /api/catalog/experience](Frontend%20backoffice%20ongo/src/app/api/catalog/experience/route.ts)
- [POST /api/catalog/slot](Frontend%20backoffice%20ongo/src/app/api/catalog/slot/route.ts)

Regla "No permitir Experience sin Partner":

- Se aplica en la capa de aplicación de Catalog (ver `createOrUpdateExperience` en [catalogService](Frontend%20backoffice%20ongo/src/services/catalog/application/catalogService.ts)), donde se exige `partnerId`.
- En un despliegue distribuido, esta función podría llamar al servicio Partner (HTTP interno) para validar la existencia del Partner antes de grabar.

### Microservicio Partner

Definido en [Frontend backoffice ongo/prisma/partner.prisma](Frontend%20backoffice%20ongo/prisma/partner.prisma):

- Partner
- Operator

Reglas clave:

- Un **Operator** siempre referencia un `partnerId` válido.
- No hay API de borrado de Partner, por lo que no se puede borrar un Partner con Experiences asociadas en Catalog (la regla de negocio se respeta no exponiendo delete).

Capa de aplicación de Partner: [Frontend backoffice ongo/src/services/partner/application/partnerService.ts](Frontend%20backoffice%20ongo/src/services/partner/application/partnerService.ts)

APIs HTTP internas del servicio Partner:

- [GET /api/partners](Frontend%20backoffice%20ongo/src/app/api/partners/route.ts)
- [GET /api/partners/{id}](Frontend%20backoffice%20ongo/src/app/api/partners/%5Bid%5D/route.ts)
- [POST /api/partners](Frontend%20backoffice%20ongo/src/app/api/partners/route.ts)
- [PUT /api/partners](Frontend%20backoffice%20ongo/src/app/api/partners/route.ts)

## Conexión a Neon (schemas por servicio)

El CMS usa Prisma contra una única instancia de Neon, pero con **schemas separados** por servicio:

- `CATALOG_DATABASE_URL` → apunta a la misma instancia Neon pero con `schema=catalog` (o usuario con `search_path=catalog`).
- `PARTNER_DATABASE_URL` → apunta a la misma instancia Neon pero con `schema=partner`.

Pasos recomendados:

1. Crear la base de datos en Neon (si no existe ya para el marketplace).
2. Configurar `DATABASE_URL` en:
	- entorno local (`.env` dentro de `Frontend backoffice ongo`)
	- proyecto Vercel del CMS (Environment Variables).
3. Ejecutar migraciones Prisma por servicio desde el CMS:
	```bash
	cd "Frontend backoffice ongo"
	npm run prisma:migrate:catalog
	npm run prisma:migrate:partner
	```

## CMS: responsabilidades de escritura/lectura

El CMS sólo **escribe**:

- Partner operativo (Operator/Agency, según el flujo que se diseñe)
- Experience (catálogo)
- ExperienceSlot (slots/cupos de experiencias)

El CMS sólo **lee** (read‑only):

- Booking
- BookingEvent
- Review
- Communication

Esto se refleja en las rutas API:

- Catálogo (escritura desde CMS):
  - [Frontend backoffice ongo/src/app/api/experiences/route.ts](Frontend%20backoffice%20ongo/src/app/api/experiences/route.ts)
  - [Frontend backoffice ongo/src/app/api/experience-slots/route.ts](Frontend%20backoffice%20ongo/src/app/api/experience-slots/route.ts)
- Transaccional (sólo lectura desde CMS):
  - [Frontend backoffice ongo/src/app/api/bookings/route.ts](Frontend%20backoffice%20ongo/src/app/api/bookings/route.ts) (no crea ni actualiza)
  - [Frontend backoffice ongo/src/app/api/bookings/[id]/start/route.ts](Frontend%20backoffice%20ongo/src/app/api/bookings/%5Bid%5D/start/route.ts) devuelve 405 para evitar modificar bookings desde el CMS.

## Panel de reservas del operador (lectura consistente)

La pantalla del operador en:

- [Frontend backoffice ongo/src/app/[locale]/(operator)/bookings/page.tsx](Frontend%20backoffice%20ongo/src/app/%5Blocale%5D/(operator)/bookings/page.tsx)

consume la API de bookings y muestra, por cada reserva del marketplace:

- `cliente` / `clienteEmail` (User/Booking)
- `experiencia` (Experience)
- `fecha` (inicio de la reserva)
- `estado` (estado de Booking)
- `arrival_at`
- `deadline`
- `monto_85` (campo `amountToCollect` = 85% que debe cobrar el operador offline)
- `comunicaciones` (lista de Communications asociadas)

La API correspondiente:

- [Frontend backoffice ongo/src/app/api/bookings/route.ts](Frontend%20backoffice%20ongo/src/app/api/bookings/route.ts)

utiliza Prisma para hacer joins con `User`, `Experience`, `ExperienceSlot` y `Communication`, y devuelve un DTO especializado para el panel (`cliente`, `experiencia`, `monto_85`, `comunicaciones`, etc.).

## Proyecto Next.js (CMS)

Directorio: `Frontend backoffice ongo/`.

### Requisitos previos

- Node.js 18+ y npm.
- Cuenta en Vercel (para despliegues en la nube).
- Base de datos Neon compartida con el marketplace.

### Instalación y ejecución local

1. Instalar dependencias:
	```bash
	cd "Frontend backoffice ongo"
	npm install
	```
2. Configurar entorno (`.env` en `Frontend backoffice ongo`):
	```env
	DATABASE_URL=postgresql://... # misma URL que el marketplace
	JWT_SECRET=...                # secreto para login en el CMS
	```
3. Ejecutar migraciones (si el schema del CMS es la fuente de verdad):
	```bash
	npx prisma migrate dev
	```
4. Ejecutar en desarrollo:
	```bash
	npm run dev
	```
5. Abrir en el navegador:
	- http://localhost:3000/es

### Despliegue del CMS en Vercel

1. Crear un proyecto en Vercel apuntando a este repositorio.
2. En *Root Directory* del proyecto, usar:
	```
	Frontend backoffice ongo
	```
3. Framework preset: `Next.js`.
4. Build command por defecto (`npm run build`) y output `.next`.
5. Definir las variables de entorno:
	- `DATABASE_URL` (misma Neon que marketplace)
	- `JWT_SECRET`

Con esto, el CMS y el marketplace comparten una única base de datos Neon, con responsabilidades bien separadas (catálogo vs. transacciones) y sin duplicar ni modificar datos transaccionales desde el backoffice.
