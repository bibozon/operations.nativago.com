export type ExperienceCardDTO = {
  id: number;
  title: string;
  image: string | null;
  price: number;
  durationMinutes: number;
  city: { id: number; name: string; country: string };
  category: { id: number; name: string; slug: string };
  operator: { id: number; name: string };
};

export function mapExperienceToCard(experience: ExperienceCardDTO): ExperienceCardDTO {
  return experience;
}

export function mapExperiencesToCards(experiences: ExperienceCardDTO[]): ExperienceCardDTO[] {
  return experiences.map(mapExperienceToCard);
}
