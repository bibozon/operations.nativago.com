import prisma from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { CityListItem, CityOption, CityRepository } from '@/domain/repositories/CityRepository';

export class PrismaCityRepository implements CityRepository {
  async findManyWithExperiences(countryId: string | null): Promise<CityListItem[]> {
    const where: Prisma.CityWhereInput = {
      experiences: { some: {} },
      ...(countryId ? { countryId } : {}),
    };

    const cities = await prisma.city.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { experiences: true } } },
    });

    return cities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.name.toLowerCase().replace(/ /g, '-'),
      experienceCount: c._count.experiences,
    }));
  }

  async findManyByCountry(countryId: string): Promise<CityOption[]> {
    return prisma.city.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }
}
