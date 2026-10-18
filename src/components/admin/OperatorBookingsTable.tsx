import type { OperatorBookingRow } from '@/services/operator/dashboard';
import { formatPrice } from '@/domain/entities/Money';
import { cancelOperatorBooking } from '@/services/operator/bookingActions';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

// PENDING acá significa "reservada, falta el check-in" — no "esperando que
// el operador la apruebe" (no existe ese paso hoy, ver nota en
// bookingActions.ts). Se rotula así para no insinuar un flujo que no existe.
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Reservada · falta check-in',
  CONFIRMED: 'Check-in confirmado',
  CANCELLED: 'Cancelada',
};

export function OperatorBookingsTable({
  bookings,
  currencyCode,
  showCancelAction = true,
}: {
  bookings: OperatorBookingRow[];
  currencyCode: string;
  showCancelAction?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actividad</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Huéspedes</th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Monto</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
            {showCancelAction && (
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50/60">
              <td className="px-3 py-2 text-sm text-slate-700 whitespace-nowrap">
                {b.date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' })}
              </td>
              <td className="px-3 py-2 text-sm font-medium text-slate-900">{b.experience.title}</td>
              <td className="px-3 py-2 text-sm text-slate-700">
                <div>{b.customerName}</div>
                {b.customerPhone && <div className="text-xs text-slate-400">{b.customerPhone}</div>}
              </td>
              <td className="px-3 py-2 text-center text-sm text-slate-700">{b.guests}</td>
              <td className="px-3 py-2 text-right text-sm text-slate-900">{formatPrice(Number(b.amount), currencyCode)}</td>
              <td className="px-3 py-2 text-center text-xs">
                <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING}`}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </td>
              {showCancelAction && (
                <td className="px-3 py-2 text-right text-xs">
                  {b.status !== 'CANCELLED' ? (
                    <form action={cancelOperatorBooking} className="inline-flex items-center gap-1.5 justify-end">
                      <input type="hidden" name="bookingCode" value={b.bookingCode ?? ''} />
                      <input
                        type="text"
                        name="reason"
                        placeholder="Motivo (opcional)"
                        maxLength={300}
                        className="w-32 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 placeholder:text-slate-300"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={showCancelAction ? 7 : 6} className="px-3 py-6 text-center text-sm text-slate-500">
                No tienes reservas por aquí todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
