import prisma from '@/lib/db';
import type { Prisma, Experience, Category, City, Operator } from '@prisma/client';
import { mapExperienceToCard, mapExperiencesToCards, type ExperienceCardDTO } from './catalog.mapper';

export type ExperienceFilters = {
  citySlug?: string;
  categorySlug?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  operatorId?: number;
};

export async function listExperiences(filters: ExperienceFilters = {}): Promise<ExperienceCardDTO[]> {
  try {
    const { citySlug, categorySlug, featured, page = 1, limit = 20, operatorId } = filters;

    const where: Prisma.ExperienceWhereInput = {};

    if (citySlug) {
      const normalizedCityName = citySlug.replace(/-/g, ' ');
      where.city = {
        name: {
          equals: normalizedCityName,
          mode: 'insensitive',
        },
      };
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (typeof featured === 'boolean') {
      where.featured = featured;
    }

    if (typeof operatorId === 'number') {
      where.operatorId = operatorId;
    }

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;

    const skip = (safePage - 1) * safeLimit;

    const experiences = await prisma.experience.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        city: {
          select: { id: true, name: true },
        },
        operator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { id: 'asc' },
      skip,
      take: safeLimit,
    });

    return mapExperiencesToCards(experiences as Array<
      Experience & {
        category: Pick<Category, 'id' | 'name' | 'slug'>;
        city: Pick<City, 'id' | 'name'>;
        operator: Pick<Operator, 'id' | 'name'>;
      }
    >);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    throw new Error('Failed to fetch experiences');
  }
}

export async function getExperienceById(id: number): Promise<ExperienceCardDTO | null> {
  try {
    const experience = await prisma.experience.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        city: {
          select: { id: true, name: true },
        },
        operator: {
          select: { id: true, name: true },
        },
      },
    });

    if (!experience) return null;

    return mapExperienceToCard(
      experience as Experience & {
        category: Pick<Category, 'id' | 'name' | 'slug'>;
        city: Pick<City, 'id' | 'name'>;
        operator: Pick<Operator, 'id' | 'name'>;
      }
    );
  } catch (error) {
    console.error(`Error fetching experience with id ${id}:`, error);
    throw new Error('Failed to fetch experience');
  }
}
