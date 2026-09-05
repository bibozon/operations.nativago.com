import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/db';
import { getActivePaymentProvider } from '@/infrastructure/payments/PaymentProviderRegistry';
import { generateUniqueBookingCode } from '@/lib/bookingCode';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class CapacityError extends Error {
  constructor(public remainingSpots: number) {
    super('Capacity exceeded');
  }
}

// Reserva pública + inicio de pago. Consumido por el marketplace (o
// cualquier otro cliente de cara al público) — el CMS es la única fuente
// de verdad para reservas, ver plan de arquitectura "CMS como fuente
// única de servicios".
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { ok: rlOk } = checkRateLimit(`booking:${ip}`, 20);
  if (!rlOk) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en unos minutos.' }, { status: 429 });
  }

  const data = await req.json().catch(() => null);
  if (!data) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { experienceId, date, guests, customerName, customerEmail, customerPhone, successUrl, cancelUrl } = data as {
    experienceId?: string;
    date?: string;
    guests?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (!experienceId || !date || !guests || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!EMAIL_RE.test(customerEmail)) {
    return NextResponse.json({ error: 'customerEmail inválido' }, { status: 400 });
  }

  const exp = await prisma.experience.findUnique({
    where: { id: experienceId },
    include: {
      country: { include: { defaultCurrency: true } },
      operator: { select: { name: true, email: true, phone: true } },
      category: { select: { slug: true } },
    },
  });

  if (!exp) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  if (!exp.country) {
    return NextResponse.json({ error: 'Experience has no country configured' }, { status: 500 });
  }

  const safeGuests = Math.max(1, Math.min(50, Number(guests) || 1));
  const price = Number(exp.price);
  const total = price * safeGuests;
  // Buceo exige anticipo del 50% (no el 15% estándar) por los costos
  // operativos previos a la salida (equipo, embarcación, personal) que el
  // operador asume antes de que la actividad ocurra. De ese 50%, el 15% del
  // valor total sigue siendo la comisión de NativaGo — el 35% restante es
  // un adelanto al operador, no una comisión adicional.
  const depositRate = exp.category?.slug === 'buceo' ? 0.5 : 0.15;
  const deposit = total * depositRate;
  const remaining = total - deposit;
  const currencyCode = exp.country.defaultCurrency.code;
  const bookingDate = new Date(date);

  const bookingCode = await generateUniqueBookingCode();

  // Control de cupo: si el operador definió Experience.capacity (> 0), no se
  // permite que la suma de guests de reservas activas para la misma fecha/hora
  // exceda ese cupo. capacity === 0 (default) se trata como "sin límite
  // configurado" para no romper experiencias que nunca lo definieron.
  // El conteo + creación corren en una transacción para acotar la ventana de
  // sobreventa por solicitudes concurrentes (no elimina el race condition por
  // completo sin aislamiento serializable, pero cierra el hueco de "cero
  // validación" reportado en la auditoría).
  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      if (exp.capacity > 0) {
        const existing = await tx.booking.aggregate({
          _sum: { guests: true },
          where: {
            experienceId: exp.id,
            date: bookingDate,
            status: { not: 'CANCELLED' },
          },
        });
        const alreadyBooked = existing._sum.guests ?? 0;
        if (alreadyBooked + safeGuests > exp.capacity) {
          const remainingSpots = Math.max(0, exp.capacity - alreadyBooked);
          throw new CapacityError(remainingSpots);
        }
      }

      return tx.booking.create({
        data: {
          bookingCode,
          experienceId: exp.id,
          countryId: exp.countryId,
          date: bookingDate,
          guests: safeGuests,
          customerName: customerName.slice(0, 100),
          customerEmail: customerEmail.toLowerCase().trim(),
          customerPhone: customerPhone ? String(customerPhone).slice(0, 30) : null,
          amount: total,
          depositAmount: deposit,
          remainingAmount: remaining,
          paymentStatus: 'PENDING',
          paymentType: 'DEPOSIT',
        },
      });
    });
  } catch (error) {
    if (error instanceof CapacityError) {
      return NextResponse.json(
        {
          error:
            error.remainingSpots > 0
              ? `Cupo insuficiente para esta fecha. Quedan ${error.remainingSpots} lugar(es) disponibles.`
              : 'No quedan cupos disponibles para esta fecha.',
        },
        { status: 409 },
      );
    }
    throw error;
  }

  let qrCode: string | null = null;
  try {
    qrCode = await QRCode.toDataURL(`NATIVAGO:${bookingCode}`);
    await prisma.booking.update({ where: { id: booking.id }, data: { qrCode } });
  } catch (error) {
    console.error('Failed to generate QR code for booking', error);
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3001';
  let redirectUrl: string | null = null;
  try {
    const paymentProvider = await getActivePaymentProvider(exp.country.id);

    const session = await paymentProvider.createCheckoutSession({
      amount: { amount: deposit, currencyCode },
      description: exp.title,
      successUrl: successUrl ?? `${base}/success?booking=${booking.id}`,
      cancelUrl: cancelUrl ?? `${base}/cancel`,
      metadata: { bookingId: booking.id.toString(), bookingCode, customerEmail: booking.customerEmail },
    });
    redirectUrl = session.redirectUrl;
  } catch (error) {
    console.error('Failed to create checkout session', error);
    // No es fatal: la reserva ya quedó registrada (status PENDING). El
    // caller decide cómo coordinar el pago si no hay pasarela disponible
    // (p.ej. el marketplace hoy coordina el depósito por WhatsApp).
  }

  return NextResponse.json(
    {
      id: booking.id,
      bookingCode,
      experienceTitle: exp.title,
      date: booking.date,
      guests: booking.guests,
      amount: total,
      depositAmount: deposit,
      remainingAmount: remaining,
      currency: currencyCode,
      qrCode,
      redirectUrl,
      operator: {
        name: exp.operator.name,
        email: exp.operator.email,
        phone: exp.operator.phone,
      },
    },
    { status: 201 },
  );
}

// Lista las reservas de un huésped por email — mismo modelo de "ownership
// por email" que ya usaba el marketplace (sin login del lado del CMS).
// Con `?all=true` + header x-internal-api-key correcto, devuelve todas las
// reservas (uso interno: paneles admin/ventas del marketplace).
export async function GET(req: NextRequest) {
  const wantsAll = req.nextUrl.searchParams.get('all') === 'true';

  if (wantsAll) {
    const key = req.headers.get('x-internal-api-key');
    if (!key || key !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      include: {
        experience: { select: { title: true } },
        country: { select: { code: true, defaultCurrency: { select: { code: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      bookings.map((b) => ({
        id: b.id,
        bookingCode: b.bookingCode,
        experienceTitle: b.experience.title,
        guestName: b.customerName,
        guestEmail: b.customerEmail,
        guestPhone: b.customerPhone,
        date: b.date,
        guests: b.guests,
        status: b.status,
        amount: b.amount,
        depositAmount: b.depositAmount,
        currency: b.country?.defaultCurrency.code ?? 'COP',
        countryCode: b.country?.code ?? 'CO',
        createdAt: b.createdAt,
      })),
    );
  }

  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'email inválido' }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: { customerEmail: email },
    include: {
      experience: { select: { title: true, images: true } },
      country: { select: { defaultCurrency: { select: { code: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      experienceTitle: b.experience.title,
      experienceImage: b.experience.images[0] ?? null,
      date: b.date,
      guests: b.guests,
      status: b.status,
      amount: b.amount,
      depositAmount: b.depositAmount,
      currency: b.country?.defaultCurrency.code ?? 'COP',
      createdAt: b.createdAt,
    })),
  );
}
