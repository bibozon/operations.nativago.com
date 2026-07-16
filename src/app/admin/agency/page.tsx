import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth';
import { getOperatorDashboardData } from '@/services/operator/dashboard';
import { OperatorExperiencesTable } from '@/components/admin/OperatorExperiencesTable';
import { TrustLevelCard } from '@/components/admin/TrustLevelCard';
import { formatPrice } from '@/domain/entities/Money';

export default async function AgencyDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;

  let auth: AuthTokenPayload | null = null;
  if (token) {
    auth = verifyAuthToken(token);
  }

  if (!auth) {
    redirect('/login');
  }

  if (auth.role !== 'OPERATOR_AGENCY') {
    redirect('/admin');
  }

  if (!auth.operatorId) {
    redirect('/admin');
  }

  const { experiences, experiencesCount, bookingsThisMonth, currencyCode, trustLevel } =
    await getOperatorDashboardData(auth.operatorId);
  const revenueThisMonth = 0;

  const roleLabel = 'OPERADOR AGENCIA';

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
              <p className="text-xs text-slate-500">Panel operador</p>
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Navegación
            </div>
            <a
              href="/admin/agency"
              className="mt-1 flex items-center rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700"
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Mis experiencias
            </a>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Reservas
            </button>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Calendario
            </button>
            <button className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-400">
              Perfil agencia
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
          {/* Topbar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                Panel de agencia
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Gestiona tus experiencias y rendimiento en NativaGo.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {roleLabel}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {(auth?.name ?? 'Agency')[0].toUpperCase()}
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Experiencias activas
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {experiencesCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">Publicadas en NativaGo</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Reservas del mes
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {bookingsThisMonth}
              </p>
              <p className="mt-1 text-xs text-slate-500">Integración de reservas pendiente</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Ingresos
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatPrice(revenueThisMonth, currencyCode)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Conexión de pagos en desarrollo</p>
            </div>
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-3">
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
        </main>
      </div>
    </div>
  );
}
