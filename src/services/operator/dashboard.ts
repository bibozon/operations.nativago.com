import prisma from '@/lib/db';
import { computeTrustLevel } from '@/lib/operatorTrustLevel';
import { documentTypeAppliesTo } from '@/lib/operatorRegistration';

// Reservas que le llegan a ESTE operador (join por Experience.operatorId,
// no por un campo directo en Booking). "upcoming" son las que todavía no
// pasaron y no están canceladas — lo primero que un operador necesita ver
// al entrar al panel. bookingsThisMonth cuenta por fecha de creación de la
// reserva (cuándo se reservó), no por fecha de la actividad.
export async function getOperatorBookings(operatorId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allBookings, bookingsThisMonth] = await Promise.all([
    prisma.booking.findMany({
      where: { experience: { operatorId } },
      include: { experience: { select: { title: true, durationMinutes: true } } },
      orderBy: { date: 'asc' },
      take: 100,
    }),
    prisma.booking.count({
      where: { experience: { operatorId }, createdAt: { gte: monthStart } },
    }),
  ]);

  const upcoming = allBookings.filter((b) => b.status !== 'CANCELLED' && b.date >= now);
  const past = allBookings.filter((b) => b.status === 'CANCELLED' || b.date < now);

  return { upcoming, past, bookingsThisMonth };
}

export type OperatorBookingRow = Awaited<ReturnType<typeof getOperatorBookings>>['upcoming'][number];

export async function getOperatorDashboardData(operatorId: string) {
  const [experiences, experiencesCount, operator, documentTypes, bookingsData] = await Promise.all([
    prisma.experience.findMany({
      where: { operatorId },
      include: {
        city: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.experience.count({ where: { operatorId } }),
    prisma.operator.findUnique({
      where: { id: operatorId },
      select: {
        type: true,
        countryId: true,
        verificationStatus: true,
        contractAccepted: true,
        createdAt: true,
        documents: true,
        country: {
          select: { code: true, defaultCurrency: { select: { code: true } } },
        },
      },
    }),
    prisma.documentType.findMany(),
    getOperatorBookings(operatorId),
  ]);

  const requiredForCountry = operator?.countryId
    ? documentTypes.filter(
        (dt) => dt.countryId === operator.countryId && dt.isRequired && documentTypeAppliesTo(dt.code, operator.type),
      )
    : [];
  const verifiedIds = new Set((operator?.documents ?? []).filter((d) => d.verified).map((d) => d.documentTypeId));
  const allRequiredDocumentsVerified =
    requiredForCountry.length > 0 && requiredForCountry.every((dt) => verifiedIds.has(dt.id));

  const trustLevel = operator
    ? computeTrustLevel({
        verificationStatus: operator.verificationStatus,
        contractAccepted: operator.contractAccepted,
        createdAt: operator.createdAt,
        experiencesCount,
        allRequiredDocumentsVerified,
      })
    : null;

  return {
    experiences,
    experiencesCount,
    bookingsThisMonth: bookingsData.bookingsThisMonth,
    upcomingBookings: bookingsData.upcoming,
    pastBookings: bookingsData.past,
    currencyCode: operator?.country?.defaultCurrency.code ?? 'COP',
    trustLevel,
  };
}

export type OperatorExperienceRow = Awaited<
  ReturnType<typeof getOperatorDashboardData>
>['experiences'][number];
