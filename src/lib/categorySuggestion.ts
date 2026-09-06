// Sugerencia de categoría por palabras clave — sin IA externa (sin API key
// configurada todavía). Cubre ES/EN/PT/FR para que un título en cualquiera
// de los 4 idiomas del CMS ("Buceo guiado...", "Guided diving...", "Mergulho
// guiado...", "Plongée guidée...") sugiera la misma categoría real.
// Clave = nombre exacto de la categoría en la base (Category.name, español).
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Buceo': [
    'buceo', 'bucear', 'buceando', 'submarinismo', 'esnorquel', 'snorkel', 'snorkeling',
    'diving', 'dive', 'scuba',
    'mergulho', 'mergulhar',
    'plongee',
  ],
  'Aventura': [
    'aventura', 'parapente', 'paragliding', 'rafting', 'canopy', 'tirolesa', 'tirolina',
    'zipline', 'extremo', 'extreme',
    'aventure',
  ],
  'Cultura': [
    'cultura', 'cultural', 'museo', 'historico', 'patrimonio',
    'culture', 'museum', 'historic', 'heritage',
    'musee', 'patrimoine', 'historique',
  ],
  'Naturaleza': [
    'naturaleza', 'ecoturismo', 'selva', 'avistamiento', 'flora', 'fauna',
    'nature', 'wildlife', 'jungle',
    'natureza', 'floresta', 'observacao de aves',
    'foret',
  ],
  'Gastronomía': [
    'gastronomia', 'gastronomico', 'cocina', 'culinario', 'degustacion', 'comida',
    'gastronomy', 'cooking', 'culinary', 'tasting', 'food',
    'gastronomie', 'cuisine', 'degustation',
  ],
  'Playa': [
    'playa', 'catamaran', 'vela',
    'beach', 'sailing',
    'praia',
    'plage', 'voile',
  ],
  'Senderismo': [
    'senderismo', 'caminata', 'trekking', 'montana',
    'hiking', 'trek', 'mountain',
    'trilha', 'trilhas', 'montanha',
    'randonnee', 'montagne',
  ],
  'Bienestar': [
    'bienestar', 'masaje', 'relajacion', 'spa', 'yoga',
    'wellness', 'massage', 'relax',
    'bem-estar', 'massagem',
    'bien-etre',
  ],
  'Paseos en barco': [
    'paseo en barco', 'paseos en barco', 'crucero', 'lancha', 'yate', 'bote',
    'boat tour', 'boat trip', 'cruise', 'yacht',
    'passeio de barco', 'passeios de barco', 'barco',
    'balade en bateau', 'croisiere',
  ],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Busca la primera categoría cuyo nombre coincida con el título dado, según
 * el diccionario de sinónimos ES/EN/PT/FR. No hace matching parcial de
 * palabras sueltas ambiguas (ej. "tour" solo) para evitar falsos positivos.
 */
export function suggestCategoryName(title: string): string | null {
  const text = normalize(title);
  if (!text) return null;

  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      const needle = normalize(keyword);
      const pattern = needle.includes(' ')
        ? needle
        : `\\b${needle}\\b`;
      if (new RegExp(pattern).test(text)) {
        return categoryName;
      }
    }
  }
  return null;
}

export function suggestCategoryId(
  title: string,
  categories: { id: string; name: string }[],
): string | null {
  const suggestedName = suggestCategoryName(title);
  if (!suggestedName) return null;
  return categories.find((c) => normalize(c.name) === normalize(suggestedName))?.id ?? null;
}
