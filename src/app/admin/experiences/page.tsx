import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';
import { redirect } from 'next/navigation';
import { formatPrice } from '@/domain/entities/Money';
import { getT } from '@/lib/i18n/getLocale';
import { ExperienceFilters } from '@/components/admin/ExperienceFilters';
import { setExperienceStatus, deleteExperience } from '@/services/catalog/cms';

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams?: { error?: string; categoryId?: string; countryId?: string; cityId?: string };
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

  const { categoryId, countryId, cityId } = searchParams ?? {};
  const filterWhere = {
    ...(categoryId ? { categoryId } : {}),
    ...(countryId ? { countryId } : {}),
    ...(cityId ? { cityId } : {}),
  };

  const [experiences, categories, countries, cities] = await Promise.all([
    staffOrAbove
      ? prisma.experience.findMany({
          where: filterWhere,
          include,
          orderBy: { id: 'desc' },
        })
      : prisma.experience.findMany({
          where: { operatorId: auth.operatorId ?? '', ...filterWhere },
          include,
          orderBy: { id: 'desc' },
        }),
    staffOrAbove ? prisma.category.findMany({ orderBy: { name: 'asc' } }) : Promise.resolve([]),
    staffOrAbove ? prisma.country.findMany({ orderBy: { name: 'asc' } }) : Promise.resolve([]),
    staffOrAbove
      ? prisma.city.findMany({
          where: countryId ? { countryId } : undefined,
          orderBy: { name: 'asc' },
          select: { id: true, name: true, countryId: true },
        })
      : Promise.resolve([]),
  ]);

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

    await deleteExperience(id, {
      userId: authInAction.userId,
      email: authInAction.email,
      role: authInAction.role,
    });

    redirect('/admin/experiences');
  }

  async function setStatus(formData: FormData) {
    'use server';

    // Aprobar/rechazar es una decisión de moderación (RN-EXP-09) — solo
    // soporte/superadmin, no el operador dueño de la experiencia.
    const authInAction = await requireAuth();
    if (!isStaffOrAbove(authInAction.role)) return;

    const idRaw = formData.get('id');
    const id = typeof idRaw === 'string' ? idRaw : '';
    const statusRaw = formData.get('status');
    const status = statusRaw === 'PUBLISHED' || statusRaw === 'REJECTED' ? statusRaw : null;
    if (!id || !status) return;

    await setExperienceStatus(id, status, {
      userId: authInAction.userId,
      email: authInAction.email,
      role: authInAction.role,
    });

    redirect('/admin/experiences');
  }

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    PUBLISHED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-red-50 text-red-700',
    DRAFT: 'bg-slate-100 text-slate-600',
  };
  const statusLabels: Record<string, string> = {
    PENDING: t.admin_expStatusPending,
    PUBLISHED: t.admin_expStatusPublished,
    REJECTED: t.admin_expStatusRejected,
    DRAFT: t.admin_expStatusDraft,
  };

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

      {staffOrAbove && (
        <ExperienceFilters
          categories={categories}
          countries={countries}
          cities={cities}
          labels={{
            category: t.admin_filterCategory,
            country: t.admin_filterCountry,
            city: t.admin_filterCity,
            clear: t.admin_filterClear,
          }}
        />
      )}

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
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.admin_expColStatus}</th>
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
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${statusStyles[exp.status] ?? statusStyles.DRAFT}`}>
                      {statusLabels[exp.status] ?? exp.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      {staffOrAbove && exp.status !== 'PUBLISHED' && (
                        <form action={setStatus} className="inline">
                          <input type="hidden" name="id" value={exp.id} />
                          <button
                            type="submit"
                            name="status"
                            value="PUBLISHED"
                            className="text-xs font-medium text-emerald-700 hover:underline"
                          >
                            {t.admin_approve}
                          </button>
                        </form>
                      )}
                      {staffOrAbove && exp.status !== 'REJECTED' && (
                        <form action={setStatus} className="inline">
                          <input type="hidden" name="id" value={exp.id} />
                          <button
                            type="submit"
                            name="status"
                            value="REJECTED"
                            className="text-xs font-medium text-amber-700 hover:underline"
                          >
                            {t.admin_reject}
                          </button>
                        </form>
                      )}
                      <a
                        href={`/admin/experiences/${exp.id}/edit`}
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        {t.admin_edit}
                      </a>
                      {staffOrAbove && (
                        <a
                          href={`/admin/experiences/${exp.id}/history`}
                          className="text-xs font-medium text-slate-600 hover:underline"
                        >
                          {t.admin_history}
                        </a>
                      )}
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
                    colSpan={7}
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
