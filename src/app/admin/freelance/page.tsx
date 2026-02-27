import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth';

async function getFreelanceDashboardData(operatorId: number) {
  const [experiences, experiencesCount] = await Promise.all([
    prisma.experience.findMany({
      where: { operatorId },
      include: {
        city: { select: { name: true } },
      },
      orderBy: { id: 'desc' },
      take: 20,
    }),
    prisma.experience.count({ where: { operatorId } }),
  ]);

  return {
    experiences,
    experiencesCount,
    bookingsThisMonth: 0,
  };
}

export default async function FreelanceDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth')?.value;

  let auth: AuthTokenPayload | null = null;
  if (token) {
    auth = verifyAuthToken(token);
  }

  if (!auth) {
    redirect('/login');
  }

  if (auth.role !== 'OPERATOR_FREELANCE') {
    redirect('/admin');
  }

  if (!auth.operatorId) {
    redirect('/admin');
  }

  const { experiences, experiencesCount, bookingsThisMonth } =
    await getFreelanceDashboardData(auth.operatorId);

  const roleLabel = 'OPERADOR FREELANCE';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-shrink-0 border-r border-slate-200 bg-white/90 px-4 py-6 shadow-sm md:block">
          <div className="mb-6">
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              NativaGo Creator
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            <button className="flex w-full items-center rounded-lg bg-emerald-50 px-3 py-2 text-left font-medium text-emerald-700">
              Mis experiencias
            </button>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Perfil
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
          {/* Topbar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                Panel freelance
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Gestiona tus experiencias como operador freelance en NativaGo.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {roleLabel}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {auth.name?.[0]?.toUpperCase?.() || 'FR'}
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <section className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Experiencias
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {experiencesCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">Publicadas en NativaGo</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Reservas
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {bookingsThisMonth}
              </p>
              <p className="mt-1 text-xs text-slate-500">Integración de reservas pendiente</p>
            </div>
          </section>

          {/* Mis experiencias table */}
          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Mis experiencias
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
                      Ciudad
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Precio
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {experiences.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">
                        {exp.title}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700">
                        {exp.city?.name ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-900">
                        {`$${Number(exp.price).toLocaleString('es-CO')}`}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                          Activa
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs">
                        <button className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {experiences.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-sm text-slate-500"
                      >
                        Aún no tienes experiencias publicadas.
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
