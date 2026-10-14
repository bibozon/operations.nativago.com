import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} de 5 estrellas`}>
      {'★'.repeat(rating)}
      <span className="text-slate-200">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams?: { operatorId?: string };
}) {
  const auth = await requireAuth();
  const staffOrAbove = isStaffOrAbove(auth.role);

  const reviews = await prisma.review.findMany({
    where: staffOrAbove ? {} : { operatorId: auth.operatorId ?? '__none__' },
    include: {
      operator: { select: { id: true, name: true } },
      experience: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Ranking por operador (solo relevante para staff: vista comparativa).
  const byOperator = new Map<string, { name: string; count: number; sum: number }>();
  for (const r of reviews) {
    const entry = byOperator.get(r.operatorId) ?? { name: r.operator.name, count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += r.rating;
    byOperator.set(r.operatorId, entry);
  }
  const ranking = [...byOperator.entries()]
    .map(([operatorId, v]) => ({ operatorId, name: v.name, count: v.count, avg: v.sum / v.count }))
    .sort((a, b) => b.avg - a.avg);

  const myAvg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const selectedOperatorId = staffOrAbove ? searchParams?.operatorId : undefined;
  const visibleReviews = selectedOperatorId
    ? reviews.filter((r) => r.operatorId === selectedOperatorId)
    : reviews;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {staffOrAbove ? 'Valoraciones de clientes' : 'Mis valoraciones'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Calificación de 1 a 5 estrellas que el cliente deja después de que se confirma su check-in.
        </p>
      </header>

      {!staffOrAbove && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Promedio general</p>
              <p className="text-3xl font-semibold text-slate-900">
                {reviews.length ? myAvg.toFixed(1) : '—'}
                <span className="ml-1 text-base text-slate-400">/ 5</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Reservas calificadas</p>
              <p className="text-3xl font-semibold text-slate-900">{reviews.length}</p>
            </div>
          </div>
        </section>
      )}

      {staffOrAbove && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Ranking por operador</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Operador</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Valoraciones</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Promedio</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {ranking.map((r) => (
                  <tr key={r.operatorId} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 font-medium text-slate-900">{r.name}</td>
                    <td className="px-3 py-2 text-center text-slate-700">{r.count}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">{r.avg.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/reviews?operatorId=${r.operatorId}`}
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        Ver comentarios →
                      </Link>
                    </td>
                  </tr>
                ))}
                {ranking.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                      Todavía no hay valoraciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            {staffOrAbove ? 'Todos los comentarios' : 'Comentarios de mis clientes'}
          </h2>
          {staffOrAbove && selectedOperatorId && (
            <Link href="/admin/reviews" className="text-xs font-medium text-slate-500 hover:underline">
              Quitar filtro ×
            </Link>
          )}
        </div>
        <ul className="space-y-3">
          {visibleReviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.experience.title}</p>
                  {staffOrAbove && <p className="text-xs text-slate-500">{r.operator.name}</p>}
                </div>
                <div className="text-right">
                  <Stars rating={r.rating} />
                  <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                </div>
              </div>
              {r.comment && <p className="mt-2 text-sm text-slate-600">"{r.comment}"</p>}
              <p className="mt-1 text-xs text-slate-400">— {r.customerName}</p>
            </li>
          ))}
          {visibleReviews.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-500">
              Todavía no hay comentarios.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
