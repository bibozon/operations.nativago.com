
import prisma from '@/lib/db';

export async function deleteCityIfUnused(cityId: number) {
  const experienceCount = await prisma.experience.count({ where: { cityId } });
  if (experienceCount > 0) {
    throw new Error('Cannot delete city: it is used by experiences');
  }
  await prisma.city.delete({ where: { id: cityId } });
}

export async function listCities() {
  try {
    const cities = await prisma.city.findMany({
      where: {
        experiences: {
          some: {},
        },
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { experiences: true },
        },
      },
    });

    return cities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.name.toLowerCase().replace(/ /g, '-'),
      experienceCount: c._count.experiences,
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error('Failed to fetch cities');
  }
}
