import type { DocumentType, Operator, OperatorDocument } from '@prisma/client';
import { documentTypeAppliesTo } from './operatorRegistration';

export type OperatorReviewState =
  | 'DRAFT'
  | 'INFO_NEEDED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'SUSPENDED'
  | 'REJECTED';

export type OperatorReviewResult = {
  state: OperatorReviewState;
  missingDocumentLabels: string[];
};

// Deriva el estado de revisión del operador combinando lo que está
// persistido en verificationStatus con los documentos enviados.
// INFO_NEEDED puede estar tanto en DB (admin lo marcó explícitamente)
// como calculado en tiempo de lectura (faltan docs obligatorios).
export function getOperatorReviewState(
  operator: Pick<Operator, 'verificationStatus' | 'type'>,
  requiredDocumentTypes: DocumentType[],
  submittedDocuments: OperatorDocument[],
): OperatorReviewResult {
  // Estados terminales — no necesitan cálculo adicional
  if (operator.verificationStatus === 'APPROVED') {
    return { state: 'APPROVED', missingDocumentLabels: [] };
  }
  if (operator.verificationStatus === 'REJECTED') {
    return { state: 'REJECTED', missingDocumentLabels: [] };
  }
  if (operator.verificationStatus === 'SUSPENDED') {
    return { state: 'SUSPENDED', missingDocumentLabels: [] };
  }

  // DRAFT: todavía no ha enviado sus documentos (estado inicial tras el registro)
  if (operator.verificationStatus === 'DRAFT') {
    const applicable = requiredDocumentTypes.filter(
      (dt) => dt.isRequired && documentTypeAppliesTo(dt.code, operator.type),
    );
    const submittedIds = new Set(submittedDocuments.map((d) => d.documentTypeId));
    const missing = applicable.filter((dt) => !submittedIds.has(dt.id));
    return {
      state: 'DRAFT',
      missingDocumentLabels: missing.map((d) => d.label),
    };
  }

  // INFO_NEEDED persistido en DB: admin lo marcó explícitamente
  if (operator.verificationStatus === 'INFO_NEEDED') {
    const applicable = requiredDocumentTypes.filter(
      (dt) => dt.isRequired && documentTypeAppliesTo(dt.code, operator.type),
    );
    const submittedIds = new Set(submittedDocuments.map((d) => d.documentTypeId));
    const missing = applicable.filter((dt) => !submittedIds.has(dt.id));
    return { state: 'INFO_NEEDED', missingDocumentLabels: missing.map((d) => d.label) };
  }

  // PENDING: documentos enviados pero aún en revisión.
  // Si en este estado hay docs faltantes (caso raro), se muestra INFO_NEEDED calculado.
  const applicable = requiredDocumentTypes.filter(
    (dt) => dt.isRequired && documentTypeAppliesTo(dt.code, operator.type),
  );
  const submittedIds = new Set(submittedDocuments.map((d) => d.documentTypeId));
  const missing = applicable.filter((dt) => !submittedIds.has(dt.id));

  if (missing.length > 0) {
    return { state: 'INFO_NEEDED', missingDocumentLabels: missing.map((d) => d.label) };
  }
  return { state: 'PENDING_REVIEW', missingDocumentLabels: [] };
}

export const REVIEW_STATE_LABEL: Record<OperatorReviewState, string> = {
  DRAFT:        'Pendiente de documentos',
  INFO_NEEDED:  'Información incompleta',
  PENDING_REVIEW: 'En revisión',
  APPROVED:     'Aprobado',
  SUSPENDED:    'Suspendido',
  REJECTED:     'Rechazado',
};
