import type { ExperienceCardDTO } from '@/domain/entities/Experience';

export type ExperienceFilters = {
  citySlug?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
  operatorId?: string;
};

// `countryId: null` significa "sin filtro de país" — solo válido durante la
// transición (Fase 0/1) mientras el catálogo público todavía no está
// segmentado por subdominio. Una vez el ruteo por país esté activo (Fase 2),
// todo llamador real resuelve un countryId concreto; `null` deja de usarse.
export interface ExperienceRepository {
  findMany(countryId: string | null, filters: ExperienceFilters): Promise<ExperienceCardDTO[]>;
  findById(countryId: string | null, id: string): Promise<ExperienceCardDTO | null>;
}
