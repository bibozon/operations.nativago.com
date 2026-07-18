import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth';
import { getOperatorDashboardData } from '@/services/operator/dashboard';
import { OperatorExperiencesTable } from '@/components/admin/OperatorExperiencesTable';
import { TrustLevelCard } from '@/components/admin/TrustLevelCard';

export default async function FreelanceDashboardPage() {
  const cookieStore = await cookies();
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

  const { experiences, experiencesCount, bookingsThisMonth, currencyCode, trustLevel } =
    await getOperatorDashboardData(auth.operatorId);

  const roleLabel = 'OPERADOR FREELANCE';

  return (
    <div>
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
            {(auth?.name ?? 'Freelance')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats cards */}
          <section className="mb-8 grid gap-4 md:grid-cols-3">
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

            <TrustLevelCard trustLevel={trustLevel} />
          </section>

          {/* Mis experiencias table */}
          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Mis experiencias
              </h2>
            </div>
            <OperatorExperiencesTable experiences={experiences} currencyCode={currencyCode} />
          </section>
    </div>
  );
}
