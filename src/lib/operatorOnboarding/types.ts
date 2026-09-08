export type OperatorKind = 'EMPRESA' | 'INDEPENDIENTE';

export type OnboardingCountry = 'CO' | 'BR' | 'MX' | 'CL' | 'AR' | 'PE';

/**
 * Payload normalizado — el mismo shape sin importar el país. taxId cubre
 * NIT/CNPJ/RFC/RUT/CUIT/RUC (o el documento de identidad cuando el
 * operador es independiente y no tiene un identificador fiscal propio) y
 * tourismLicense cubre RNT/CADASTUR/SERNATUR/DIRCETUR según corresponda.
 * professionalCredentialNumber solo aplica a un caso (guía independiente
 * en Colombia, que además del RNT tiene un número de tarjeta profesional
 * separado) — en el resto queda undefined.
 */
export interface OperatorFormState {
  operatorKind: OperatorKind;
  country: OnboardingCountry;

  legalName: string;
  email: string;
  phone: string;

  taxId: string;
  tourismLicense: string;
  professionalCredentialNumber?: string;

  legalDocument: File | null;
}

export interface OperatorFormErrors {
  legalName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  tourismLicense?: string;
  professionalCredentialNumber?: string;
  legalDocument?: string;
}

export function createEmptyOperatorFormState(
  country: OnboardingCountry = 'CO',
  operatorKind: OperatorKind = 'INDEPENDIENTE',
): OperatorFormState {
  return {
    operatorKind,
    country,
    legalName: '',
    email: '',
    phone: '',
    taxId: '',
    tourismLicense: '',
    professionalCredentialNumber: '',
    legalDocument: null,
  };
}
