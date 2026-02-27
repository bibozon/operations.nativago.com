import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';

async function getDashboardData() {
  const [experiencesCount, operatorsCount, citiesCount, recentExperiences] =
    await Promise.all([
      prisma.experience.count(),
      prisma.operator.count(),
      prisma.city.count(),
      prisma.experience.findMany({
        include: {
          operator: { select: { name: true } },
          city: { select: { name: true } },
        },
        orderBy: { id: 'desc' },
        take: 5,
      }),
    ]);

  return {
    experiencesCount,
    operatorsCount,
    citiesCount,
    recentExperiences,
  };
}

export default async function SuperadminDashboardPage() {
  const auth = await requireSuperadmin();

  const { experiencesCount, operatorsCount, citiesCount, recentExperiences } =
    await getDashboardData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white/90 px-4 py-6 shadow-sm md:block">
          <div className="mb-8 flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              NG
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">NativaGo</p>
              <p className="text-xs text-slate-500">CMS Superadmin</p>
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Panel
            </div>
            <a
              href="/admin/dashboard"
              className="mt-1 flex items-center rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700"
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Dashboard
            </a>

            <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Gestión
            </div>
            <a
              href="/admin"
              className="mt-1 flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Experiencias
            </a>
            <a
              href="/admin/bookings"
              className="mt-1 flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Reservas
            </a>
            <a
              href="/admin/checkin"
              className="mt-1 flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Check-in
            </a>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Operadores
            </button>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Categorías
            </button>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Ciudades
            </button>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Usuarios
            </button>

            <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sistema
            </div>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Configuración
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
          {/* Topbar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Vista general del rendimiento de operadores y experiencias.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                SUPERADMIN
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {(auth?.name ?? 'Superadmin')[0].toUpperCase()}
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Experiencias
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {experiencesCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">Publicadas en el marketplace</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Operadores
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">Agencias y freelancers activos</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Ciudades
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {citiesCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">Destinos operados</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Ventas
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">$0</p>
              <p className="mt-1 text-xs text-slate-500">Integración pendiente</p>
            </div>
          </section>

          {/* Recent experiences table */}
          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Experiencias recientes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Título
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Operador
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ciudad
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Precio
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentExperiences.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">
                        {exp.title}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700">
                        {exp.operator?.name ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700">
                        {exp.city?.name ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-900">
                        {`$${Number(exp.price).toLocaleString('es-CO')}`}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                          Publicada
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentExperiences.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-sm text-slate-500"
                      >
                        No hay experiencias recientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
