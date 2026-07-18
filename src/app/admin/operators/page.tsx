import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';

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

const STATUS_LABEL: Record<string, string> = {
  DRAFT:       'Borrador',
  PENDING:     'En revisión',
  INFO_NEEDED: 'Info. incompleta',
  APPROVED:    'Activo',
  SUSPENDED:   'Suspendido',
  REJECTED:    'Rechazado',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT:       'bg-slate-50 text-slate-600',
  PENDING:     'bg-sky-50 text-sky-700',
  INFO_NEEDED: 'bg-amber-50 text-amber-700',
  APPROVED:    'bg-emerald-50 text-emerald-700',
  SUSPENDED:   'bg-orange-50 text-orange-700',
  REJECTED:    'bg-red-50 text-red-700',
};

export default async function OperatorsPage() {
  await requireSuperadmin();

  const operators = await getOperatorsData();

  const getTypeLabel = (role: string | null | undefined) => {
    if (role === 'OPERATOR_AGENCY') return 'Agencia';
    if (role === 'OPERATOR_FREELANCE') return 'Freelance';
    return '-';
  };

  async function toggleSuspended(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const id = (formData.get('id') as string) ?? '';
    const nextStatus = (formData.get('nextStatus') as string) ?? '';
    if (!id || !nextStatus) return;

    await prisma.operator.update({
      where: { id },
      data: { verificationStatus: nextStatus as 'APPROVED' | 'SUSPENDED' },
    });

    revalidatePath('/admin/operators');
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Operadores
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona agencias y operadores freelance conectados a NativaGo.
          </p>
        </div>
        <Link
          href="/register/operator"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          Nuevo operador
        </Link>
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
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${STATUS_BADGE_CLASS[op.verificationStatus] ?? 'bg-slate-50 text-slate-600'}`}
                    >
                      {STATUS_LABEL[op.verificationStatus] ?? op.verificationStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/operators/${op.id}/edit`}
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                      {op.verificationStatus === 'APPROVED' && (
                        <form action={toggleSuspended}>
                          <input type="hidden" name="id" value={op.id} />
                          <input type="hidden" name="nextStatus" value="SUSPENDED" />
                          <button
                            type="submit"
                            className="inline-flex items-center rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Desactivar
                          </button>
                        </form>
                      )}
                      {op.verificationStatus === 'SUSPENDED' && (
                        <form action={toggleSuspended}>
                          <input type="hidden" name="id" value={op.id} />
                          <input type="hidden" name="nextStatus" value="APPROVED" />
                          <button
                            type="submit"
                            className="inline-flex items-center rounded-md border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Activar
                          </button>
                        </form>
                      )}
                      {(op.verificationStatus === 'DRAFT' || op.verificationStatus === 'PENDING' || op.verificationStatus === 'INFO_NEEDED') && (
                        <Link
                          href="/admin/operators/verification"
                          className="inline-flex items-center rounded-md border border-sky-200 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                        >
                          Revisar
                        </Link>
                      )}
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
  );
}
