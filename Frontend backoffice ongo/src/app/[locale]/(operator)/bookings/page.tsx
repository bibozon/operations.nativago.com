import { getTranslations } from "next-intl/server";

interface BookingRow {
  id: string;
  cliente: string;
  clienteEmail: string;
  experiencia: string;
  fecha: string;
  estado: string;
  arrival_at: string | null;
  deadline: string;
  monto_85: string;
  comunicaciones: { id: string; channel: string; status: string; sentAt: string }[];
}

export default async function OperatorBookings({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/bookings`, {
    cache: "no-store",
  });
  const bookings: BookingRow[] = await res.json();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("nav.bookings")}</h2>
      <p className="text-sm text-slate-600">
        Panel leyendo reservas del marketplace (read-only) sobre la DB compartida.
      </p>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Experiencia</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Arrival</th>
              <th className="px-3 py-2">Deadline</th>
              <th className="px-3 py-2">Monto 85%</th>
              <th className="px-3 py-2">Comunicaciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <div className="font-medium">{b.cliente}</div>
                  <div className="text-xs text-slate-500">{b.clienteEmail}</div>
                </td>
                <td className="px-3 py-2">{b.experiencia}</td>
                <td className="px-3 py-2">{new Date(b.fecha).toLocaleString()}</td>
                <td className="px-3 py-2">{b.estado}</td>
                <td className="px-3 py-2">{b.arrival_at ? new Date(b.arrival_at).toLocaleString() : "-"}</td>
                <td className="px-3 py-2">{new Date(b.deadline).toLocaleString()}</td>
                <td className="px-3 py-2 font-semibold">
                  {b.monto_85}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {b.comunicaciones.length === 0
                    ? "Sin comunicaciones"
                    : b.comunicaciones
                        .map((c) => `${c.channel} (${c.status})`)
                        .join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
