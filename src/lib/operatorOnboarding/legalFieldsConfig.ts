import type { OnboardingCountry, OperatorKind } from './types';

export interface LegalFieldConfig {
  taxIdLabel: string;
  taxIdPlaceholder: string;
  tourismLicenseLabel: string;
  tourismLicensePlaceholder: string;
  /** Solo Colombia/Independiente lo usa hoy — el resto de combinaciones lo omite. */
  professionalCredentialLabel?: string;
  professionalCredentialPlaceholder?: string;
  legalDocumentLabel: string;
}

export const COUNTRY_LABELS: Record<OnboardingCountry, string> = {
  CO: 'Colombia',
  BR: 'Brasil',
  MX: 'México',
  CL: 'Chile',
  AR: 'Argentina',
  PE: 'Perú',
};

export const OPERATOR_KIND_LABELS: Record<OperatorKind, string> = {
  EMPRESA: 'Empresa',
  INDEPENDIENTE: 'Independiente',
};

/**
 * Matriz legal por país × tipo de operador. Cada entrada define solo las
 * etiquetas — los componentes leen esta config y no conocen reglas de
 * ningún país en particular, así que agregar un país nuevo es agregar una
 * fila acá, no tocar el formulario.
 */
export const LEGAL_FIELDS_CONFIG: Record<OnboardingCountry, Record<OperatorKind, LegalFieldConfig>> = {
  CO: {
    EMPRESA: {
      taxIdLabel: 'NIT',
      taxIdPlaceholder: '900123456-7',
      tourismLicenseLabel: 'RNT (Registro Nacional de Turismo)',
      tourismLicensePlaceholder: 'Número de RNT',
      legalDocumentLabel: 'Certificado de Cámara de Comercio',
    },
    INDEPENDIENTE: {
      taxIdLabel: 'Cédula de ciudadanía',
      taxIdPlaceholder: '1020304050',
      tourismLicenseLabel: 'RNT Guía',
      tourismLicensePlaceholder: 'Número de RNT como guía',
      professionalCredentialLabel: 'Tarjeta profesional de guía',
      professionalCredentialPlaceholder: 'Número de tarjeta profesional',
      legalDocumentLabel: 'Copia de la tarjeta profesional',
    },
  },
  BR: {
    EMPRESA: {
      taxIdLabel: 'CNPJ',
      taxIdPlaceholder: '00.000.000/0001-00',
      tourismLicenseLabel: 'CADASTUR da empresa',
      tourismLicensePlaceholder: 'Número do CADASTUR',
      legalDocumentLabel: 'Contrato social',
    },
    INDEPENDIENTE: {
      taxIdLabel: 'CPF',
      taxIdPlaceholder: '000.000.000-00',
      tourismLicenseLabel: 'CADASTUR de guia de turismo',
      tourismLicensePlaceholder: 'Número do CADASTUR',
      legalDocumentLabel: 'Credencial de guia (MTE)',
    },
  },
  MX: {
    EMPRESA: {
      taxIdLabel: 'RFC',
      taxIdPlaceholder: 'ABC010101AAA',
      tourismLicenseLabel: 'RNT de SECTUR',
      tourismLicensePlaceholder: 'Número de registro SECTUR',
      legalDocumentLabel: 'Acta constitutiva',
    },
    INDEPENDIENTE: {
      taxIdLabel: 'CURP / RFC',
      taxIdPlaceholder: 'CURP o RFC',
      tourismLicenseLabel: 'RNT — credencial de guía (SECTUR)',
      tourismLicensePlaceholder: 'Número de credencial SECTUR',
      legalDocumentLabel: 'Credencial NOM-08/09',
    },
  },
  CL: {
    EMPRESA: {
      taxIdLabel: 'RUT',
      taxIdPlaceholder: '76.123.456-7',
      tourismLicenseLabel: 'Registro SERNATUR',
      tourismLicensePlaceholder: 'Número de registro SERNATUR',
      legalDocumentLabel: 'Patente municipal',
    },
    INDEPENDIENTE: {
      taxIdLabel: 'RUN',
      taxIdPlaceholder: '12.345.678-9',
      tourismLicenseLabel: 'Registro de guías SERNATUR',
      tourismLicensePlaceholder: 'Número de registro de guía',
      legalDocumentLabel: 'Sello de registro',
    },
  },
  AR: {
    EMPRESA: {
      taxIdLabel: 'CUIT',
      taxIdPlaceholder: '30-12345678-9',
      tourismLicenseLabel: 'Registro oficial de agencias de viajes',
      tourismLicensePlaceholder: 'Número de registro',
      legalDocumentLabel: 'Habilitación comercial',
    },
    INDEPENDIENTE: {
      taxIdLabel: 'CUIL / CUIT',
      taxIdPlaceholder: '20-12345678-9',
      tourismLicenseLabel: 'Registro provincial/municipal de guías',
      tourismLicensePlaceholder: 'Número de registro',
      legalDocumentLabel: 'Credencial de guía',
    },
  },
  PE: {
    EMPRESA: {
      taxIdLabel: 'RUC',
      taxIdPlaceholder: '20123456789',
      tourismLicenseLabel: 'Registro DIRCETUR / MINCETUR',
      tourismLicensePlaceholder: 'Número de registro',
      legalDocumentLabel: 'Constancia de prestador turístico',
    },
    INDEPENDIENTE: {
      taxIdLabel: 'DNI / RUC',
      taxIdPlaceholder: 'DNI o RUC',
      tourismLicenseLabel: 'Carné de guía oficial (DIRCETUR)',
      tourismLicensePlaceholder: 'Número de carné',
      legalDocumentLabel: 'Título profesional de guía',
    },
  },
};

export function getLegalFieldConfig(country: OnboardingCountry, kind: OperatorKind): LegalFieldConfig {
  return LEGAL_FIELDS_CONFIG[country][kind];
}
