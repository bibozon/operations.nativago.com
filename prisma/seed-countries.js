/* eslint-disable @typescript-eslint/no-require-imports */
// Fase 0 — seed de las entidades multi-país (Country, Currency, Language,
// Timezone, PaymentProvider). Idempotente: usa upsert, se puede correr
// varias veces sin duplicar filas. Ver plan de arquitectura NativaGo LatAm.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CURRENCIES = [
  { code: 'COP', symbol: '$', decimalDigits: 0 },
  { code: 'BRL', symbol: 'R$', decimalDigits: 2 },
  { code: 'USD', symbol: '$', decimalDigits: 2 },
  { code: 'MXN', symbol: '$', decimalDigits: 2 },
  { code: 'CLP', symbol: '$', decimalDigits: 0 },
  { code: 'PEN', symbol: 'S/', decimalDigits: 2 },
];

const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
];

const TIMEZONES = [
  { ianaName: 'America/Bogota', label: 'Colombia (UTC-5)' },
  { ianaName: 'America/Sao_Paulo', label: 'Brasil - São Paulo (UTC-3)' },
];

const PAYMENT_PROVIDERS = [
  { code: 'stripe', displayName: 'Stripe' },
  { code: 'wompi', displayName: 'Wompi' },
  { code: 'mercadopago', displayName: 'Mercado Pago' },
  { code: 'pix', displayName: 'Pix' },
];

const COUNTRIES = [
  {
    code: 'CO',
    name: 'Colombia',
    domainSlug: 'co',
    currencyCode: 'COP',
    languageCode: 'es',
    timezoneName: 'America/Bogota',
    taxRatePercent: 19, // IVA
    commissionPercent: 15,
    seoTitle: 'NativaGo Colombia — Experiencias turísticas auténticas',
    seoDescription: 'Reserva experiencias turísticas con operadores locales verificados en Colombia.',
  },
  {
    code: 'BR',
    name: 'Brasil',
    domainSlug: 'br',
    currencyCode: 'BRL',
    languageCode: 'pt',
    timezoneName: 'America/Sao_Paulo',
    taxRatePercent: 0,
    commissionPercent: 15,
    seoTitle: 'NativaGo Brasil — Experiências turísticas autênticas',
    seoDescription: 'Reserve experiências turísticas com operadores locais verificados no Brasil.',
  },
];

// Documentos oficiales exigidos para verificar un operador, por país.
const DOCUMENT_TYPES = [
  { countryCode: 'CO', code: 'RNT', label: 'Registro Nacional de Turismo', validationRegex: '^\\d{1,10}$' },
  { countryCode: 'BR', code: 'CNPJ', label: 'CNPJ (agência)', validationRegex: null },
  { countryCode: 'BR', code: 'CPF', label: 'CPF (freelancer)', validationRegex: null },
  { countryCode: 'BR', code: 'CADASTUR', label: 'CADASTUR', validationRegex: null },
];

async function main() {
  const currencyByCode = {};
  for (const c of CURRENCIES) {
    currencyByCode[c.code] = await prisma.currency.upsert({
      where: { code: c.code },
      update: { symbol: c.symbol, decimalDigits: c.decimalDigits },
      create: c,
    });
  }

  const languageByCode = {};
  for (const l of LANGUAGES) {
    languageByCode[l.code] = await prisma.language.upsert({
      where: { code: l.code },
      update: { name: l.name },
      create: l,
    });
  }

  const timezoneByName = {};
  for (const tz of TIMEZONES) {
    timezoneByName[tz.ianaName] = await prisma.timezone.upsert({
      where: { ianaName: tz.ianaName },
      update: { label: tz.label },
      create: tz,
    });
  }

  const paymentProviderByCode = {};
  for (const p of PAYMENT_PROVIDERS) {
    paymentProviderByCode[p.code] = await prisma.paymentProvider.upsert({
      where: { code: p.code },
      update: { displayName: p.displayName },
      create: p,
    });
  }

  const countryByCode = {};
  for (const c of COUNTRIES) {
    countryByCode[c.code] = await prisma.country.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        domainSlug: c.domainSlug,
        defaultCurrencyId: currencyByCode[c.currencyCode].id,
        defaultLanguageId: languageByCode[c.languageCode].id,
        timezoneId: timezoneByName[c.timezoneName].id,
        taxRatePercent: c.taxRatePercent,
        commissionPercent: c.commissionPercent,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
      },
      create: {
        code: c.code,
        name: c.name,
        domainSlug: c.domainSlug,
        defaultCurrencyId: currencyByCode[c.currencyCode].id,
        defaultLanguageId: languageByCode[c.languageCode].id,
        timezoneId: timezoneByName[c.timezoneName].id,
        taxRatePercent: c.taxRatePercent,
        commissionPercent: c.commissionPercent,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
      },
    });
  }

  // Stripe es el único proveedor con credenciales reales hoy — se activa
  // para ambos países como continuidad del comportamiento actual. Wompi,
  // Mercado Pago y Pix quedan registrados pero inactivos hasta tener
  // credenciales (Fase 5 del plan).
  for (const c of COUNTRIES) {
    await prisma.countryPaymentProvider.upsert({
      where: {
        countryId_paymentProviderId: {
          countryId: countryByCode[c.code].id,
          paymentProviderId: paymentProviderByCode.stripe.id,
        },
      },
      update: { isActive: true, priority: 0 },
      create: {
        countryId: countryByCode[c.code].id,
        paymentProviderId: paymentProviderByCode.stripe.id,
        isActive: true,
        priority: 0,
      },
    });
  }

  for (const dt of DOCUMENT_TYPES) {
    const country = countryByCode[dt.countryCode];
    await prisma.documentType.upsert({
      where: { countryId_code: { countryId: country.id, code: dt.code } },
      update: { label: dt.label, validationRegex: dt.validationRegex },
      create: {
        countryId: country.id,
        code: dt.code,
        label: dt.label,
        validationRegex: dt.validationRegex,
      },
    });
  }

  console.log('✔ Seed multi-país (Country, Currency, Language, Timezone, PaymentProvider, DocumentType) completo.');
  console.log(`  Países: ${Object.keys(countryByCode).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
