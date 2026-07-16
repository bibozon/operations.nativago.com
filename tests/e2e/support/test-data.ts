const uid = () => Math.random().toString(36).slice(2, 7);
const RUN  = Date.now();

export const CMS_URL = process.env.PLAYWRIGHT_CMS_URL ?? 'http://localhost:3001';
export const MKT_URL = process.env.PLAYWRIGHT_MKT_URL ?? 'http://localhost:3000';

export const ADMIN = {
  email:    'admin@nativago.com',
  password: 'nativago123',
} as const;

/** Nombre del operador semilla creado en globalSetup — aparece en el catálogo */
export const SEED_EXPERIENCE_TITLE = 'Tour de prueba E2E NativaGo';

export function makeOperadorCO() {
  return {
    name:           `Caribe Aventuras ${uid()}`,
    email:          `op_co_${RUN}_${uid()}@e2e.nativago.com`,
    phone:          '+57 300 111 2222',
    password:       'E2eTest123!',
    prestadorTipo:  'JURIDICA' as const,
    categoria:      'AGENCIA_VIAJES',
    legalRep:       'Juan García',
    cityLabel:      'Cartagena',
    identityDoc:    '900123456-1',
    paymentAccount: '+57 300 111 2222',
    experience: {
      title:           'Avistamiento de flamencos en Galeras',
      description:     'Recorrido en lancha por la Ciénaga de la Virgen para ver flamencos rosados al amanecer.',
      durationMinutes: '180',
      price:           '280000',
    },
  };
}

export function makeOperadorBR() {
  return {
    name:           `Amazônia Ecoturismo ${uid()}`,
    email:          `op_br_${RUN}_${uid()}@e2e.nativago.com`,
    phone:          '+55 92 99000-0001',
    password:       'E2eTest123!',
    prestadorTipo:  'NATURAL' as const,
    categoria:      'GUIA',
    cityLabel:      'Manaus',
    identityDoc:    '000.000.000-00',
    paymentAccount: 'amazonia.eco@gmail.com',
    experience: {
      title:           'Tour al Encontro das Águas — Manaus',
      description:     'Paseo en lancha para ver el Encontro das Águas (Negro x Solimões), el fenómeno natural más espectacular de la Amazonia.',
      durationMinutes: '240',
      price:           '1500',
    },
  };
}

export type OperadorData = ReturnType<typeof makeOperadorCO>;
