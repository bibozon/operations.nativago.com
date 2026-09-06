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
    country:        'co' as const,
    name:           `Caribe Aventuras ${uid()}`,
    email:          `op_co_${RUN}_${uid()}@e2e.nativago.com`,
    phone:          '+57 300 111 2222',
    password:       'E2eTest123!',
    prestadorTipo:  'JURIDICA' as const,
    categoria:      'AGENCIA_VIAJES',
    legalRep:       'Juan García',
    cityLabel:      'Cartagena',
    identityDoc:    '9001234561',
    paymentAccount: '+57 300 111 2222',
    experience: {
      title:           'Avistamiento de flamencos en Galeras',
      description:     'Recorrido en lancha por la Ciénaga de la Virgen para ver flamencos rosados al amanecer.',
      durationMinutes: '180',
      price:           '280000',
    },
  };
}

export function makeOperadorCONatural() {
  return {
    country:        'co' as const,
    name:           `Diego Ramírez ${uid()}`,
    email:          `op_co_nat_${RUN}_${uid()}@e2e.nativago.com`,
    phone:          '+57 300 222 3333',
    password:       'E2eTest123!',
    prestadorTipo:  'NATURAL' as const,
    categoria:      'GUIA',
    cityLabel:      'Cartagena',
    identityDoc:    '1020304050',
    paymentAccount: '+57 300 222 3333',
    experience: {
      title:           'Caminata guiada por el Centro Histórico',
      description:     'Recorrido a pie por las murallas y el centro histórico de Cartagena con guía certificado.',
      durationMinutes: '150',
      price:           '90000',
    },
  };
}

export function makeOperadorBR() {
  return {
    country:        'br' as const,
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

export function makeOperadorBRJuridica() {
  return {
    country:        'br' as const,
    name:           `Amazônia Expedições ${uid()}`,
    email:          `op_br_agn_${RUN}_${uid()}@e2e.nativago.com`,
    phone:          '+55 92 98888-4444',
    password:       'E2eTest123!',
    prestadorTipo:  'JURIDICA' as const,
    categoria:      'OPERADOR_TURISTICO',
    legalRep:       'Marcos Silva',
    cityLabel:      'Manaus',
    identityDoc:    '12.345.678/0001-90',
    paymentAccount: 'contato.amazoniaexpedicoes@gmail.com',
    experience: {
      title:           'Expedição noturna na selva — Manaus',
      description:     'Passeio noturno de barco pela selva amazônica para observação de fauna.',
      durationMinutes: '210',
      price:           '2200',
    },
  };
}

export type OperadorData = ReturnType<typeof makeOperadorCO>;
