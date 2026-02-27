import prisma from '@/lib/db';

export async function listSlotsByExperience(experienceId: number) {
  try {
    const slots = await prisma.availabilitySlot.findMany({
      where: { experienceId },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return slots.map((s) => ({
      id: s.id,
      experienceId: s.experienceId,
      date: s.date.toISOString().split('T')[0],
      startTime: s.startTime.toISOString(),
      capacity: s.capacity,
    }));
  } catch (error) {
    console.error(`Error fetching slots for experience ${experienceId}:`, error);
    throw new Error('Failed to fetch slots');
  }
}
