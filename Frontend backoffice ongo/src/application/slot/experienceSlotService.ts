import { prisma } from "@/infrastructure/db/client";

export interface CreateExperienceSlotInput {
  experienceId: string;
  date: string; // ISO date
  startTime: string; // ISO datetime
  capacity: number;
}

export async function listSlotsForExperience(experienceId: string) {
  return prisma.experienceSlot.findMany({
    where: { experienceId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function createExperienceSlot(input: CreateExperienceSlotInput) {
  if (input.capacity <= 0) {
    throw new Error("capacity must be greater than 0");
  }

  return prisma.experienceSlot.create({
    data: {
      experienceId: input.experienceId,
      date: new Date(input.date),
      startTime: new Date(input.startTime),
      capacity: input.capacity,
    },
  });
}
