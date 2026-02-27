import type { Experience, Category, City, Operator } from '@prisma/client';

export type ExperienceCardDTO = {
  id: number;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  image: string | null;
  featured: boolean;
  city: {
    name: string;
  };
  category: {
    name: string;
    slug: string;
  };
  operator: {
    name: string;
  };
};

export function mapExperienceToCard(
  experience: Experience & {
    category: Pick<Category, 'id' | 'name' | 'slug'>;
    city: Pick<City, 'id' | 'name'>;
    operator: Pick<Operator, 'id' | 'name'>;
  }
): ExperienceCardDTO {
  return {
    id: experience.id,
    title: experience.title,
    description: experience.description,
    price: Number(experience.price),
    durationMinutes: experience.durationMinutes,
    image: experience.image ?? null,
    featured: experience.featured,
    city: {
      name: experience.city.name,
    },
    category: {
      name: experience.category.name,
      slug: experience.category.slug,
    },
    operator: {
      name: experience.operator.name,
    },
  };
}

export function mapExperiencesToCards(
  experiences: Array<
    Experience & {
      category: Pick<Category, 'id' | 'name' | 'slug'>;
      city: Pick<City, 'id' | 'name'>;
      operator: Pick<Operator, 'id' | 'name'>;
    }
  >
): ExperienceCardDTO[] {
  return experiences.map(mapExperienceToCard);
}
