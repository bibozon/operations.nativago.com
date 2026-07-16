export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
};

// Category es taxonomía global (compartida entre países) — ver CountryCategory
// en el schema para habilitar/ordenar por país. `listEnabledForCountry`
// queda listo para cuando la curación por país se active (Fase 2/3); hoy
// simplemente devuelve todas las categorías, igual que el comportamiento
// actual.
export interface CategoryRepository {
  findMany(): Promise<CategoryListItem[]>;
}
