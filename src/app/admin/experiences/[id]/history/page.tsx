import prisma from '@/lib/db';
import { requireStaffOrAbove } from '@/lib/requireRole';
import { BackLink } from '@/components/BackLink';

interface HistoryPageProps {
  params: { id: string };
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Edición',
  STATUS_CHANGE: 'Cambio de estado',
  DELETE: 'Eliminación',
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700',
  UPDATE: 'bg-sky-50 text-sky-700',
  STATUS_CHANGE: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-red-50 text-red-700',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
}

export default async function ExperienceHistoryPage({ params }: HistoryPageProps) {
  // Solo soporte/superadmin — el historial completo incluye quién rechazó o
  // eliminó una experiencia, no es algo que el operador dueño deba ver.
  await requireStaffOrAbove();

  const { id } = params;

  const [experience, logs] = await Promise.all([
    prisma.experience.findUnique({ where: { id }, select: { title: true } }),
    prisma.experienceAuditLog.findMany({
      where: { experienceId: id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const title = experience?.title ?? (logs.find((l) => l.action === 'DELETE')?.changes as { title?: string } | null)?.title ?? id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <BackLink href="/admin/experiences" label="Experiencias" />
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Historial — {title}</h1>
      {!experience && (
        <p className="mb-4 text-sm text-amber-700">Esta experiencia ya no existe (fue eliminada).</p>
      )}

      <div className="mt-4 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${ACTION_STYLES[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                {ACTION_LABELS[log.action] ?? log.action}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(log.createdAt).toLocaleString('es-CO')}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-700">
              {log.performedByEmail ?? 'Usuario desconocido'}
              {log.performedByRole ? ` · ${log.performedByRole}` : ''}
            </p>

            {log.changes != null && typeof log.changes === 'object' && (
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                {Object.entries(log.changes as Record<string, unknown>).map(([field, value]) => (
                  <li key={field}>
                    <span className="font-medium text-slate-800">{field}:</span>{' '}
                    {value && typeof value === 'object' && 'from' in (value as object) && 'to' in (value as object) ? (
                      <>
                        {formatValue((value as { from: unknown }).from)} → {formatValue((value as { to: unknown }).to)}
                      </>
                    ) : (
                      formatValue(value)
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {logs.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No hay historial registrado para esta experiencia.
          </p>
        )}
      </div>
    </div>
  );
}
