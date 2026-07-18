import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth';

const COMING_SOON = [
  {
    title: 'Marca',
    description: 'Configura identidad visual y textos principales de NativaGo.',
  },
  {
    title: 'Pagos',
    description: 'Conecta tu proveedor de pagos y configura métodos disponibles.',
  },
  {
    title: 'Comisiones',
    description: 'Define políticas de comisión para agencias y operadores freelance.',
  },
];

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
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Administra la marca, pagos, comisiones y catálogos globales de NativaGo.
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/categories"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-teal-300 hover:shadow-md"
        >
          <h2 className="text-sm font-semibold text-slate-900">Categorías →</h2>
          <p className="mt-1 text-xs text-slate-500">
            Administra las categorías de experiencias disponibles en el marketplace.
          </p>
        </Link>

        <Link
          href="/admin/cities"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-teal-300 hover:shadow-md"
        >
          <h2 className="text-sm font-semibold text-slate-900">Ciudades →</h2>
          <p className="mt-1 text-xs text-slate-500">
            Gestiona las ciudades y destinos operados por NativaGo.
          </p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {COMING_SOON.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4"
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">{item.title}</h2>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Próximamente
              </span>
            </div>
            <p className="text-xs text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
