import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';
import { generateOperatorContract } from '@/services/operator/contract';

async function getPendingOperators() {
  return prisma.operator.findMany({
    where: { verificationStatus: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  } as any);
}

export default async function OperatorVerificationPage() {
  await requireSuperadmin();

  const operators = await getPendingOperators();

  async function updateStatus(formData: FormData) {
    'use server';

    const id = Number(formData.get('id'));
    const action = (formData.get('action') as string) ?? '';

    if (!Number.isFinite(id)) return;

    const status = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : null;
    if (!status) return;

    await prisma.operator.update({
      where: { id },
      data: { verificationStatus: status as any },
    });

    if (status === 'APPROVED') {
      try {
        await generateOperatorContract(id);
      } catch (e) {
        console.error('Failed to generate operator contract for', id, e);
      }
    }
  }

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
              className="mt-1 flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Operadores
            </a>
            <a
              href="/admin/operators/verification"
              className="mt-1 flex items-center rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700"
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Verificación
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-5xl">
            <header className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Verificación de operadores
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Revisa las credenciales turísticas y aprueba solo operadores certificados.
                </p>
              </div>
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
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Licencia
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        CNPJ / CPF
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        CADASTUR
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Documento
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
                          {op.type === 'AGENCY' ? 'Agencia' : 'Freelance'}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">
                          {op.licenseNumber || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">
                          {op.type === 'AGENCY'
                            ? op.cnpj || '-'
                            : op.cpf || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">
                          {op.cadastur || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-emerald-700">
                          {op.licenseDocument ? (
                            <a
                              href={op.licenseDocument}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-emerald-600"
                            >
                              Ver documento
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-xs">
                          <div className="inline-flex items-center gap-2">
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={op.id} />
                              <input type="hidden" name="action" value="approve" />
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                              >
                                Aprobar
                              </button>
                            </form>
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={op.id} />
                              <input type="hidden" name="action" value="reject" />
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                              >
                                Rechazar
                              </button>
                            </form>
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
                          No hay operadores pendientes de verificación.
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
