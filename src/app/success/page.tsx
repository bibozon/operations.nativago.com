import prisma from '@/lib/db';

type SuccessPageProps = {
  searchParams?: {
    booking?: string;
  };
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const bookingId = searchParams?.booking;

  let qrCode: string | null = null;

  if (bookingId) {
    const id = Number(bookingId);

    if (!Number.isNaN(id)) {
      const booking = await prisma.booking.findUnique({
        where: { id },
        select: { qrCode: true },
      });

      qrCode = booking?.qrCode ?? null;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white px-6 py-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-emerald-700">Reserva confirmada</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu pago se ha procesado correctamente. Recibirás un correo con los detalles de tu experiencia.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Você paga apenas 15% agora para reservar. O restante é pago diretamente ao operador no dia da atividade.
        </p>

        {qrCode && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500">
              Presenta este código al operador el día de la actividad.
            </p>
            <img
              src={qrCode}
              alt="Código QR de la reserva"
              className="h-48 w-48 rounded-lg border border-slate-200 bg-white p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
