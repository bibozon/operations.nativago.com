import prisma from '@/lib/db';
import { OperatorRegisterForm } from './OperatorRegisterForm';
import { registerOperator } from './actions';

export default async function OperatorRegisterPage() {
  const [cities, documentTypes] = await Promise.all([
    prisma.city.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, countryId: true, countryRef: { select: { code: true } } },
    }),
    prisma.documentType.findMany({
      select: { id: true, countryId: true, code: true, label: true, validationRegex: true, isRequired: true },
    }),
  ]);

  const cityOptions = cities.map((c) => ({
    id: c.id,
    name: c.name,
    countryId: c.countryId,
    countryCode: c.countryRef?.code ?? null,
  }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Registro de operador</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cuéntanos cómo ofreces tus experiencias para pedirte solo lo necesario y verificar tu cuenta.
        </p>

        <OperatorRegisterForm cities={cityOptions} documentTypes={documentTypes} registerOperator={registerOperator} />
      </div>
    </div>
  );
}
