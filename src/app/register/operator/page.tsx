import Link from 'next/link';

const COUNTRIES = [
  {
    slug: 'co',
    name: 'Colombia',
    flag: 'https://flagcdn.com/w80/co.png',
    currency: 'COP',
    tagline: 'Caribe, Andes y Amazonia',
  },
  {
    slug: 'br',
    name: 'Brasil',
    flag: 'https://flagcdn.com/w80/br.png',
    currency: 'BRL',
    tagline: 'Selva, praias e Pantanal',
  },
  {
    slug: 'mx',
    name: 'México',
    flag: 'https://flagcdn.com/w80/mx.png',
    currency: 'MXN',
    tagline: 'Caribe, Andes y Pacífico',
  },
];

export default function OperatorRegisterLandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">NativaGo · Operadores</p>
          <h1 className="text-2xl font-bold text-slate-900">¿En qué país operas?</h1>
          <p className="mt-2 text-sm text-slate-500">
            Selecciona tu país para ver el formulario de registro correspondiente.
          </p>
        </div>

        {/* Country cards */}
        <div className="space-y-3">
          {COUNTRIES.map((c) => (
            <Link
              key={c.slug}
              href={`/register/${c.slug}/operator`}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md active:scale-[0.98]"
            >
              <img
                src={c.flag}
                alt={c.name}
                width={48}
                height={36}
                className="rounded-md object-cover shadow-sm shrink-0"
                style={{ width: 48, height: 34 }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-400 truncate">{c.tagline}</p>
              </div>
              <span className="text-xs font-bold text-slate-300 shrink-0">{c.currency}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 text-slate-300 shrink-0"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
