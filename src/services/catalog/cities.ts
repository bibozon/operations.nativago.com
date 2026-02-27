import prisma from '@/lib/db';

export async function listCities() {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' },
    });

    return cities.map((c) => ({
      id: c.id,
      name: c.name,
      country: c.country,
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error('Failed to fetch cities');
  }
}
