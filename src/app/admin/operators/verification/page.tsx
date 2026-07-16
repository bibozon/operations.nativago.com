import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';
import { generateOperatorContract } from '@/services/operator/contract';
import { getOperatorReviewState, REVIEW_STATE_LABEL, type OperatorReviewState } from '@/lib/operatorStatus';

async function getPendingOperators() {
  return prisma.operator.findMany({
    where: {
      verificationStatus: { in: ['DRAFT', 'PENDING', 'INFO_NEEDED'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      documents: { include: { documentType: true } },
    },
  });
}

const REVIEW_STATE_BADGE_CLASS: Record<OperatorReviewState, string> = {
  DRAFT:          'bg-slate-50 text-slate-600',
  INFO_NEEDED:    'bg-amber-50 text-amber-700',
  PENDING_REVIEW: 'bg-sky-50 text-sky-700',
  APPROVED:       'bg-emerald-50 text-emerald-700',
  SUSPENDED:      'bg-orange-50 text-orange-700',
  REJECTED:       'bg-red-50 text-red-700',
};

export default async function OperatorVerificationPage() {
  await requireSuperadmin();

  const [operators, allDocumentTypes] = await Promise.all([
    getPendingOperators(),
    prisma.documentType.findMany(),
  ]);

  const documentTypesByCountry = new Map<string, typeof allDocumentTypes>();
  for (const dt of allDocumentTypes) {
    const list = documentTypesByCountry.get(dt.countryId) ?? [];
    list.push(dt);
    documentTypesByCountry.set(dt.countryId, list);
  }

  const rows = operators.map((op) => {
    const requiredDocumentTypes = op.countryId ? documentTypesByCountry.get(op.countryId) ?? [] : [];
    const review = getOperatorReviewState(op, requiredDocumentTypes, op.documents);
    return { operator: op, review };
  });

  async function updateStatus(formData: FormData) {
    'use server';

    const id     = (formData.get('id') as string) ?? '';
    const action = (formData.get('action') as string) ?? '';

    if (!id || !action) return;

    if (action === 'approve') {
      await prisma.operator.update({
        where: { id },
        data: { verificationStatus: 'APPROVED', reviewNotes: null },
      });
      try {
        await generateOperatorContract(id);
      } catch (e) {
        console.error('Failed to generate operator contract for', id, e);
      }
    } else if (action === 'reject') {
      await prisma.operator.update({
        where: { id },
        data: { verificationStatus: 'REJECTED' },
      });
    } else if (action === 'request_info') {
      const notes = ((formData.get('reviewNotes') as string) ?? '').trim();
      await prisma.operator.update({
        where: { id },
        data: {
          verificationStatus: 'INFO_NEEDED',
          reviewNotes: notes || null,
        },
      });
    } else if (action === 'suspend') {
      await prisma.operator.update({
        where: { id },
        data: { verificationStatus: 'SUSPENDED' },
      });
    } else if (action === 'mark_pending') {
      // Mover de DRAFT/INFO_NEEDED a PENDING cuando el operador completó sus docs
      await prisma.operator.update({
        where: { id },
        data: { verificationStatus: 'PENDING', reviewNotes: null },
      });
    }

    revalidatePath('/admin/operators/verification');
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
            <a href="/admin/dashboard" className="flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
              Dashboard
            </a>
            <a href="/admin" className="mt-1 flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
              Experiencias
            </a>
            <a href="/admin/operators" className="mt-1 flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50">
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
          <div className="mx-auto max-w-6xl">
            <header className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Verificación de operadores
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Revisa credenciales y aprueba solo operadores certificados. Se muestran estados DRAFT, PENDING e INFO_NEEDED.
                </p>
              </div>
              <div className="text-sm font-medium text-slate-500">
                {rows.length} operador{rows.length !== 1 ? 'es' : ''}
              </div>
            </header>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Identidad / fiscal</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Documentos</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Soporte</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map(({ operator: op, review }) => (
                      <tr key={op.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {op.name}
                          {op.legalRepresentative && (
                            <p className="text-xs font-normal text-slate-400">Rep. {op.legalRepresentative}</p>
                          )}
                          {op.categoria && (
                            <p className="text-xs font-normal text-slate-400">{op.categoria}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {op.type === 'AGENCY' ? 'Jurídica' : 'Natural'}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${REVIEW_STATE_BADGE_CLASS[review.state]}`}
                          >
                            {REVIEW_STATE_LABEL[review.state]}
                          </span>
                          {review.missingDocumentLabels.length > 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                              Falta: {review.missingDocumentLabels.join(', ')}
                            </p>
                          )}
                          {op.reviewNotes && (
                            <p className="mt-1 max-w-[200px] text-xs text-slate-500 italic">
                              "{op.reviewNotes}"
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {op.licenseNumber || '-'}
                          {op.paymentAccount && (
                            <p className="text-xs text-slate-400">{op.paymentAccount}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {op.documents.length > 0 ? (
                            <ul className="space-y-0.5">
                              {op.documents.map((d) => (
                                <li key={d.id} className="text-xs">
                                  {d.documentType.label}: {d.value}
                                  {d.verified && <span className="ml-1 text-emerald-600">✓</span>}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-slate-400">Sin documentos</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-emerald-700">
                          {op.licenseDocument ? (
                            <a
                              href={op.licenseDocument}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline hover:text-emerald-600"
                            >
                              Ver archivo
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-col items-end gap-2">
                            {/* Aprobar */}
                            <div className="flex items-center gap-2">
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
                              {op.verificationStatus !== 'PENDING' && (
                                <form action={updateStatus}>
                                  <input type="hidden" name="id" value={op.id} />
                                  <input type="hidden" name="action" value="mark_pending" />
                                  <button
                                    type="submit"
                                    className="inline-flex items-center rounded-md border border-sky-200 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                                  >
                                    En revisión
                                  </button>
                                </form>
                              )}
                            </div>

                            {/* Pedir información */}
                            <form action={updateStatus} className="flex w-full flex-col items-end gap-1.5">
                              <input type="hidden" name="id" value={op.id} />
                              <input type="hidden" name="action" value="request_info" />
                              <textarea
                                name="reviewNotes"
                                rows={2}
                                defaultValue={op.reviewNotes ?? ''}
                                placeholder="Escribe qué falta o qué corrección se necesita…"
                                className="w-52 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 placeholder:text-slate-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-100"
                              />
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                              >
                                Pedir información
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">
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
