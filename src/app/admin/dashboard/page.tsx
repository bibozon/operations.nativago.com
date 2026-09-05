import prisma from '@/lib/db';
import { requireStaffOrAbove } from '@/lib/requireRole';
import { formatPrice } from '@/domain/entities/Money';
import { ROLE_LABEL } from '@/lib/roleLabels';
import { getT } from '@/lib/i18n/getLocale';
import { DailyBarChart } from '@/components/admin/DailyBarChart';

const CHART_DAYS = 30;

// Los timestamps de Prisma y las funciones serverless de Vercel están en UTC,
// así que se bucketiza por fecha UTC (toISOString) para que ambos coincidan.
function bucketByDay(dates: Date[], since: Date) {
  const days: { key: string; label: string; value: number }[] = [];
  for (let i = 0; i < CHART_DAYS; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
      value: 0,
    });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const date of dates) {
    const bucket = byKey.get(date.toISOString().slice(0, 10));
    if (bucket) bucket.value++;
  }
  return days.map(({ label, value }) => ({ label, value }));
}

async function getDashboardData() {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (CHART_DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const [
    experiencesCount,
    operatorsCount,
    citiesCount,
    recentExperiences,
    recentOperators,
    recentBookings,
  ] = await Promise.all([
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
    prisma.operator.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.booking.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);

  return {
    experiencesCount,
    operatorsCount,
    citiesCount,
    recentExperiences,
    newOperatorsByDay: bucketByDay(recentOperators.map((o) => o.createdAt), since),
    bookingsByDay: bucketByDay(recentBookings.map((b) => b.createdAt), since),
  };
}

export default async function SuperadminDashboardPage() {
  const auth = await requireStaffOrAbove();
  const t = await getT();

  const { experiencesCount, operatorsCount, citiesCount, recentExperiences, newOperatorsByDay, bookingsByDay } =
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

          {/* Gráficas — solo Super Admin, no para el rol operador */}
          {auth.role === 'SUPERADMIN' && (
            <section className="mb-8 grid gap-4 md:grid-cols-2">
              <DailyBarChart
                title={t.admin_chartNewOperators}
                subtitle={t.admin_chartLast30Days}
                data={newOperatorsByDay}
                color="#0d9488"
              />
              <DailyBarChart
                title={t.admin_chartBookings}
                subtitle={t.admin_chartLast30Days}
                data={bookingsByDay}
                color="#f97316"
              />
            </section>
          )}

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
