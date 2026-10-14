/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel Multi-Zones: este proyecto (CMS) se sirve detras del marketplace
  // (nativago-mvp) via reescritura a /cms en next.config.mjs del MVP.
  // basePath hace que Next.js anteponga /cms automaticamente a todos los
  // enlaces (<Link>, redirect()) y assets generados por esta app -- no hace
  // falta cambiar las rutas internas (/admin/bookings sigue siendo
  // /admin/bookings en el codigo; el navegador la ve en /cms/admin/bookings).
  basePath: '/cms',
};

module.exports = nextConfig;
