import prisma from '@/lib/db';
import { requireStaffOrAbove } from '@/lib/requireRole';
import { formatPrice } from '@/domain/entities/Money';
import { ROLE_LABEL } from '@/lib/roleLabels';
import { getT } from '@/lib/i18n/getLocale';

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
          country: { select: { defaultCurrency: { select: { code: true } } } },
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
  const auth = await requireStaffOrAbove();
  const t = await getT();

  const { experiencesCount, operatorsCount, citiesCount, recentExperiences } =
    await getDashboardData();

  return (
    <div>
      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
            {t.admin_dashboardTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.admin_dashboardSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {(ROLE_LABEL[auth.role] ?? auth.role).toUpperCase()}
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
                {t.admin_statExperiences}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {experiencesCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">{t.admin_statExperiencesDesc}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t.admin_statOperators}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {operatorsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">{t.admin_statOperatorsDesc}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t.admin_statCities}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {citiesCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">{t.admin_statCitiesDesc}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t.admin_statSales}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">$0</p>
              <p className="mt-1 text-xs text-slate-500">{t.admin_statSalesDesc}</p>
            </div>
          </section>

          {/* Recent experiences table */}
          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {t.admin_recentExperiences}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t.admin_colTitle}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t.admin_colOperator}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t.admin_colCity}
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t.admin_colPrice}
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t.admin_colStatus}
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
                        {formatPrice(Number(exp.price), exp.country?.defaultCurrency.code ?? 'COP')}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                          {t.admin_published}
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
                        {t.admin_noRecentExperiences}
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
