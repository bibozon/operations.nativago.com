import prisma from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { ExperienceCardDTO } from '@/domain/entities/Experience';
import type { ExperienceFilters, ExperienceRepository } from '@/domain/repositories/ExperienceRepository';
import { mapExperienceToCard, mapExperiencesToCards } from './mappers/experienceMapper';

const CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  images: true,
  price: true,
  durationMinutes: true,
  category: { select: { id: true, name: true, slug: true, depositRate: true } },
  city: { select: { id: true, name: true, country: true } },
  operator: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.ExperienceSelect;

export class PrismaExperienceRepository implements ExperienceRepository {
  async findMany(countryId: string | null, filters: ExperienceFilters): Promise<ExperienceCardDTO[]> {
    const { citySlug, categorySlug, page = 1, limit = 20, operatorId } = filters;

    // Catálogo público — solo experiencias de operadores ya aprobados y que
    // además pasaron su propia revisión (RN-EXP-09). Sin el primer filtro,
    // un operador DRAFT/PENDING/REJECTED que publica llamando la API
    // directamente (sin pasar por la UI del CMS) aparecía igual en el
    // marketplace real; sin el segundo, cualquier experiencia recién creada
    // quedaba visible antes de que soporte/superadmin la revisara.
    const where: Prisma.ExperienceWhereInput = {
      operator: { verificationStatus: 'APPROVED' },
      status: 'PUBLISHED',
    };

    if (countryId) {
      where.countryId = countryId;
    }

    if (citySlug) {
      const normalizedCityName = citySlug.replace(/-/g, ' ');
      where.city = {
        name: { equals: normalizedCityName, mode: 'insensitive' },
      };
    }

    if (categorySlug) {
      // El marketplace hoy envía el nombre visible de la categoría ("Cultura"),
      // no el slug ("cultura") — igual que el filtro de ciudad de arriba, se
      // acepta por nombre insensible a mayúsculas además del slug real, para
      // no depender de que el llamador use exactamente uno u otro formato.
      where.category = {
        OR: [
          { slug: categorySlug },
          { name: { equals: categorySlug, mode: 'insensitive' } },
        ],
      };
    }

    if (operatorId) {
      where.operatorId = operatorId;
    }

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const experiences = await prisma.experience.findMany({
      where,
      select: CARD_SELECT,
      orderBy: { id: 'asc' },
      skip,
      take: safeLimit,
    });

    return mapExperiencesToCards(experiences);
  }

  async findById(countryId: string | null, id: string): Promise<ExperienceCardDTO | null> {
    const experience = await prisma.experience.findFirst({
      where: {
        id,
        operator: { verificationStatus: 'APPROVED' },
        status: 'PUBLISHED',
        ...(countryId ? { countryId } : {}),
      },
      select: CARD_SELECT,
    });

    if (!experience) return null;
    return mapExperienceToCard(experience);
  }
}
