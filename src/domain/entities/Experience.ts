export type ExperienceCardDTO = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  price: number;
  durationMinutes: number;
  city: { id: string; name: string; country: string };
  category: { id: string; name: string; slug: string; depositRate: number };
  operator: { id: string; name: string; phone: string | null };
};
