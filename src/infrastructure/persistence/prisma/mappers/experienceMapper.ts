import type { ExperienceCardDTO } from '@/domain/entities/Experience';

// Forma exacta del `select` de Prisma para armar un ExperienceCardDTO.
// Vive en infrastructure porque es un detalle de cómo Prisma devuelve los
// datos (capa anticorrupción entre el schema y el dominio).
export type PrismaExperienceForCard = {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  durationMinutes: number;
  city: { id: string; name: string; country: string };
  category: { id: string; name: string; slug: string; depositRate: number };
  operator: { id: string; name: string; phone: string | null };
};

export function mapExperienceToCard(experience: PrismaExperienceForCard): ExperienceCardDTO {
  const { images, ...rest } = experience;
  return { ...rest, image: images[0] ?? null };
}

export function mapExperiencesToCards(experiences: PrismaExperienceForCard[]): ExperienceCardDTO[] {
  return experiences.map(mapExperienceToCard);
}
