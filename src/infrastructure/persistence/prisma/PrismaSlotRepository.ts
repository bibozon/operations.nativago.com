import prisma from '@/lib/db';
import type { SlotListItem, SlotRepository } from '@/domain/repositories/SlotRepository';

export class PrismaSlotRepository implements SlotRepository {
  async findAvailableByExperience(experienceId: string): Promise<SlotListItem[]> {
    const now = new Date();
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        experienceId,
        date: { gt: now },
        capacity: { gt: 0, lte: 50 },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return slots.map((s) => ({
      id: s.id,
      experienceId: s.experienceId,
      date: s.date.toISOString().split('T')[0],
      startTime: s.startTime.toISOString(),
      capacity: s.capacity,
    }));
  }
}
