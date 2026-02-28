import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth';

const TABS = ['Marca', 'Pagos', 'Comisiones', 'Categorías', 'Ciudades'] as const;

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;

  let auth: AuthTokenPayload | null = null;
  if (token) {
    auth = verifyAuthToken(token);
  }

  if (!auth) {
    redirect('/login');
  }

  if (auth.role !== 'SUPERADMIN') {
    redirect('/admin');
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
              href="/admin/settings"
              className="mt-1 flex items-center rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700"
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Configuración
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-5xl">
            <header className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Configuración CMS
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Administra la marca, pagos, comisiones y catálogos globales de NativaGo.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                SUPERADMIN
              </span>
            </header>

            {/* Tabs */}
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-sm">
              {TABS.map((tab, index) => (
                <button
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    index === 0
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Marca */}
            <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
              <h2 className="text-sm font-semibold text-slate-900">Marca</h2>
              <p className="mt-1 text-xs text-slate-500">
                Configura identidad visual y textos principales del CMS de NativaGo.
              </p>
            </section>

            {/* Pagos */}
            <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
              <h2 className="text-sm font-semibold text-slate-900">Pagos</h2>
              <p className="mt-1 text-xs text-slate-500">
                Conecta tu proveedor de pagos y configura métodos disponibles.
              </p>
            </section>

            {/* Comisiones */}
            <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
              <h2 className="text-sm font-semibold text-slate-900">Comisiones</h2>
              <p className="mt-1 text-xs text-slate-500">
                Define políticas de comisión para agencias y operadores freelance.
              </p>
            </section>

            {/* Categorías */}
            <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
              <h2 className="text-sm font-semibold text-slate-900">Categorías</h2>
              <p className="mt-1 text-xs text-slate-500">
                Administra las categorías de experiencias disponibles en el marketplace.
              </p>
            </section>

            {/* Ciudades */}
            <section className="mb-8 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
              <h2 className="text-sm font-semibold text-slate-900">Ciudades</h2>
              <p className="mt-1 text-xs text-slate-500">
                Gestiona las ciudades y destinos operados por NativaGo.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
