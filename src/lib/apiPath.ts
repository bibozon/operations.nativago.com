// Bajo Vercel Multi-Zones este proyecto se sirve detrás de /cms
// (basePath en next.config.js). Next.js antepone basePath automáticamente
// a <Link>/router.push/redirect(), pero NO a fetch() del cliente — un
// fetch('/api/...') a secas golpea la zona equivocada (el marketplace) en
// vez de esta API. Todo fetch de cliente a una ruta propia de esta app
// debe envolver su path con apiPath().
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function apiPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
