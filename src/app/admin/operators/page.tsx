import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth';

async function getOperatorsData() {
  const operators = await prisma.operator.findMany({
    include: {
      user: {
        select: {
          role: true,
        },
      },
      _count: {
        select: { experiences: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return operators;
}

export default async function OperatorsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth')?.value;

  let auth: AuthTokenPayload | null = null;
  if (token) {
    auth = verifyAuthToken(token);
  }

  if (!auth) {
    redirect('/login');
  }

  if (auth.role !== 'SUPERADMIN') {
    redirect('/admin');
  }

  const operators = await getOperatorsData();

  const getTypeLabel = (role: string | null | undefined) => {
    if (role === 'OPERATOR_AGENCY') return 'Agencia';
    if (role === 'OPERATOR_FREELANCE') return 'Freelance';
    return '-';
  };

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
            <a
              href="/admin/dashboard"
              className="flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </a>
            <a
              href="/admin"
              className="mt-1 flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Experiencias
            </a>
            <a
              href="/admin/operators"
              className="mt-1 flex items-center rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700"
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Operadores
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-5xl">
            <header className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Operadores
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Gestiona agencias y operadores freelance conectados a NativaGo.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
              >
                Nuevo operador
              </button>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nombre
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Experiencias
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
                    {operators.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2 text-sm font-medium text-slate-900">
                          {op.name}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">
                          {getTypeLabel(op.user?.role)}
                        </td>
                        <td className="px-3 py-2 text-center text-sm text-slate-900">
                          {op._count.experiences}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                            Activo
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-xs">
                          <div className="inline-flex items-center gap-2">
                            <button className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                              Editar
                            </button>
                            <button className="inline-flex items-center rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
                              Desactivar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {operators.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-center text-sm text-slate-500"
                        >
                          No hay operadores registrados todavía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
