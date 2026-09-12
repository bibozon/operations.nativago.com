import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Confirmación de pago server-to-server — la llama el backend del
// marketplace (no el navegador del cliente) desde su webhook de
// MercadoPago (POST /api/webhooks/mercadopago/[country] en nativago-mvp)
// cuando una orden de pago queda APPROVED para una reserva que vive en el
// CMS (flujo USE_CMS=true). Mismo patrón minimalista que ya usa el webhook
// de Stripe (src/app/api/stripe/webhook/route.ts): solo toca paymentStatus,
// no reescribe booking.status — un operador o SUPERADMIN sigue confirmando
// la reserva en sí por su propio flujo.
//
// Nunca se acepta sin autenticar: es un endpoint que cambia estado
// financiero sin verificación de ownership por email (a diferencia del
// resto de /api/orders/*), así que el único control de acceso es este
// bearer token compartido entre los dos backends.
export const runtime = 'nodejs';

function isAuthorized(req: NextRequest): boolean {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const expected = process.env.CMS_ORDERS_API_KEY;
  return Boolean(bearer && expected && bearer === expected);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;
  // provider/externalOrderId son informativos (quedan en logs, no hay
  // columna en Booking para guardarlos) — confirman qué pasarela llamó,
  // útil para depurar sin tener que cruzar con la tabla Payment del
  // marketplace (que vive en su propia base de datos, separada de esta).
  const body = await req.json().catch(() => ({}));
  const provider = typeof body?.provider === 'string' ? body.provider : 'unknown';
  const externalOrderId = typeof body?.externalOrderId === 'string' ? body.externalOrderId : null;

  const booking = await prisma.booking.findUnique({ where: { bookingCode: code } });
  if (!booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  // Idempotente a propósito: MercadoPago puede reintentar la notificación
  // del webhook, y el marketplace puede reintentar esta llamada si la
  // primera se cae por timeout — una segunda confirmación no debe fallar
  // ni volver a disparar ningún efecto secundario.
  if (booking.paymentStatus === 'PAID') {
    console.log(`[orders/confirm-payment] ${code} ya estaba PAID — sin cambios (provider=${provider})`);
    return NextResponse.json({ ok: true, alreadyPaid: true, bookingCode: code });
  }

  await prisma.booking.update({
    where: { bookingCode: code },
    data: { paymentStatus: 'PAID' },
  });

  console.log(
    `[orders/confirm-payment] ${code} marcado como PAID (provider=${provider}` +
      `${externalOrderId ? `, externalOrderId=${externalOrderId}` : ''})`,
  );

  return NextResponse.json({ ok: true, alreadyPaid: false, bookingCode: code });
}
