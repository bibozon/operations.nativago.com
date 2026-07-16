/* eslint-disable @typescript-eslint/no-require-imports */
// Fase 0 — infiere Country.id desde el texto libre City.country existente
// y lo propaga a Operator → Experience → Booking. Idempotente y seguro de
// re-correr: solo toca filas con countryId todavía nulo.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mapeo del texto libre histórico (en varios idiomas/formas) a Country.code.
const COUNTRY_NAME_TO_CODE = {
  colombia: 'CO',
  co: 'CO',
  brazil: 'BR',
  brasil: 'BR',
  br: 'BR',
};

function resolveCountryCode(freeText) {
  if (!freeText) return null;
  const key = freeText.trim().toLowerCase();
  return COUNTRY_NAME_TO_CODE[key] ?? null;
}

async function main() {
  const countries = await prisma.country.findMany();
  const countryIdByCode = Object.fromEntries(countries.map((c) => [c.code, c.id]));

  if (countries.length === 0) {
    throw new Error('No hay países en la tabla Country. Corre primero prisma/seed-countries.js');
  }

  // ── City ────────────────────────────────────────────────────────────────
  const cities = await prisma.city.findMany({ where: { countryId: null } });
  let cityUpdates = 0;
  const unresolvedCities = [];
  for (const city of cities) {
    const code = resolveCountryCode(city.country);
    const countryId = code ? countryIdByCode[code] : undefined;
    if (!countryId) {
      unresolvedCities.push({ id: city.id, name: city.name, country: city.country });
      continue;
    }
    await prisma.city.update({ where: { id: city.id }, data: { countryId } });
    cityUpdates++;
  }

  // ── Operator (vía City) ────────────────────────────────────────────────
  const operators = await prisma.operator.findMany({
    where: { countryId: null },
    select: { id: true, cityId: true },
  });
  let operatorUpdates = 0;
  for (const op of operators) {
    const city = await prisma.city.findUnique({ where: { id: op.cityId }, select: { countryId: true } });
    if (!city?.countryId) continue;
    await prisma.operator.update({ where: { id: op.id }, data: { countryId: city.countryId } });
    operatorUpdates++;
  }

  // ── Experience (vía Operator) ──────────────────────────────────────────
  const experiences = await prisma.experience.findMany({
    where: { countryId: null },
    select: { id: true, operatorId: true },
  });
  let experienceUpdates = 0;
  for (const exp of experiences) {
    const operator = await prisma.operator.findUnique({
      where: { id: exp.operatorId },
      select: { countryId: true },
    });
    if (!operator?.countryId) continue;
    await prisma.experience.update({ where: { id: exp.id }, data: { countryId: operator.countryId } });
    experienceUpdates++;
  }

  // ── Booking (vía Experience) ───────────────────────────────────────────
  const bookings = await prisma.booking.findMany({
    where: { countryId: null },
    select: { id: true, experienceId: true },
  });
  let bookingUpdates = 0;
  for (const booking of bookings) {
    const exp = await prisma.experience.findUnique({
      where: { id: booking.experienceId },
      select: { countryId: true },
    });
    if (!exp?.countryId) continue;
    await prisma.booking.update({ where: { id: booking.id }, data: { countryId: exp.countryId } });
    bookingUpdates++;
  }

  console.log(`✔ Backfill completo:`);
  console.log(`  City:       ${cityUpdates} actualizadas`);
  console.log(`  Operator:   ${operatorUpdates} actualizados`);
  console.log(`  Experience: ${experienceUpdates} actualizadas`);
  console.log(`  Booking:    ${bookingUpdates} actualizados`);
  if (unresolvedCities.length > 0) {
    console.warn(`⚠ ${unresolvedCities.length} ciudad(es) con country sin mapear a un Country conocido:`);
    console.warn(JSON.stringify(unresolvedCities, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
