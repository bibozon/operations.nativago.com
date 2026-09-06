import type { OperatorType } from '@prisma/client';

// Prestador natural: persona individual que ofrece la experiencia a título propio.
export const NATURAL_PRESTADOR_CATEGORIES = [
  { value: 'GUIA', label: 'Guía turístico' },
  { value: 'CONDUCTOR', label: 'Conductor' },
  { value: 'FOTOGRAFO', label: 'Fotógrafo' },
  { value: 'INSTRUCTOR', label: 'Instructor (buceo, surf, senderismo...)' },
  { value: 'PESCADOR', label: 'Pescador' },
  { value: 'COCINERO', label: 'Cocinero' },
  { value: 'ARTESANO', label: 'Artesano' },
  { value: 'OTRO', label: 'Otro' },
] as const;

// Prestador jurídico: empresa que ofrece la experiencia a su nombre.
export const JURIDICA_PRESTADOR_CATEGORIES = [
  { value: 'AGENCIA_VIAJES', label: 'Agencia de viajes' },
  { value: 'OPERADOR_TURISTICO', label: 'Operador turístico' },
  { value: 'TRANSPORTE', label: 'Empresa de transporte' },
  { value: 'AVENTURA', label: 'Empresa de aventura' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export type PrestadorTipo = 'NATURAL' | 'JURIDICA';

export function operatorTypeFromPrestadorTipo(tipo: PrestadorTipo): OperatorType {
  return tipo === 'JURIDICA' ? 'AGENCY' : 'FREELANCE';
}

export function prestadorTipoFromOperatorType(type: OperatorType): PrestadorTipo {
  return type === 'AGENCY' ? 'JURIDICA' : 'NATURAL';
}

// Texto de responsabilidad civil localizado por país. El formulario anterior
// tenía este texto fijo en portugués para todos los países — un operador
// registrándose en Colombia terminaba aceptando una declaración sobre
// "autoridades brasileiras". Country no tiene un campo de texto legal, así
// que se resuelve con un mapa por código ISO sin tocar el schema.
const LIABILITY_TEXT_BY_COUNTRY: Record<string, string> = {
  BR: 'Declaro que sou o prestador do serviço turístico descrito e que possuo todas as licenças exigidas pelas autoridades brasileiras. Entendo que o NativaGo cobra do cliente 15% do valor total da atividade como antecipação de reserva, e que eu cobro diretamente do cliente os 85% restantes no local da atividade. Esses 85% devem incluir todos os custos: guias, transporte, equipamentos, seguros e quaisquer despesas necessárias. O NativaGo não cobra nem intermedeia seguros. Aceito os Termos e Condições e a Política de Operadores.',
  CO: 'Declaro que soy el prestador del servicio turístico descrito y que cuento con todas las licencias exigidas por las autoridades colombianas. Entiendo que NativaGo cobra al cliente el 15% del valor total de la actividad como anticipo de reserva, y que yo cobro directamente al cliente el 85% restante en el lugar de la actividad. Ese 85% debe incluir todos los costos del servicio: guías, transporte, equipamiento, seguros y cualquier gasto necesario. NativaGo no cobra ni intermedia seguros. Acepto los Términos y Condiciones y la Política de Operadores.',
  MX: 'Declaro que soy el prestador del servicio turístico descrito y que cuento con las licencias exigidas por las autoridades mexicanas, incluyendo RFC vigente y, cuando aplique, registro REPSE y SECTUR. Entiendo que NativaGo cobra al cliente el 15% del valor total de la actividad como anticipo de reserva, y que yo cobro directamente al cliente el 85% restante en el lugar de la actividad. Ese 85% debe incluir todos los costos del servicio: guías, transporte, equipamiento, seguros y cualquier gasto necesario. NativaGo no cobra ni intermedia seguros. Acepto los Términos y Condiciones y la Política de Operadores.',
};

const LIABILITY_TEXT_DEFAULT =
  'Declaro que soy el prestador del servicio turístico descrito y que cuento con todas las licencias exigidas por las autoridades de mi país. Entiendo que NativaGo cobra al cliente el 15% del valor total de la actividad como anticipo de reserva, y que yo cobro directamente al cliente el 85% restante en el lugar de la actividad, cubriendo seguros, guías y todos los gastos del servicio. NativaGo no cobra ni intermedia seguros.';

export function getLiabilityText(countryCode: string | null | undefined): string {
  if (!countryCode) return LIABILITY_TEXT_DEFAULT;
  return LIABILITY_TEXT_BY_COUNTRY[countryCode.toUpperCase()] ?? LIABILITY_TEXT_DEFAULT;
}

// A qué tipo de operador aplica cada DocumentType. El modelo DocumentType
// solo está scoped por país, no por tipo de operador — por eso hoy se le
// muestra "CNPJ (agência)" a un freelance y "CPF (freelancer)" a una agencia.
// Es una regla de UI (no de datos): si el código no aparece aquí, se asume
// que aplica a ambos tipos.
const DOCUMENT_AUDIENCE_BY_CODE: Record<string, OperatorType | 'BOTH'> = {
  CNPJ: 'AGENCY',
  CPF: 'FREELANCE',
  CADASTUR: 'BOTH',
  RNT: 'BOTH',
  RFC: 'BOTH',
  REPSE: 'AGENCY',
  SECTUR: 'BOTH',
};

export function documentTypeAppliesTo(code: string, operatorType: OperatorType): boolean {
  const audience = DOCUMENT_AUDIENCE_BY_CODE[code] ?? 'BOTH';
  return audience === 'BOTH' || audience === operatorType;
}
