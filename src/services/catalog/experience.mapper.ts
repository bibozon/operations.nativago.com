import type { Experience, Category, City, Operator } from '@prisma/client';

export type ExperienceCardDTO = {
  id: number;
  title: string;
  category?: { id: number; name: string; slug?: string } | null;
  city?: { id: number; name: string } | null;
  operator?: { id: number; name: string } | null;
};

export function mapExperienceToCard(experience: Experience & { category?: Category | null; city?: City | null; operator?: Operator | null }): ExperienceCardDTO {
  return {
    id: experience.id,
    title: (experience as any).title || (experience as any).name || 'Experience',
    category: experience.category ? { id: experience.category.id, name: experience.category.name, slug: (experience.category as any).slug } : null,
    city: experience.city ? { id: experience.city.id, name: experience.city.name } : null,
    operator: experience.operator ? { id: experience.operator.id, name: experience.operator.name } : null,
  };
}

export function mapExperiencesToCards(experiences: Array<Experience & { category?: Category | null; city?: City | null; operator?: Operator | null }>): ExperienceCardDTO[] {
  return experiences.map(mapExperienceToCard);
}
