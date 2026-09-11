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
  { code: 'ARS', symbol: '$', decimalDigits: 2 },
];

const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
];

const TIMEZONES = [
  { ianaName: 'America/Bogota', label: 'Colombia (UTC-5)' },
  { ianaName: 'America/Sao_Paulo', label: 'Brasil - São Paulo (UTC-3)' },
  { ianaName: 'America/Mexico_City', label: 'México - Ciudad de México (UTC-6)' },
  { ianaName: 'America/Santiago', label: 'Chile - Santiago (UTC-4)' },
  { ianaName: 'America/Argentina/Buenos_Aires', label: 'Argentina - Buenos Aires (UTC-3)' },
  { ianaName: 'America/Lima', label: 'Perú - Lima (UTC-5)' },
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
  {
    code: 'MX',
    name: 'México',
    domainSlug: 'mx',
    currencyCode: 'MXN',
    languageCode: 'es',
    timezoneName: 'America/Mexico_City',
    taxRatePercent: 16, // IVA México
    commissionPercent: 15,
    seoTitle: 'NativaGo México — Experiencias turísticas auténticas',
    seoDescription: 'Reserva experiencias turísticas con operadores locales verificados en México.',
  },
  {
    code: 'CL',
    name: 'Chile',
    domainSlug: 'cl',
    currencyCode: 'CLP',
    languageCode: 'es',
    timezoneName: 'America/Santiago',
    taxRatePercent: 19, // IVA Chile
    commissionPercent: 15,
    seoTitle: 'NativaGo Chile — Experiencias turísticas auténticas',
    seoDescription: 'Reserva experiencias turísticas con operadores locales verificados en Chile.',
  },
  {
    code: 'AR',
    name: 'Argentina',
    domainSlug: 'ar',
    currencyCode: 'ARS',
    languageCode: 'es',
    timezoneName: 'America/Argentina/Buenos_Aires',
    taxRatePercent: 21, // IVA Argentina
    commissionPercent: 15,
    seoTitle: 'NativaGo Argentina — Experiencias turísticas auténticas',
    seoDescription: 'Reserva experiencias turísticas con operadores locales verificados en Argentina.',
  },
  {
    code: 'PE',
    name: 'Perú',
    domainSlug: 'pe',
    currencyCode: 'PEN',
    languageCode: 'es',
    timezoneName: 'America/Lima',
    taxRatePercent: 18, // IGV Perú
    commissionPercent: 15,
    seoTitle: 'NativaGo Perú — Experiencias turísticas auténticas',
    seoDescription: 'Reserva experiencias turísticas con operadores locales verificados en Perú.',
  },
];

// Documentos oficiales exigidos para verificar un operador, por país.
const DOCUMENT_TYPES = [
  { countryCode: 'CO', code: 'RNT', label: 'Registro Nacional de Turismo', validationRegex: '^\\d{1,10}$' },
  { countryCode: 'BR', code: 'CNPJ', label: 'CNPJ (agência)', validationRegex: null },
  { countryCode: 'BR', code: 'CPF', label: 'CPF (freelancer)', validationRegex: null },
  { countryCode: 'BR', code: 'CADASTUR', label: 'CADASTUR', validationRegex: null },
  // México: RFC (obligatorio para todos), REPSE (solo agencias con empleados), SECTUR (registro voluntario)
  { countryCode: 'MX', code: 'RFC', label: 'RFC — Registro Federal de Contribuyentes', validationRegex: '^[A-Z&Ñ]{3,4}\\d{6}[A-Z0-9]{3}$' },
  { countryCode: 'MX', code: 'REPSE', label: 'REPSE — Registro de Prestadores de Servicios Especializados', validationRegex: null },
  { countryCode: 'MX', code: 'SECTUR', label: 'Registro SECTUR (voluntario)', validationRegex: null },
  // Chile: RUT obligatorio para todos. SERNATUR es opcional en general, pero
  // se vuelve obligatorio para operadores con experiencias en categorías de
  // turismo aventura (no hay categoría "alojamiento" en este marketplace de
  // experiencias, así que se mapea a las categorías de mayor riesgo físico).
  { countryCode: 'CL', code: 'RUT', label: 'RUT — Rol Único Tributario', validationRegex: '^\\d{7,8}-[\\dkK]$', isRequired: true },
  {
    countryCode: 'CL',
    code: 'SERNATUR',
    label: 'Registro Nacional de Prestadores Turísticos (SERNATUR)',
    validationRegex: null,
    isRequired: false,
    requiredForCategorySlugs: ['aventura', 'buceo', 'senderismo'],
  },
  // Argentina: CUIT obligatorio para todos + Registro Ley 18.829 (Registro de
  // Agentes de Viaje) para quienes intermedian venta de servicios turísticos.
  { countryCode: 'AR', code: 'CUIT', label: 'CUIT — Clave Única de Identificación Tributaria', validationRegex: '^\\d{2}-\\d{8}-\\d{1}$', isRequired: true },
  { countryCode: 'AR', code: 'LEY_18829', label: 'Registro de Agentes de Viaje (Ley 18.829)', validationRegex: null, isRequired: true },
  // Perú: RUC obligatorio para todos + DIRCETUR, que se otorga por región
  // (gobierno regional), no a nivel nacional. Set inicial de regiones con
  // mayor actividad turística — revisar y ampliar con el listado oficial
  // completo de gobiernos regionales antes de habilitar el resto del país.
  { countryCode: 'PE', code: 'RUC', label: 'RUC — Registro Único de Contribuyentes', validationRegex: '^\\d{11}$', isRequired: true },
  { countryCode: 'PE', code: 'DIRCETUR', label: 'DIRCETUR Lima — Autorización regional de operador', validationRegex: null, isRequired: true, region: 'LIMA' },
  { countryCode: 'PE', code: 'DIRCETUR', label: 'DIRCETUR Cusco — Autorización regional de operador', validationRegex: null, isRequired: true, region: 'CUSCO' },
  { countryCode: 'PE', code: 'DIRCETUR', label: 'DIRCETUR Arequipa — Autorización regional de operador', validationRegex: null, isRequired: true, region: 'AREQUIPA' },
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
    const region = dt.region ?? '';
    const isRequired = dt.isRequired ?? true;
    const requiredForCategorySlugs = dt.requiredForCategorySlugs ?? [];
    await prisma.documentType.upsert({
      where: { countryId_code_region: { countryId: country.id, code: dt.code, region } },
      update: {
        label: dt.label,
        validationRegex: dt.validationRegex,
        isRequired,
        requiredForCategorySlugs,
      },
      create: {
        countryId: country.id,
        code: dt.code,
        label: dt.label,
        validationRegex: dt.validationRegex,
        isRequired,
        region,
        requiredForCategorySlugs,
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
