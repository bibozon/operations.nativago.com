import prisma from '@/lib/db';

export async function createCategory(data: { name: string; slug: string }) {
  return prisma.category.create({ data });
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
  }>,
) {
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}

export async function createCity(data: { name: string; country: string; countryId?: string }) {
  return prisma.city.create({ data });
}

// El país del operador se deriva de la ciudad que elige al registrarse —
// no hay selector de país aparte todavía (ver plan Fase 2/3). Rechaza si
// la ciudad no tiene countryId asignado (no debería pasar tras el backfill).
export async function createOperator(data: {
  name: string;
  email: string;
  phone?: string;
  cityId: string;
}) {
  const city = await prisma.city.findUnique({ where: { id: data.cityId }, select: { countryId: true } });
  if (!city?.countryId) {
    throw new Error(`City ${data.cityId} has no country assigned`);
  }

  return prisma.operator.create({ data: { ...data, countryId: city.countryId } });
}

async function assertCityBelongsToCountry(cityId: string, countryId: string) {
  const city = await prisma.city.findUnique({ where: { id: cityId }, select: { countryId: true } });
  if (!city) {
    throw new Error(`City ${cityId} not found`);
  }
  if (city.countryId !== countryId) {
    throw new Error(`City ${cityId} does not belong to the operator's country`);
  }
}

// countryId de la experiencia SIEMPRE se deriva del operador dueño —
// nunca se acepta del cliente. Frontera de aislamiento multi-país: un
// operador de Colombia no puede crear una experiencia en una ciudad de
// Brasil, ni pasando el cityId a mano.
export async function createExperience(data: {
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  images?: string[];
  categoryId: string;
  cityId: string;
  operatorId: string;
}) {
  const operator = await prisma.operator.findUnique({
    where: { id: data.operatorId },
    select: { countryId: true },
  });
  if (!operator?.countryId) {
    throw new Error(`Operator ${data.operatorId} has no country assigned`);
  }

  await assertCityBelongsToCountry(data.cityId, operator.countryId);

  return prisma.experience.create({
    data: { ...data, images: data.images ?? [], countryId: operator.countryId },
  });
}

export async function updateExperience(id: string, data: Partial<{
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  images: string[];
  categoryId: string;
  cityId: string;
  operatorId: string;
}>) {
  const existing = await prisma.experience.findUnique({
    where: { id },
    select: { operatorId: true, countryId: true },
  });
  if (!existing) {
    throw new Error(`Experience ${id} not found`);
  }

  // Si se reasigna a otro operador, el país sigue al operador nuevo.
  const targetCountryId = data.operatorId
    ? (await prisma.operator.findUnique({ where: { id: data.operatorId }, select: { countryId: true } }))?.countryId
    : existing.countryId;

  if (!targetCountryId) {
    throw new Error('Could not resolve country for experience update');
  }

  if (data.cityId) {
    await assertCityBelongsToCountry(data.cityId, targetCountryId);
  }

  return prisma.experience.update({
    where: { id },
    data: { ...data, countryId: targetCountryId },
  });
}

export async function createSlot(data: {
  experienceId: string;
  date: Date;
  startTime: Date;
  capacity: number;
}) {
  return prisma.availabilitySlot.create({ data });
}
