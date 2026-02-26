# operations.nativago.com

Backoffice de NativaGo: API de operaciones (FastAPI) y panel web (Next.js) para gestionar experiencias, reservas, operadores, notificaciones, finanzas y auditoría.

## Estructura del repositorio

- `operations_nativago/`: backend en FastAPI (API de operaciones).
- `Frontend backoffice ongo/`: frontend del backoffice en Next.js/React.
- `.venv`, `.venv-1`: entornos virtuales locales de Python (ignorados en Git).

## Requisitos previos

- Python 3.10+ (recomendado usar entorno virtual).
- Node.js 18+ y npm (para el frontend).
- Cuenta en Vercel (para despliegues en la nube).

---

## Backend: operations_nativago (FastAPI)

Directorio: `operations_nativago/`.

### Instalación y ejecución local

1. Crear/activar entorno virtual (opcional pero recomendado):
	```bash
	python -m venv .venv
	source .venv/bin/activate        # Linux / macOS
	# En Windows PowerShell
	.venv\\Scripts\\Activate.ps1
	```
2. Instalar dependencias:
	```bash
	cd operations_nativago
	pip install -r requirements.txt
	```
3. Ejecutar el servidor de desarrollo:
	```bash
	uvicorn main:app --reload
	```
4. Abrir en el navegador:
	- API raíz: http://localhost:8000/
	- Documentación interactiva: http://localhost:8000/docs

### Estructura principal del backend

- `main.py`: punto de entrada de la API (`FastAPI`), configuración de CORS y registro de routers.
- `routers/`: rutas organizadas por dominio (auth, users, dashboard, experiences, reservations, operators, notifications, finance, audit).
- `models/`: modelos de datos (Pydantic y SQLAlchemy).
- `services/`: lógica de negocio, acceso a base de datos, integración con APIs externas y autenticación.
- `api/index.py`: handler que expone `app` para despliegue en Vercel.
- `vercel.json`: configuración de Vercel para desplegar la API como función serverless.

### Despliegue del backend en Vercel

1. Conecta el repositorio en Vercel.
2. En *Settings → General → Root Directory* del proyecto de API, pon:
	```
	operations_nativago
	```
3. En *Build & Development Settings*:
	- Framework preset: `Other`.
	- Build Command: vacío.
	- Output directory: vacío.
4. Guarda y despliega. Vercel usará `vercel.json` y expondrá la API en:
	- `/` → mensaje "API NativaGo Backoffice funcionando".
	- `/docs` → documentación automática de FastAPI.

---

## Frontend: Frontend backoffice ongo (Next.js)

Directorio: `Frontend backoffice ongo/`.

### Instalación y ejecución local

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

### Estructura principal del frontend

- `src/app/(auth)/login/page.tsx`: pantalla de login.
- `src/app/(dashboard)/layout.tsx`: layout general del dashboard.
- `src/app/(dashboard)/bookings|products|services/page.tsx`: pantallas de reservas, productos y servicios.
- `src/lib/*.ts`: clientes de API para comunicarse con el backend (bookings, products, services, etc.).
- `src/theme.ts` y `src/app/globals.css`: estilos globales y tema visual.

### Despliegue del frontend en Vercel

1. Crea **otro proyecto** en Vercel apuntando al mismo repositorio.
2. En *Root Directory* de este proyecto, usa:
	```
	Frontend backoffice ongo
	```
3. Framework preset: `Next.js`.
4. Build command por defecto (`npm run build`) y output `.next` (configuración estándar de Next).
5. Configura variables de entorno necesarias (por ejemplo, URL de la API de backend) en *Settings → Environment Variables*.

---

## Notas adicionales

- No subir `.venv`, `.venv-1` ni `__pycache__` al repositorio (ya están en `.gitignore`).
- Para cambios grandes, se recomienda crear ramas (`feature/...`) y luego hacer pull request a `main`.
- Ante errores 404 en Vercel, revisar que el proyecto tenga configurado correctamente el *Root Directory* (backend: `operations_nativago`, frontend: `Frontend backoffice ongo`).
