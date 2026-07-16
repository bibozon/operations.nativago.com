import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/requireRole';
import { TrustLevelCard } from '@/components/admin/TrustLevelCard';
import { getOperatorDashboardData } from '@/services/operator/dashboard';
import { REVIEW_STATE_LABEL } from '@/lib/operatorStatus';

const STATUS_MESSAGES: Record<string, { title: string; body: string; color: string }> = {
  DRAFT: {
    title: 'Tu cuenta está siendo configurada',
    body:  'Hemos recibido tu registro. Completa tus documentos para que nuestro equipo pueda revisar tu cuenta. Mientras tanto, puedes explorar el panel.',
    color: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  PENDING: {
    title: 'Tu cuenta está en revisión',
    body:  'Recibimos tus documentos. El equipo de NativaGo los revisará en menos de 48 horas hábiles. Te notificaremos por email cuando haya una actualización.',
    color: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  INFO_NEEDED: {
    title: 'Necesitamos información adicional',
    body:  'El equipo de NativaGo revisó tu solicitud y necesita que completes o corrijas algo antes de continuar.',
    color: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  APPROVED: {
    title: '¡Tu cuenta fue aprobada!',
    body:  'Ya puedes crear y publicar tus experiencias en NativaGo.',
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  SUSPENDED: {
    title: 'Tu cuenta está suspendida',
    body:  'Contacta al equipo de NativaGo para conocer los motivos y cómo resolver la situación.',
    color: 'border-red-200 bg-red-50 text-red-800',
  },
};

async function submitForReview(formData: FormData) {
  'use server';
  const id = (formData.get('operatorId') as string) ?? '';
  if (!id) return;
  await prisma.operator.update({
    where: { id, verificationStatus: 'DRAFT' },
    data: { verificationStatus: 'PENDING' },
  });
  revalidatePath('/operator/dashboard');
}

export default async function OperatorDashboardPage() {
  const auth = await requireRole(['OPERATOR_AGENCY', 'OPERATOR_FREELANCE']);

  if (!auth.operatorId) {
    redirect('/register/operator');
  }

  const operator = await prisma.operator.findUnique({
    where: { id: auth.operatorId },
    select: {
      id:                 true,
      name:               true,
      verificationStatus: true,
      contractAccepted:   true,
      type:               true,
      categoria:          true,
      paymentAccount:     true,
      reviewNotes:        true,
      createdAt:          true,
      documents:          true,
    },
  });

  if (!operator) {
    redirect('/register/operator');
  }

  // Si ya está aprobado y aceptó el contrato, mandarlo al panel completo
  if (operator.verificationStatus === 'APPROVED' && operator.contractAccepted) {
    redirect(operator.type === 'AGENCY' ? '/admin/agency' : '/admin/freelance');
  }

  // Si está aprobado pero no aceptó el contrato, mandarlo a aceptar
  if (operator.verificationStatus === 'APPROVED' && !operator.contractAccepted) {
    redirect('/legal/operador/aceite');
  }

  const { trustLevel } = await getOperatorDashboardData(auth.operatorId);

  const status        = operator.verificationStatus as string;
  const statusMsg     = STATUS_MESSAGES[status] ?? STATUS_MESSAGES.PENDING;
  const statusLabel   = REVIEW_STATE_LABEL[status as keyof typeof REVIEW_STATE_LABEL] ?? status;
  const docCount      = operator.documents.length;
  const hasPayment    = Boolean(operator.paymentAccount);
  const hasCategoria  = Boolean(operator.categoria);

  // Progreso del perfil: 5 hitos
  const milestones = [
    { label: 'Cuenta creada',           done: true },
    { label: 'Documentos enviados',     done: docCount > 0 },
    { label: 'Categoría seleccionada',  done: hasCategoria },
    { label: 'Cuenta de pago registrada', done: hasPayment },
    { label: 'Cuenta aprobada',         done: operator.verificationStatus === 'APPROVED' },
  ];
  const completedCount = milestones.filter((m) => m.done).length;
  const progressPct    = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              NG
            </div>
            <span className="text-sm font-semibold text-slate-900">NativaGo</span>
            <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden sm:block">{auth.email}</span>
            <a
              href="/api/auth/logout"
              className="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Salir
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Bienvenida */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Hola, {auth.name ?? operator.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Panel de operador · NativaGo
          </p>
        </div>

        {/* Banner de estado */}
        <div className={`rounded-xl border px-4 py-4 ${statusMsg.color}`}>
          <p className="font-semibold">{statusMsg.title}</p>
          <p className="mt-1 text-sm">{statusMsg.body}</p>
          {operator.reviewNotes && status === 'INFO_NEEDED' && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-white/60 px-3 py-2 text-sm">
              <p className="font-medium text-amber-800">El equipo de NativaGo indicó:</p>
              <p className="mt-0.5 text-amber-700">{operator.reviewNotes}</p>
            </div>
          )}
          {status === 'DRAFT' && (
            <form action={submitForReview} className="mt-4">
              <input type="hidden" name="operatorId" value={operator.id} />
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                Enviar para revisión →
              </button>
              <p className="mt-1.5 text-xs opacity-70">
                Asegúrate de haber subido todos tus documentos antes de enviar.
              </p>
            </form>
          )}
        </div>

        {/* Progreso */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Completar perfil</p>
            <span className="text-xs font-medium text-slate-500">
              {completedCount}/{milestones.length} — {progressPct}%
            </span>
          </div>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <ul className="space-y-2">
            {milestones.map((m) => (
              <li key={m.label} className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    m.done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {m.done ? '✓' : '·'}
                </span>
                <span className={m.done ? 'text-slate-700' : 'text-slate-400'}>{m.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Grid: trust + accesos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TrustLevelCard trustLevel={trustLevel} />

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Accesos rápidos</p>
            <ul className="mt-3 space-y-2">
              {!hasPayment && (
                <li>
                  <Link
                    href="/register/operator"
                    className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700 hover:bg-amber-100"
                  >
                    <span>→</span> Registrar cuenta de pago
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/legal/operador"
                  target="_blank"
                  className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span>→</span> Leer contrato de operadores
                </Link>
              </li>
              <li>
                <a
                  href="mailto:operadores@nativago.com"
                  className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span>→</span> Contactar al equipo NativaGo
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Nota del modelo de negocio */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <strong className="font-semibold text-slate-600">Recuerda:</strong> NativaGo cobra al cliente el 15% del valor
          total como anticipo de reserva. Tú cobras el 85% restante directamente al cliente en el lugar de la
          actividad — ese 85% debe cubrir todos los costos del servicio, incluyendo seguros y equipamiento.
          NativaGo no cobra ni intermedia seguros.
        </div>
      </main>
    </div>
  );
}
