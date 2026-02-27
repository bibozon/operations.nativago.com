import prisma from '@/lib/db';

export async function listSlotsByExperience(experienceId: number) {
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
}
