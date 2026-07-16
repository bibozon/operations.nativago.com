import prisma from '@/lib/db';

// Los países cambian con muy poca frecuencia (agregar uno nuevo es un
// evento planeado, no algo que pase en medio de un request) — cachear en
// memoria del proceso evita un roundtrip a la DB en cada request del
// catálogo público. `country=null`/desconocido devuelve null: "sin filtro".
let cache: Map<string, string> | null = null;

async function loadCache(): Promise<Map<string, string>> {
  if (cache) return cache;
  const countries = await prisma.country.findMany({ select: { id: true, code: true } });
  cache = new Map(countries.map((c) => [c.code.toUpperCase(), c.id]));
  return cache;
}

export async function resolveCountryId(countryCode: string | undefined | null): Promise<string | null> {
  if (!countryCode) return null;
  const map = await loadCache();
  return map.get(countryCode.toUpperCase()) ?? null;
}

export async function getCountryByCode(countryCode: string) {
  return prisma.country.findUnique({
    where: { code: countryCode.toUpperCase() },
    include: { defaultCurrency: true, defaultLanguage: true, timezone: true },
  });
}
