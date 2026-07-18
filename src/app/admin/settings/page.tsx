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
  );
}
