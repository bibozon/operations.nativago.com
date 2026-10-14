import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth';

// Comisión fija del piloto: 10% por reserva con check-in confirmado,
// mientras se construye la meta colectiva de 100 reservas entre todos los
// operadores pioneros (ver doc interno "modelo de negocio del piloto").
// A partir de esa meta, la comisión por operador se revisa según su
// valoración (>=4.5/5 mantiene 10% por 1 año; si no, sube a 15%) — ese
// ajuste es manual y no está automatizado aquí todavía.
const PILOT_COMMISSION_RATE = 0.10;
const PILOT_GOAL_BOOKINGS = 100;

async function getPioneerCommissions() {
  const pioneers = await prisma.operator.findMany({
    where: { isPioneer: true },
    select: {
      id: true,
      name: true,
      email: true,
      verificationStatus: true,
      firstActivatedBookingDate: true,
      experiences: {
        select: {
          bookings: {
            where: { status: 'CONFIRMED' },
            select: { amount: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return pioneers.map((op) => {
    const confirmedBookings = op.experiences.flatMap((e) => e.bookings);
    const confirmedCount = confirmedBookings.length;
    const totalAmount = confirmedBookings.reduce((sum, b) => sum + b.amount, 0);
    const commissionOwed = totalAmount * PILOT_COMMISSION_RATE;

    return {
      id: op.id,
      name: op.name,
      email: op.email,
      verificationStatus: op.verificationStatus,
      firstActivatedBookingDate: op.firstActivatedBookingDate,
      confirmedCount,
      totalAmount,
      commissionOwed,
    };
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.round(n));
}

export default async function CommissionsPage() {
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

  const rows = await getPioneerCommissions();

  const totalConfirmed = rows.reduce((sum, r) => sum + r.confirmedCount, 0);
  const totalOwed = rows.reduce((sum, r) => sum + r.commissionOwed, 0);
  const progressPct = Math.min(100, Math.round((totalConfirmed / PILOT_GOAL_BOOKINGS) * 100));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Comisiones — piloto de operadores fundadores
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          10% por reserva con check-in confirmado. Factura manual periódica — nunca se cobra por no-shows.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Meta colectiva hacia Fase 2
          </h2>
          <span className="text-sm font-semibold text-teal-700">
            {totalConfirmed} / {PILOT_GOAL_BOOKINGS} reservas confirmadas
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Suma de reservas con check-in confirmado entre TODOS los operadores pioneros, en toda la Región de los Lagos.
          Al superar {PILOT_GOAL_BOOKINGS} se activa Fase 2 (se evalúa valoración por operador: ≥4.5/5 conserva 10% por 1 año, si no sube a 15%).
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Operador pionero
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reservas confirmadas
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Valor total actividades
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  10% a facturar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="px-3 py-2 text-center text-sm text-slate-900">
                    {r.confirmedCount}
                  </td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">
                    {formatMoney(r.totalAmount)}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-teal-700">
                    {formatMoney(r.commissionOwed)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                    No hay operadores marcados como pioneros todavía. Márcalos desde{' '}
                    <span className="font-medium">Operadores → Editar</span>.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <td className="px-3 py-2 text-sm text-slate-900">Total</td>
                  <td className="px-3 py-2 text-center text-sm text-slate-900">{totalConfirmed}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-900">
                    {formatMoney(rows.reduce((s, r) => s + r.totalAmount, 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-sm text-teal-700">{formatMoney(totalOwed)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
