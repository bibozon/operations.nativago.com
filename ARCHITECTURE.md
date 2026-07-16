# NativaGo — Documento de Arquitectura

**Última actualización:** 2026-07-12
**Alcance:** CMS (`operations.nativago.com`, este repo) + Marketplace (`nativago-mvp`, repo separado)

---

## 1. Resumen ejecutivo

NativaGo son dos aplicaciones Next.js independientes que juntas forman una plataforma de turismo multi-país (hoy: Colombia y Brasil):

- **CMS** (`Proyecto_ongo_v1`) — dueño de los datos. Expone `/api/catalog/*` como API pública de catálogo. Panel admin para operadores turísticos y SUPERADMIN.
- **Marketplace** (`nativago-mvp`) — cara al público. Consume el catálogo del CMS **y además** tiene su propio sistema completo de operadores/experiencias/reservas (registro directo, sin pasar por el CMS). Ambas fuentes se muestran mezcladas al visitante final.

Esta convivencia de dos fuentes de catálogo no es un error de diseño — es una decisión de producto confirmada: el marketplace nació como MVP autónomo (auth, reservas, QR, WhatsApp) antes de que existiera el CMS, y el CMS se sumó después como catálogo curado adicional.

Durante julio de 2026 se rediseñó ambos sistemas para soportar múltiples países sin lógica `if country == X` hardcodeada. Este documento describe el estado resultante, qué falta, y qué se sugiere para lo que sigue.

---

## 2. Arquitectura general

```
                    ┌─────────────────────────┐
                    │   nativago.com (apex)    │   ← Fase 6: pendiente
                    │  landing + selector país │
                    └────────────┬────────────┘
                                 │ redirige a
              ┌──────────────────┼──────────────────┐
              ▼                                      ▼
   co.nativago.com                         br.nativago.com   ← Fase 2: pendiente
              │                                      │
              └──────────────────┬───────────────────┘
                                  │  (hoy: un solo dominio,
                                  │   país resuelto por cookie/query/geo)
                    ┌─────────────▼─────────────┐
                    │   MARKETPLACE (nativago-mvp) │
                    │   Next.js 16 + Turbopack     │
                    │   proxy.ts resuelve país      │
                    │   Prisma propio (Postgres)    │
                    └──────┬──────────────┬────────┘
                           │              │
              consume vía  │              │  lee/escribe directo
              cmsClient.ts │              │  (operadores locales,
                           │              │   bookings, favoritos...)
                           ▼              ▼
              ┌──────────────────┐   ┌──────────────────┐
              │   CMS (Proyecto_  │   │  DB local del      │
              │   ongo_v1)        │   │  marketplace        │
              │   /api/catalog/*  │   │  (Postgres, propia)  │
              │   Prisma propio    │   └──────────────────┘
              │   (Postgres, Neon) │
              └──────────────────┘
```

Dos bases de datos Postgres **completamente separadas**, cada una con su propio Prisma schema. No comparten conexión ni transacciones — la consistencia entre ambas es eventual, vía HTTP (`fetch` a `/api/catalog/*`).

---

## 3. CMS (`Proyecto_ongo_v1`)

### 3.1 Stack
Next.js 14 (App Router) · Prisma 5 · PostgreSQL (Neon) · JWT en cookie httpOnly para auth.

### 3.2 Capas (Clean Architecture, introducidas julio 2026)

```
src/
  domain/
    entities/        Experience.ts, Money.ts
    repositories/     ExperienceRepository.ts, CategoryRepository.ts,
                       CityRepository.ts, SlotRepository.ts   (interfaces)
    services/          PaymentProvider.ts                      (interface)
  infrastructure/
    persistence/prisma/  PrismaExperienceRepository.ts, PrismaCategoryRepository.ts,
                          PrismaCityRepository.ts, PrismaSlotRepository.ts,
                          countryLookup.ts, mappers/experienceMapper.ts
    payments/             StripeProvider.ts, PaymentProviderRegistry.ts
  services/catalog/      capa de aplicación delgada — resuelve countryCode → countryId
                          y delega a los repositorios. Mantiene las firmas de función
                          que ya consumían las API routes (cero breaking changes).
  app/                  Next.js App Router — páginas y route handlers
```

**Regla de aislamiento por país:** todo método de repositorio recibe `countryId: string | null` como primer parámetro. `null` solo es válido para el catálogo público sin filtrar (comportamiento legacy, antes de que existiera Country); en cualquier operación de escritura (crear/editar operador o experiencia) el `countryId` se **deriva del lado del servidor** (nunca se acepta del cliente) y una ciudad de otro país es rechazada explícitamente.

### 3.3 Modelo de datos

**Multi-país (agregado julio 2026):** `Country`, `Currency`, `Language`, `Timezone`, `Region`, `PaymentProvider`, `CountryPaymentProvider`, `DocumentType` + `OperatorDocument`, `CategoryTranslation` + `CountryCategory`.

**Negocio:** `User` (id `Int`, legacy), `Operator`, `City`, `Category`, `Experience`, `Slot` (☠️ no usado, ver §6), `AvailabilitySlot`, `Booking` (id `Int`, legacy).

8 modelos tienen `countryId`: `City`, `Operator`, `Experience`, `Booking`, `Region`, `CountryCategory`, `DocumentType`, `CountryPaymentProvider`. Backfill inicial: **5 experiencias en CO, 6 en BR**, cero nulos.

**Decisión clave — Category es taxonomía global:** "Aventura" no se duplica por país. `CountryCategory` controla qué categorías están habilitadas y en qué orden por país (tabla lista, todavía no consumida por `listCategories()` — ver §6).

**Decisión clave — documentos de verificación son datos, no columnas:** `DocumentType` (por país: RNT en CO, CNPJ/CPF/CADASTUR en BR) + `OperatorDocument`. Las columnas viejas `cnpj`/`cpf`/`cadastur` en `Operator` siguen ahí por compatibilidad (no se migraron datos existentes todavía — ver §6).

### 3.4 Auth y roles
JWT en cookie `auth`. Roles: `SUPERADMIN` (sin restricción de país — es staff de plataforma), `OPERATOR_AGENCY`, `OPERATOR_FREELANCE` (siempre atados a exactamente un país vía `operator.countryId`). `requireOperatorContext()` centraliza el lookup del operador autenticado.

### 3.5 API pública de catálogo
`GET /api/catalog/experiences` (filtros: `city`, `category`, `page`, `limit`, **`country`**), `GET /api/catalog/experiences/[id]` (acepta `?country=`), `GET /api/catalog/categories` (global, no filtra), `GET /api/catalog/cities` (acepta `?country=`), `GET /api/catalog/slots?experience=:id`.

### 3.6 Pagos
`PaymentProviderRegistry` resuelve el proveedor activo por país leyendo `CountryPaymentProvider` (tabla en DB). `StripeProvider` es el único implementado hoy (envuelve el Stripe que ya existía, sin `currency: 'brl'` fijo — ahora usa `Country.defaultCurrency`). Wompi y Mercado Pago están **registrados** en la tabla (`isActive: false`, sin credenciales) pero sin clase adapter todavía en el CMS.

---

## 4. Marketplace (`nativago-mvp`)

### 4.1 Stack
Next.js 16.2 (Turbopack) · Prisma propio · PostgreSQL · sesión por cookie (no JWT).

### 4.2 Ruteo por país — `src/proxy.ts`
Next.js 16 renombró `middleware.ts` a `proxy.ts` (export debe llamarse `proxy`, no `default` ni `middleware` — nos costó una vuelta descubrirlo en vivo). Resuelve país en este orden: subdominio (`co.nativago.com`) → query `?country=` → cookie `nativago_country` → geo de Vercel (`x-vercel-ip-country`) → default `co`. Setea `x-country-code` en la respuesta y persiste la cookie 30 días.

**Excepción importante:** el proxy **excluye rutas `/api/*`** de la detección de país (a propósito, para no interceptar cada llamada de API). Los route handlers que necesitan el país del visitante deben usar `getCountryCodeFromRequest(req)` (lee la cookie directo del `NextRequest`), no `getCountryCode()` (que depende del header que las API routes nunca reciben). Ya se corrigió en las rutas de checkout/bookings; **cualquier ruta `/api/*` nueva que necesite el país debe recordar esto**.

### 4.3 Config por país
`src/lib/country/countryConfig.ts` — objeto estático `COUNTRY_CONFIGS` con 6 países (`co`, `br` activos; `mx`, `cl`, `ar`, `pe` con `active: false`, listos para activarse con datos, sin tocar código). Diseño **code-config** en vez de DB-driven (a diferencia del CMS) — más simple para el marketplace, coherente porque el marketplace no tiene un panel admin de configuración de países.

### 4.4 Fuente dual de catálogo — `src/lib/cmsClient.ts`
`fetchExperiences()` combina en paralelo (`Promise.all`) el catálogo del CMS (filtrado por `?country=`) **y** las experiencias creadas localmente por operadores auto-registrados (filtradas por `countryCode` en la DB local). Antes de julio 2026 la fuente local solo se usaba como fallback si el CMS estaba caído — eso significaba que ningún operador auto-registrado aparecía nunca en el sitio público. Corregido.

### 4.5 Modelo de datos local
`Country`, `City` (con `countryCode`), `User`, `Operator` (con `countryCode`, `registryNumber` genérico + `rntNumber` legacy), `Experience` (con `countryCode` + `currency`), `Booking`, `Favorite`, `PublicBooking` (reservas contra experiencias del CMS — con `countryCode` + `currency` propios), `SupportTicket`.

### 4.6 Pagos
`src/lib/payments/` — interfaz `PaymentProvider` (`createIntent`/`getStatus`/`handleWebhook`) + `WompiProvider` (CO) + `PixProvider` vía Mercado Pago (BR), seleccionados por `getPaymentProvider(countryCode)`. **Sin credenciales configuradas todavía** (`WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `MERCADOPAGO_ACCESS_TOKEN_BR` vacías) — el código existe pero no se ha probado contra las pasarelas reales. El flujo de pago hoy en producción es manual/WhatsApp-coordinado (`PLATFORM_WHATSAPP`), no automatizado.

### 4.7 i18n
`src/lib/i18n/LanguageContext.tsx` — client-only, `localStorage`, sin SSR ni ruteo por URL. 4 idiomas (es/en/fr/pt) pero es una lista de claves manual, no `next-intl`. **No se reemplazó** en esta ronda (ver §7).

---

## 5. Estado de la arquitectura multi-país (resumen por fase)

| Fase | Qué es | Estado |
|---|---|---|
| 0 — Fundaciones DB | Tablas `Country`/`Currency`/`Language`/etc., backfill | ✅ Hecho (CMS). Marketplace ya las tenía. |
| 1 — Capa de servicios + pagos | `domain/`/`infrastructure/`, `PaymentProvider` interface | ✅ Hecho (CMS). Marketplace ya la tenía (`lib/payments/`). |
| 2 — Subdominios reales | `co.nativago.com`, `br.nativago.com` en Vercel | ⚠️ Código listo (`proxy.ts`), **dominios no comprados/configurados** |
| 3 — Aislamiento por operador (CMS) | Un operador no administra otro país | ✅ Hecho — verificado contra datos reales |
| 3b — Ruta/switcher `[country]` en CMS | SUPERADMIN cambia de país visualmente | ❌ No implementado — el aislamiento es real pero no hay UI para "entrar como país X" |
| 4 — Moneda real | Sin `"R $"`/`'es-CO'` fijo | ✅ Hecho en ambos — barrido completo, 0 ocurrencias restantes (excepto script de seed de dev) |
| 4b — i18n real (next-intl) | Reemplazar `LanguageContext` ad hoc | ❌ No implementado |
| 5 — Pagos reales por país | Credenciales Wompi/Mercado Pago/Pix | ❌ Bloqueado — necesita que el usuario provea credenciales |
| 6 — Landing global `nativago.com` | Detección de país + selector | ❌ No implementado |
| 7 — Limpieza | Borrar columnas/campos legacy ya migrados | ❌ No iniciado |

---

## 6. Deuda técnica conocida (no resuelta, documentada a propósito)

### CMS
- **`src/app/admin/page.tsx` está roto de fondo:** hace `fetch('/api/auth/me')` pero esa ruta **no existe** (`src/app/api/auth/` solo tiene `login` y `logout`). Además usa tipos obsoletos (`Experience.id: number`, campo `featured` que ya no existe en el schema). Es anterior a todo el trabajo de esta sesión — nunca funcionó del todo.
- **Dos UIs paralelas para crear experiencias:** `admin/new/page.tsx` (client component + `/api/catalog/experience`) y `admin/experiences/new/page.tsx` (server action). Ambas funcionan y ambas están protegidas por el aislamiento de país, pero es redundancia — deberían unificarse.
- **Modelo `Slot` sin usar:** todo el código real usa `AvailabilitySlot`. `Slot` (con `time: String`) parece un diseño anterior abandonado. Candidato a eliminar del schema (requiere migración).
- **`eslint` no está instalado** pese a existir `eslint.config.mjs` — no hay script `lint`, el linter nunca corre.
- Varias funciones de servicio muertas (nunca importadas): `createCity`, `createCategory`, `updateCategory`, `deleteCategory`, `deleteOperatorIfUnused`, `deleteCityIfUnused`, `deleteCategoryIfUnused`.
- `CountryCategory` (habilitar/ordenar categorías por país) está en el schema y sembrada, pero `listCategories()` todavía devuelve todo sin filtrar por país.
- Columnas legacy `cnpj`/`cpf`/`cadastur` en `Operator` conviven con el nuevo `OperatorDocument` — no se migraron datos existentes.
- El campo `capacity` que el operador llena en el form de creación de experiencia se descarta silenciosamente (`createExperience` no lo acepta) — gap preexistente, no introducido esta sesión.

### Marketplace
- **`api/stripe-webhook/route.ts` es código muerto:** no existe ningún `stripe.checkout.sessions.create()` en el código que dispare ese webhook. Existe pero nunca se ejecuta con el flujo actual.
- **Reportes agregados mezclan monedas:** `admin-dashboard/ventas/page.tsx` suma `totalPrice`/`depositPrice` de reservas de todos los países sin convertir — se agregó una advertencia visible en la UI, pero la cifra en sí no es correcta financieramente con más de un país activo. Arreglarlo de verdad requiere tasas de cambio o desglosar por moneda (decisión de producto).
- **Fuente de la moneda al reservar es el país del *visitante*, no de la *experiencia*:** `getCountryCodeFromRequest()`/`getCountryCode()` resuelven el país de quien navega, no el país real de la experiencia que se está reservando. Bajo navegación normal esto coincide siempre (el catálogo ya viene filtrado por país), pero un link directo/bookmark a una experiencia de otro país podría crear una reserva con la moneda equivocada. Ver §7 para la corrección sugerida.
- `LanguageContext` sigue siendo client-only/`localStorage`, no SSR, no atado a `Country.defaultLanguage`.
- Credenciales de Wompi/Mercado Pago vacías — el código de pago real nunca se ha ejecutado contra las pasarelas.
- `api/dev/seed/route.ts` sigue con `'es-CO'` hardcodeado (script de desarrollo, no user-facing — dejado a propósito).

---

## 7. Mejoras sugeridas (priorizadas)

**Alta prioridad — correctitud:**
1. Cambiar la fuente de la moneda al reservar: derivar de `experience.currency`/`experience.countryCode` en vez del país del visitante. Cierra el gap de "link directo a experiencia de otro país" mencionado arriba.
2. Arreglar o eliminar `src/app/admin/page.tsx` en el CMS (está roto de fondo, no relacionado a esta ronda de trabajo).
3. Instalar `eslint` en el CMS y correr un pase de lint — hoy no hay ninguna verificación de estilo/errores comunes corriendo.

**Media prioridad — completar lo empezado:**
4. Reemplazar `LanguageContext` por `next-intl` en el marketplace (Fase 4b) — habilita locale por URL/dominio de verdad, SSR-safe.
5. Conectar `CountryCategory` a `listCategories()` en el CMS para que la curación de categorías por país (ya modelada) tenga efecto real.
6. Migrar datos de `cnpj`/`cpf`/`cadastur` a `OperatorDocument` y luego eliminar las columnas legacy (Fase 7 del plan).
7. Unificar las dos UIs de creación de experiencia en el CMS.

**Baja prioridad — cuando haya prerequisitos externos:**
8. Comprar/configurar `co.nativago.com` y `br.nativago.com` en Vercel (Fase 2) — el código ya está listo, es un paso de infraestructura, no de código.
9. Conseguir credenciales de Wompi y Mercado Pago, implementar los adapters equivalentes en el CMS (`WompiProvider`/`MercadoPagoProvider` implementando `PaymentProvider`) y activar `CountryPaymentProvider.isActive` (Fase 5).
10. Construir la landing global `nativago.com` con detección de país (Fase 6).
11. Agregar un selector de país visible para SUPERADMIN en el CMS (hoy el aislamiento es real pero invisible en la UI).

**Estructural, sin urgencia:**
12. Eliminar el modelo `Slot` (no usado) del schema del CMS.
13. Decidir el destino de `booking-service`/`communication-service` (microservicios planeados, con su propio `package.json`, nunca desplegados) — completarlos o retirarlos del repo.
14. Definir una estrategia real para reportes financieros multi-moneda (conversión vs. desglose) antes de que el marketplace tenga volumen relevante en más de un país.

---

## 8. Cómo verificar el estado actual

- `npx tsc --noEmit` limpio en ambos proyectos (CMS y marketplace) es la señal mínima de que nada está roto.
- CMS: `node prisma/backfill-country.js` es idempotente — correrlo de nuevo debe reportar 0 actualizaciones si ya se corrió antes.
- Marketplace: no hay `DATABASE_URL` de Postgres accesible desde este entorno de desarrollo — la migración/seed local (`prisma/seed.ts`, con 15 ciudades CO + 10 BR) está escrita pero no se ha ejecutado contra una base real desde acá.
- Plan de arquitectura completo (fases 0-7, contexto de cada decisión): `C:\Users\Usuario\.claude\plans\cozy-sniffing-plum.md`.
