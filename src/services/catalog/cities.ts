import prisma from '@/lib/db';
import { PrismaCityRepository } from '@/infrastructure/persistence/prisma/PrismaCityRepository';
import { resolveCountryId } from '@/infrastructure/persistence/prisma/countryLookup';

const cityRepository = new PrismaCityRepository();

export async function deleteCityIfUnused(cityId: string) {
  const [experienceCount, operatorCount] = await Promise.all([
    prisma.experience.count({ where: { cityId } }),
    prisma.operator.count({ where: { cityId } }),
  ]);
  if (experienceCount > 0 || operatorCount > 0) {
    throw new Error('Cannot delete city: it is used by experiences or operators');
  }
  await prisma.city.delete({ where: { id: cityId } });
}

export async function listCities(countryCode?: string) {
  try {
    const countryId = await resolveCountryId(countryCode);
    return await cityRepository.findManyWithExperiences(countryId);
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error('Failed to fetch cities');
  }
}

// Todas las ciudades de un país (con o sin experiencias) — usado en los
// selects de los formularios de operador, siempre acotado a countryId.
export async function listCitiesByCountry(countryId: string) {
  return cityRepository.findManyByCountry(countryId);
}
