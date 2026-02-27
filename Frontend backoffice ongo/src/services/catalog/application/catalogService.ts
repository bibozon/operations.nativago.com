import { catalogPrisma } from "../infrastructure/db/client";

export async function listExperiences() {
  return catalogPrisma.experience.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getExperienceById(id: string) {
  return catalogPrisma.experience.findUnique({ where: { id } });
}

export async function listSlots() {
  return catalogPrisma.experienceSlot.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export interface CreateOrUpdateExperienceInput {
  id?: string;
  partnerId: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: string;
  cityId?: string | null;
  categoryId?: string | null;
}

// Regla: no permitir Experience sin Partner.
// Aquí se podría llamar al servicio Partner vía HTTP para validar partnerId.
export async function createOrUpdateExperience(input: CreateOrUpdateExperienceInput) {
  if (!input.partnerId) {
    throw new Error("partnerId is required");
  }

  const data = {
    partnerId: input.partnerId,
    title: input.title,
    description: input.description,
    durationMinutes: input.durationMinutes,
    price: input.price,
    cityId: input.cityId ?? null,
    categoryId: input.categoryId ?? null,
  };

  if (input.id) {
    return catalogPrisma.experience.update({ where: { id: input.id }, data });
  }

  return catalogPrisma.experience.create({ data });
}

export interface CreateSlotInput {
  experienceId: string;
  date: string; // ISO
  startTime: string; // ISO
  capacity: number;
}

// Regla: no permitir ExperienceSlot con capacity <= 0
export async function createSlot(input: CreateSlotInput) {
  if (input.capacity <= 0) {
    throw new Error("capacity must be greater than 0");
  }

  // Regla: no permitir slot para Experience inexistente
  const experience = await catalogPrisma.experience.findUnique({ where: { id: input.experienceId } });
  if (!experience) {
    throw new Error("experience not found");
  }

  return catalogPrisma.experienceSlot.create({
    data: {
      experienceId: input.experienceId,
      date: new Date(input.date),
      startTime: new Date(input.startTime),
      capacity: input.capacity,
    },
  });
}
