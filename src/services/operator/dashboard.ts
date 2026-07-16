import prisma from '@/lib/db';
import { computeTrustLevel } from '@/lib/operatorTrustLevel';
import { documentTypeAppliesTo } from '@/lib/operatorRegistration';

export async function getOperatorDashboardData(operatorId: string) {
  const [experiences, experiencesCount, operator, documentTypes] = await Promise.all([
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
    bookingsThisMonth: 0,
    currencyCode: operator?.country?.defaultCurrency.code ?? 'COP',
    trustLevel,
  };
}

export type OperatorExperienceRow = Awaited<
  ReturnType<typeof getOperatorDashboardData>
>['experiences'][number];
