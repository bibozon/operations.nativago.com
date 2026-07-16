export type CityListItem = {
  id: string;
  name: string;
  slug: string;
  experienceCount: number;
};

export type CityOption = {
  id: string;
  name: string;
};

export interface CityRepository {
  findManyWithExperiences(countryId: string | null): Promise<CityListItem[]>;
  // Todas las ciudades de un país, tengan o no experiencias todavía — para
  // selects de formularios de operador (crear/editar experiencia).
  findManyByCountry(countryId: string): Promise<CityOption[]>;
}
