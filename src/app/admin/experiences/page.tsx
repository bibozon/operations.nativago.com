import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';
import { redirect } from 'next/navigation';
import { formatPrice } from '@/domain/entities/Money';
import { getT } from '@/lib/i18n/getLocale';

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const auth = await requireAuth();
  const staffOrAbove = isStaffOrAbove(auth.role);
  const t = await getT();

  const include = {
    operator: true,
    city: true,
    category: true,
    country: { select: { defaultCurrency: { select: { code: true } } } },
  } as const;

  const experiences = staffOrAbove
    ? await prisma.experience.findMany({
        include,
        orderBy: { id: 'desc' },
      })
    : await prisma.experience.findMany({
        where: { operatorId: auth.operatorId ?? '' },
        include,
        orderBy: { id: 'desc' },
      });

  async function deleteExp(formData: FormData) {
    'use server';

    const idRaw = formData.get('id');
    const id = typeof idRaw === 'string' ? idRaw : '';
    if (!id) return;

    const authInAction = await requireAuth();

    const exp = await prisma.experience.findUnique({ where: { id } });

    if (!exp) return;

    if (
      !isStaffOrAbove(authInAction.role) &&
      exp.operatorId !== authInAction.operatorId
    ) {
      return;
    }

    // Borrar con reservas activas viola la FK (Booking.experienceId) y
    // Postgres la rechaza — se chequea antes para mostrar un mensaje de
    // negocio en vez de que la Server Action crashee con un error 500.
    const activeBookings = await prisma.booking.count({
      where: { experienceId: id, status: { not: 'CANCELLED' } },
    });
    if (activeBookings > 0) {
      redirect('/admin/experiences?error=has-bookings');
    }

    await prisma.experience.delete({ where: { id } });

    redirect('/admin/experiences');
  }

  return (
    <div>
      {searchParams?.error === 'has-bookings' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.admin_expHasBookingsError}
        </div>
      )}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t.admin_expTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {staffOrAbove ? t.admin_expSubtitleAll : t.admin_expSubtitleMine}
          </p>
        </div>
        <a
          href={staffOrAbove ? '/admin/new' : '/admin/experiences/new'}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          {t.admin_expNew}
        </a>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.admin_expColImage}</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.admin_colTitle}</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.admin_colCity}</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{t.admin_colPrice}</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.admin_expColOperator}</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{t.admin_expActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {experiences.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2">
                    {Array.isArray(exp.images) && exp.images?.[0] ? (
                      <img
                        src={exp.images?.[0]}
                        alt={exp.title}
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded-lg bg-slate-100" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{exp.title}</td>
                  <td className="px-4 py-2.5 text-slate-600">{exp.city?.name}</td>
                  <td className="px-4 py-2.5 text-right text-slate-900">
                    {formatPrice(Number(exp.price), exp.country?.defaultCurrency.code ?? 'COP')}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{exp.operator?.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      <a
                        href={`/admin/experiences/${exp.id}/edit`}
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        {t.admin_edit}
                      </a>
                      <a
                        href={`/admin/experiences/${exp.id}/availability`}
                        className="text-xs font-medium text-sky-700 hover:underline"
                      >
                        {t.admin_availability}
                      </a>
                      <form action={deleteExp} className="inline">
                        <input type="hidden" name="id" value={exp.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          {t.admin_delete}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {experiences.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    {t.admin_expEmpty}
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
