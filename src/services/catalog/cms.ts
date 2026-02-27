import prisma from '@/lib/db';

export async function createCategory(data: { name: string; slug: string }) {
  return prisma.category.create({ data });
}

export async function createCity(data: { name: string; country: string }) {
  return prisma.city.create({ data });
}

export async function createOperator(data: {
  name: string;
  email: string;
  phone?: string;
  cityId: number;
}) {
  return prisma.operator.create({ data });
}

export async function createExperience(data: {
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  image?: string;
  featured?: boolean;
  categoryId: number;
  cityId: number;
  operatorId: number;
}) {
  return prisma.experience.create({ data });
}

export async function updateExperience(id: number, data: Partial<{
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  image?: string | null;
  featured?: boolean;
  categoryId: number;
  cityId: number;
  operatorId: number;
}>) {
  return prisma.experience.update({ where: { id }, data });
}

export async function createSlot(data: {
  experienceId: number;
  date: Date;
  startTime: Date;
  capacity: number;
}) {
  return prisma.availabilitySlot.create({ data });
}
