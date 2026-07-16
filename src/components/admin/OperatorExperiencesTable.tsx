import type { OperatorExperienceRow } from '@/services/operator/dashboard';
import { formatPrice } from '@/domain/entities/Money';

export function OperatorExperiencesTable({
  experiences,
  currencyCode,
}: {
  experiences: OperatorExperienceRow[];
  currencyCode: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Título
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ciudad
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Precio
            </th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {experiences.map((exp) => (
            <tr key={exp.id} className="hover:bg-slate-50/60">
              <td className="px-3 py-2 text-sm font-medium text-slate-900">{exp.title}</td>
              <td className="px-3 py-2 text-sm text-slate-700">{exp.city?.name ?? '-'}</td>
              <td className="px-3 py-2 text-right text-sm text-slate-900">
                {formatPrice(Number(exp.price), currencyCode)}
              </td>
              <td className="px-3 py-2 text-center text-xs">
                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                  Activa
                </span>
              </td>
              <td className="px-3 py-2 text-right text-xs">
                <button className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  Editar
                </button>
              </td>
            </tr>
          ))}
          {experiences.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                Aún no tienes experiencias publicadas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
