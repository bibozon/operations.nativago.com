import prisma from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function OperatorRegisterPage() {
  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });

  async function registerOperator(formData: FormData) {
    'use server';

    const name = (formData.get('name') as string) ?? '';
    const email = (formData.get('email') as string) ?? '';
    const phone = (formData.get('phone') as string) ?? '';
    const type = (formData.get('type') as string) ?? '';
    const cityId = Number(formData.get('cityId'));
    const licenseNumber = (formData.get('licenseNumber') as string) ?? '';
    const cnpj = (formData.get('cnpj') as string) ?? '';
    const cpf = (formData.get('cpf') as string) ?? '';
    const cadastur = (formData.get('cadastur') as string) ?? '';
    const liabilityAccepted = formData.get('liabilityAccepted') === 'on';
    const file = formData.get('licenseDocument');

    if (!name || !email || !type || !Number.isFinite(cityId) || !liabilityAccepted) {
      return;
    }

    let licenseDocumentUrl: string | null = null;

    if (file && file instanceof File && file.size > 0) {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        const json = (await res.json()) as { url?: string };
        if (json.url) {
          licenseDocumentUrl = json.url;
        }
      }
    }

    await prisma.operator.create({
      data: {
        name,
        email,
        phone: phone || null,
        cityId,
        type: type === 'FREELANCE' ? 'FREELANCE' : 'AGENCY',
        verificationStatus: 'PENDING',
        licenseNumber: licenseNumber || null,
        licenseDocument: licenseDocumentUrl,
        cnpj: cnpj || null,
        cpf: cpf || null,
        cadastur: cadastur || null,
        liabilityAccepted: true,
        liabilityAcceptedAt: new Date(),
      },
    });

    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Registro de operador</h1>
        <p className="mt-1 text-sm text-slate-600">
          Envia tus credenciales turísticas para que podamos verificar tu cuenta
          antes de publicar experiencias.
        </p>

        <form
          action={registerOperator}
          className="mt-6 space-y-4"
          encType="multipart/form-data"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Nombre operador
            </label>
            <input
              name="name"
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Teléfono
            </label>
            <input
              name="phone"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Ciudad
            </label>
            <select
              name="cityId"
              className="w-full rounded border px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona una ciudad</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Tipo
            </label>
            <select
              name="type"
              className="w-full rounded border px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona un tipo</option>
              <option value="AGENCY">Agencia</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Número licencia turística
            </label>
            <input
              name="licenseNumber"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              CNPJ (agência)
            </label>
            <input
              name="cnpj"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              CPF (freelancer)
            </label>
            <input
              name="cpf"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Número CADASTUR
            </label>
            <input
              name="cadastur"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Documento licencia (upload)
            </label>
            <input
              type="file"
              name="licenseDocument"
              accept="application/pdf,image/*"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-600">
            <input
              id="liabilityAccepted"
              name="liabilityAccepted"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              required
            />
            <label htmlFor="liabilityAccepted" className="leading-snug">
              Declaro que sou responsável pela execução dos serviços turísticos oferecidos e possuo todas as licenças exigidas pelas autoridades brasileiras.
            </label>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Enviar para verificación
          </button>
        </form>
      </div>
    </div>
  );
}
