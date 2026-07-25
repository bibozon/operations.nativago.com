import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { requireStaffOrAbove } from '@/lib/requireRole';
import { listCitiesByCountry } from '@/services/catalog/cities';
import { BackLink } from '@/components/BackLink';

interface EditOperatorPageProps {
  params: { id: string };
}

const STATUS_OPTIONS = ['DRAFT', 'PENDING', 'INFO_NEEDED', 'APPROVED', 'SUSPENDED', 'REJECTED'] as const;

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100';
const labelClass = 'block text-xs font-medium text-slate-600';

export default async function EditOperatorPage({ params }: EditOperatorPageProps) {
  await requireStaffOrAbove();

  const id = params.id;
  const operator = await prisma.operator.findUnique({ where: { id } });

  if (!operator) {
    redirect('/admin/operators');
  }

  const cities = operator.countryId ? await listCitiesByCountry(operator.countryId) : [];

  async function updateOperator(formData: FormData) {
    'use server';

    await requireStaffOrAbove();

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
      <BackLink href="/admin/operators" label="Operadores" />
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-slate-900">Editar operador</h1>

      <form action={updateOperator} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <label className={labelClass}>Nombre</label>
          <input name="name" defaultValue={operator.name} className={inputClass} />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Teléfono</label>
          <input name="phone" defaultValue={operator.phone ?? ''} className={inputClass} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Categoría</label>
            <input name="categoria" defaultValue={operator.categoria ?? ''} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Representante legal</label>
            <input name="legalRepresentative" defaultValue={operator.legalRepresentative ?? ''} className={inputClass} />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Cuenta de pago</label>
          <input name="paymentAccount" defaultValue={operator.paymentAccount ?? ''} className={inputClass} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Ciudad</label>
            <select name="cityId" defaultValue={operator.cityId} className={inputClass}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Estado</label>
            <select name="verificationStatus" defaultValue={operator.verificationStatus} className={inputClass}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/operators"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
