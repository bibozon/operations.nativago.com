import prisma from '@/lib/db';
import type { ExperienceCardDTO } from '@/domain/entities/Experience';
import { PrismaExperienceRepository } from '@/infrastructure/persistence/prisma/PrismaExperienceRepository';
import { resolveCountryId } from '@/infrastructure/persistence/prisma/countryLookup';

const experienceRepository = new PrismaExperienceRepository();

export type ExperienceFilters = {
  citySlug?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
  operatorId?: string;
  // Sin countryCode = sin filtrar por país (comportamiento actual, catálogo
  // público mixto). Se empieza a enviar de verdad cuando el ruteo por
  // subdominio quede activo (Fase 2 del plan de arquitectura).
  countryCode?: string;
};

export async function deleteOperatorIfUnused(operatorId: string) {
  const experienceCount = await prisma.experience.count({ where: { operatorId } });
  if (experienceCount > 0) {
    throw new Error('Cannot delete operator: it is used by experiences');
  }
  await prisma.operator.delete({ where: { id: operatorId } });
}

export async function listExperiences(filters: ExperienceFilters = {}): Promise<ExperienceCardDTO[]> {
  try {
    const { countryCode, ...rest } = filters;
    const countryId = await resolveCountryId(countryCode);
    return await experienceRepository.findMany(countryId, rest);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    throw new Error('Failed to fetch experiences');
  }
}

export async function getExperienceById(
  id: string,
  countryCode?: string
): Promise<ExperienceCardDTO | null> {
  try {
    const countryId = await resolveCountryId(countryCode);
    return await experienceRepository.findById(countryId, id);
  } catch (error) {
    console.error(`Error fetching experience with id ${id}:`, error);
    throw new Error('Failed to fetch experience');
  }
}
