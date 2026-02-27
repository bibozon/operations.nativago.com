export interface Experience {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: string;
  cityId?: string | null;
  categoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperienceSlot {
  id: string;
  experienceId: string;
  date: Date;
  startTime: Date;
  capacity: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}
