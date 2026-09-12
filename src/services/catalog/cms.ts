import prisma from '@/lib/db';
import { logExperienceChange, diffFields, type AuditActor } from '@/lib/auditLog';

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
export async function createExperience(
  data: {
    title: string;
    description: string;
    price: number;
    durationMinutes: number;
    images?: string[];
    categoryId: string;
    cityId: string;
    operatorId: string;
  },
  actor: AuditActor,
) {
  const operator = await prisma.operator.findUnique({
    where: { id: data.operatorId },
    select: { countryId: true },
  });
  if (!operator?.countryId) {
    throw new Error(`Operator ${data.operatorId} has no country assigned`);
  }

  await assertCityBelongsToCountry(data.cityId, operator.countryId);

  // Toda experiencia nueva entra en revisión (RN-EXP-09) — solo soporte o
  // superadmin pueden pasarla a PUBLISHED desde /admin/experiences.
  const experience = await prisma.experience.create({
    data: { ...data, images: data.images ?? [], countryId: operator.countryId, status: 'PENDING' },
  });

  await logExperienceChange({
    experienceId: experience.id,
    action: 'CREATE',
    changes: { title: data.title, price: data.price, categoryId: data.categoryId, cityId: data.cityId, operatorId: data.operatorId },
    actor,
  });

  return experience;
}

export async function setExperienceStatus(
  id: string,
  status: 'PUBLISHED' | 'REJECTED' | 'PENDING',
  actor: AuditActor,
) {
  const existing = await prisma.experience.findUnique({ where: { id }, select: { status: true } });
  const updated = await prisma.experience.update({ where: { id }, data: { status } });

  await logExperienceChange({
    experienceId: id,
    action: 'STATUS_CHANGE',
    changes: { status: { from: existing?.status ?? null, to: status } },
    actor,
  });

  return updated;
}

export async function deleteExperience(id: string, actor: AuditActor) {
  const existing = await prisma.experience.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.experience.delete({ where: { id } });

  await logExperienceChange({
    experienceId: id,
    action: 'DELETE',
    changes: { title: existing.title, operatorId: existing.operatorId, status: existing.status },
    actor,
  });

  return existing;
}

export async function updateExperience(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    price: number;
    durationMinutes: number;
    images: string[];
    categoryId: string;
    cityId: string;
    operatorId: string;
  }>,
  actor: AuditActor,
) {
  const existing = await prisma.experience.findUnique({ where: { id } });
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

  const updated = await prisma.experience.update({
    where: { id },
    data: { ...data, countryId: targetCountryId },
  });

  const changes = diffFields(existing as unknown as Record<string, unknown>, data as Record<string, unknown>);
  if (Object.keys(changes).length > 0) {
    await logExperienceChange({ experienceId: id, action: 'UPDATE', changes, actor });
  }

  return updated;
}

export async function createSlot(data: {
  experienceId: string;
  date: Date;
  startTime: Date;
  capacity: number;
}) {
  return prisma.availabilitySlot.create({ data });
}
