import { prisma } from "@/infrastructure/db/client";

export interface CreateExperienceInput {
  operatorId: string;
  agencyId?: string;
  title: string;
  description: string;
  cityId?: string;
  categoryId?: string;
  durationMinutes: number;
  price: number;
  coveragePolicy: string;
  coverageDescription: string;
  photos: string[];
}

export async function listExperiencesForOperator(operatorId: string) {
  return prisma.experience.findMany({
    where: { operatorId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createExperience(input: CreateExperienceInput) {
  return prisma.experience.create({
    data: {
      operatorId: input.operatorId,
      agencyId: input.agencyId,
      title: input.title,
      description: input.description,
      cityId: input.cityId,
      categoryId: input.categoryId,
      durationMinutes: input.durationMinutes,
      price: input.price,
      coveragePolicy: input.coveragePolicy,
      coverageDescription: input.coverageDescription,
      photos: input.photos,
    },
  });
}
