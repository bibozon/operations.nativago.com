import { PrismaSlotRepository } from '@/infrastructure/persistence/prisma/PrismaSlotRepository';

const slotRepository = new PrismaSlotRepository();

export async function listSlotsByExperience(experienceId: string) {
  try {
    return await slotRepository.findAvailableByExperience(experienceId);
  } catch (error) {
    console.error(`Error fetching slots for experience ${experienceId}:`, error);
    throw new Error('Failed to fetch slots');
  }
}
