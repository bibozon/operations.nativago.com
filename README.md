# operations.nativago.com

Backoffice de NativaGo: panel web (Next.js) con APIs internas para gestionar experiencias, reservas, productos y operaciones.

## Estructura del repositorio

- `Frontend backoffice ongo/`: backoffice completo en Next.js/React con APIs internas.

## Requisitos previos

- Node.js 18+ y npm.
- Cuenta en Vercel (para despliegues en la nube).

---

## Frontend + API interna: Frontend backoffice ongo (Next.js)

Directorio: `Frontend backoffice ongo/`.

### Instalación y ejecución local (no requiere backend Python)

1. Instalar dependencias:
	```bash
	cd "Frontend backoffice ongo"
	npm install
	```
2. Ejecutar en desarrollo:
	```bash
	npm run dev
	```
3. Abrir en el navegador:
	- http://localhost:3000/

### Estructura principal

- `src/app/(auth)/login/page.tsx`: pantalla de login.
- `src/app/(dashboard)/layout.tsx`: layout general del dashboard.
- `src/app/(dashboard)/bookings|products|services/page.tsx`: pantallas de reservas, productos y servicios.
- `src/lib/*.ts`: clientes de API que consumen las rutas internas `/api/*`.
- `src/theme.ts` y `src/app/globals.css`: estilos globales y tema visual.

### Rutas de API internas principales

- `src/app/api/auth/login/route.ts`: login de super admin (demo).
- `src/app/api/bookings/route.ts`: listado de reservas de ejemplo.
- `src/app/api/nativago/products/route.ts`: productos provenientes de Nativago (mock).
- `src/app/api/experiences/route.ts` y `src/app/api/experiences/[id]/route.ts`: CRUD básico de servicios en memoria.

### Despliegue del frontend en Vercel

1. Crea **otro proyecto** en Vercel apuntando al mismo repositorio.
2. En *Root Directory* de este proyecto, usa:
	```
	Frontend backoffice ongo
	```
3. Framework preset: `Next.js`.
4. Build command por defecto (`npm run build`) y output `.next` (configuración estándar de Next).
5. No es obligatorio definir `NEXT_PUBLIC_API_BASE_URL`; si no existe, el frontend usará el mismo dominio (`/api/*`).

---

## Notas adicionales

- Para cambios grandes, se recomienda crear ramas (`feature/...`) y luego hacer pull request a `main`.
- Ante errores 404 en Vercel, revisar que el proyecto tenga configurado correctamente el *Root Directory* (`Frontend backoffice ongo`).
