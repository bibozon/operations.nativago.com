## NativaGo Operations CMS Backend

This project is the operations CMS backend for NativaGo, built with Next.js App Router, TypeScript, Prisma, PostgreSQL (Neon), Tailwind CSS, and serverless API routes.

It powers:

- Operators
- Experiences
- Categories
- Cities
- Availability calendar (slots)

The public marketplace (nativago.com) consumes the public catalog API exposed by this service.

## Tech Stack

- Next.js App Router (TypeScript)
- Prisma ORM + PostgreSQL (Neon)
- Tailwind CSS
- Serverless API routes on Vercel

## Project Structure

- src/lib/db.ts – Prisma client
- src/services/catalog – catalog and CMS domain services
- src/app/api/catalog – public + CMS API routes
- prisma/schema.prisma – database schema
- prisma/seed.js – development seed data

## Environment Configuration

## Recent Updates

**2026-02-27:**
- Updated minimal Next.js configuration in package.json for Vercel compatibility.
- Ensured App Router structure and serverless Prisma client pattern.
- Project ready for Vercel deployment and automatic Next.js detection.

Set the database connection string (for Neon) in an environment file, for example .env.local:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require"
```

On Vercel, configure the same DATABASE_URL in the project Environment Variables.

If DATABASE_URL is not set at runtime, the CMS will fail fast with the error:

"DATABASE_URL not configured for NativaGo CMS"

## Database Migrations & Seed

After configuring DATABASE_URL, run:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

This will create the schema and populate:

- Categories: Buceo, Aventura, Cultura
- Cities: Cartagena, Santa Marta, San Andres
- Operators: Ocean Divers, Caribe Tours
- Experiences: Buceo en arrecife, Tour islas del Rosario, Caminata Tayrona
- Availability slots: next 7 days for each experience

## Public Catalog API (for marketplace)

All endpoints are under /api/catalog:

- GET /api/catalog/categories
- GET /api/catalog/cities
- GET /api/catalog/experiences
- GET /api/catalog/experiences/[id]
- GET /api/catalog/experiences?city=
- GET /api/catalog/experiences?featured=true
- GET /api/catalog/slots?experience=

Responses are shaped for marketplace cards, including category, city, and operator info.

## CMS CRUD API (private)

- POST /api/catalog/category
- POST /api/catalog/city
- POST /api/catalog/operator
- POST /api/catalog/experience
- PUT /api/catalog/experience
- POST /api/catalog/slot

Add authentication/authorization (e.g. middleware) before exposing these endpoints publicly.

## Experience Types: Group and Exclusive (via Slot Capacity)

NativaGo CMS supports both group and exclusive/private experiences using only the `capacity` field in the `AvailabilitySlot` model:

- **Group experience:** `capacity > 1` (multiple participants can book the same slot)
- **Exclusive/private experience:** `capacity = 1` (only one booking allowed for that slot)

No additional type field is needed. The slot's `capacity` determines if the session is shared or exclusive.

**Examples:**

- Boat tour: `capacity 12` (group)
- Diving: `capacity 4` (group)
- Private boat: `capacity 1` (exclusive)

When a user books N participants, the slot's remaining capacity is reduced accordingly. Once capacity reaches 0, the slot is fully booked.

> This logic is enforced in the backend and reflected in the API responses for `/api/catalog/slots?experience=`.

## Local Development


## Test Users for Access

**Super Admin:**

- Email: admin@nativago.com
- Password: nativago123
- Role: SUPERADMIN

**Operator Agency:**
- Email: agency@nativago.com
- Password: nativago123
- Role: OPERATOR_AGENCY

**Operator Freelance:**
- Email: freelance@nativago.com
- Password: nativago123
- Role: OPERATOR_FREELANCE

**Operator Entities:**
- Ocean Divers (user: freelance@nativago.com)
- Caribe Tours (user: agency@nativago.com)

> These accounts are for development/testing only. Replace with official data before production.

---

Start the dev server:

```bash
npm run dev
```

By default the app runs on http://localhost:3000 (or the next available port).

## Deployment on Vercel

- Push this repository to GitHub/GitLab/Bitbucket.
- Import the project in Vercel.
- Set DATABASE_URL in the Vercel project settings.
- Vercel will run npm run build during deployment.

Run migrations (e.g. via prisma migrate deploy or a one-off job) against your Neon database before first production use.
