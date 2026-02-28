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
    id: number;
    name: string;
    slug: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  operator: {
    id: number;
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
      id: experience.city.id,
      name: experience.city.name,
      slug: experience.city.name.toLowerCase().replace(/ /g, '-'),
    },
    category: {
      id: experience.category.id,
      name: experience.category.name,
      slug: experience.category.slug,
    },
    operator: {
      id: experience.operator.id,
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
