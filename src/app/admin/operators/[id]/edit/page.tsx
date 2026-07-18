import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';
import { listCitiesByCountry } from '@/services/catalog/cities';

interface EditOperatorPageProps {
  params: { id: string };
}

const STATUS_OPTIONS = ['DRAFT', 'PENDING', 'INFO_NEEDED', 'APPROVED', 'SUSPENDED', 'REJECTED'] as const;

export default async function EditOperatorPage({ params }: EditOperatorPageProps) {
  await requireSuperadmin();

  const id = params.id;
  const operator = await prisma.operator.findUnique({ where: { id } });

  if (!operator) {
    redirect('/admin/operators');
  }

  const cities = operator.countryId ? await listCitiesByCountry(operator.countryId) : [];

  async function updateOperator(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const name = (formData.get('name') as string) ?? '';
    const phone = (formData.get('phone') as string) ?? '';
    const categoria = (formData.get('categoria') as string) ?? '';
    const legalRepresentative = (formData.get('legalRepresentative') as string) ?? '';
    const paymentAccount = (formData.get('paymentAccount') as string) ?? '';
    const cityId = (formData.get('cityId') as string) ?? '';
    const verificationStatus = (formData.get('verificationStatus') as string) ?? '';

    if (!name || !cityId) return;

    await prisma.operator.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        categoria: categoria || null,
        legalRepresentative: legalRepresentative || null,
        paymentAccount: paymentAccount || null,
        cityId,
        verificationStatus: verificationStatus as typeof STATUS_OPTIONS[number],
      },
    });

    redirect('/admin/operators');
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-semibold">Editar operador</h1>
      <form action={updateOperator} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Nombre</label>
          <input
            name="name"
            defaultValue={operator.name}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Teléfono</label>
          <input
            name="phone"
            defaultValue={operator.phone ?? ''}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Categoría</label>
          <input
            name="categoria"
            defaultValue={operator.categoria ?? ''}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Representante legal</label>
          <input
            name="legalRepresentative"
            defaultValue={operator.legalRepresentative ?? ''}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Cuenta de pago</label>
          <input
            name="paymentAccount"
            defaultValue={operator.paymentAccount ?? ''}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Ciudad</label>
          <select
            name="cityId"
            defaultValue={operator.cityId}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Estado</label>
          <select
            name="verificationStatus"
            defaultValue={operator.verificationStatus}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
