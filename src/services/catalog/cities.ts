import prisma from '@/lib/db';

export async function listCities() {
  const cities = await prisma.city.findMany({
    orderBy: { name: 'asc' },
  });

  return cities.map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
  }));
}
