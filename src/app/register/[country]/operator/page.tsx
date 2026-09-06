import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { REGISTER_I18N } from '@/lib/registerI18n';
import { registerOperator } from '../../operator/actions';
import { CountryOperatorRegisterForm } from './CountryOperatorRegisterForm';
import { BackLink } from '@/components/BackLink';

const FLAG_SRC: Record<string, string> = {
  co: 'https://flagcdn.com/w40/co.png',
  br: 'https://flagcdn.com/w40/br.png',
  mx: 'https://flagcdn.com/w40/mx.png',
};

const ACCENT: Record<string, { bg: string; border: string; text: string }> = {
  co: { bg: 'from-yellow-400 to-blue-700', border: 'border-yellow-400', text: 'text-yellow-900' },
  br: { bg: 'from-green-500 to-yellow-400', border: 'border-green-500', text: 'text-green-900' },
  mx: { bg: 'from-green-600 to-red-600', border: 'border-green-600', text: 'text-green-900' },
};

export default async function CountryOperatorRegisterPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;

  const i18n = REGISTER_I18N[countrySlug];
  if (!i18n) return notFound();

  // Fetch country record by domainSlug to get its DB id
  const countryRecord = await prisma.country.findFirst({
    where: { domainSlug: countrySlug },
    select: { id: true, name: true },
  });

  // If country not in DB yet, fall back to fetching all cities (generic)
  const [cities, documentTypes] = await Promise.all([
    prisma.city.findMany({
      where: countryRecord ? { countryId: countryRecord.id } : undefined,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, countryId: true, countryRef: { select: { code: true } } },
    }),
    prisma.documentType.findMany({
      where: countryRecord ? { countryId: countryRecord.id } : undefined,
      select: { id: true, countryId: true, code: true, label: true, validationRegex: true, isRequired: true },
    }),
  ]);

  const cityOptions = cities.map((c) => ({
    id: c.id,
    name: c.name,
    countryId: c.countryId,
    countryCode: c.countryRef?.code ?? null,
  }));

  const accent = ACCENT[countrySlug] ?? ACCENT.co;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <BackLink href="/register/operator" label="← Cambiar país" />

        {/* Country header */}
        <div className="mb-5 flex items-center gap-3">
          <img
            src={FLAG_SRC[countrySlug] ?? ''}
            alt={i18n.countryCode}
            width={40}
            height={30}
            className="rounded shadow-sm object-cover"
            style={{ width: 40, height: 28 }}
          />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">NativaGo</p>
            <h1 className="text-xl font-semibold text-slate-900">{i18n.pageTitle}</h1>
          </div>
        </div>

        <p className="text-sm text-slate-600">{i18n.pageDesc}</p>

        <CountryOperatorRegisterForm
          i18n={i18n}
          cities={cityOptions}
          documentTypes={documentTypes}
          registerOperator={registerOperator}
        />
      </div>
    </div>
  );
}
