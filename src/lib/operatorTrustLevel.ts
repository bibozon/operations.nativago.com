import type { Operator } from '@prisma/client';

export type TrustLevel = 1 | 2 | 3;

export type TrustLevelResult = {
  level: TrustLevel;
  label: string;
  nextLevelHint: string | null;
};

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// Aproximación de nivel de confianza con los campos que ya existen hoy en
// Operator. Las señales completas de la propuesta (seguro vigente, reseñas,
// redes sociales, sitio web) requieren campos que Operator todavía no tiene
// — quedan fuera de esta pasada porque no se pidió tocar el esquema. Nivel 3
// usa lo que sí hay: antigüedad, documentos obligatorios verificados y al
// menos una experiencia publicada.
export function computeTrustLevel(operator: {
  verificationStatus: Operator['verificationStatus'];
  contractAccepted: boolean;
  createdAt: Date;
  experiencesCount: number;
  allRequiredDocumentsVerified: boolean;
}): TrustLevelResult {
  if (operator.verificationStatus !== 'APPROVED') {
    return {
      level: 1,
      label: 'Registrado',
      nextLevelHint: 'Completa y envía tus documentos para pasar a "Verificado".',
    };
  }

  const tenureMs = Date.now() - operator.createdAt.getTime();
  const isEstablished = tenureMs >= NINETY_DAYS_MS;

  if (
    operator.allRequiredDocumentsVerified &&
    operator.contractAccepted &&
    operator.experiencesCount >= 1 &&
    isEstablished
  ) {
    return { level: 3, label: 'Confiable', nextLevelHint: null };
  }

  const missing: string[] = [];
  if (!operator.allRequiredDocumentsVerified) missing.push('verifica todos tus documentos obligatorios');
  if (operator.experiencesCount < 1) missing.push('publica al menos una experiencia');
  if (!isEstablished) missing.push('cumple 90 días en la plataforma');

  return {
    level: 2,
    label: 'Verificado',
    nextLevelHint: missing.length > 0 ? `Para subir a "Confiable": ${missing.join(', ')}.` : null,
  };
}

export const TRUST_LEVEL_MAX: TrustLevel = 3;
