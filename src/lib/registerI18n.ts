import type { OperatorType } from '@prisma/client';

export type RegisterCategory = { value: string; label: string };

export type RegisterI18n = {
  lang: 'es' | 'pt';
  countryCode: string; // uppercase: CO, BR, MX
  // Page header
  pageTitle: string;
  pageDesc: string;
  backHref: string;
  backLabel: string;
  // Prestador type
  sectionType: string;
  optNatural: string;
  optNaturalDesc: string;
  optJuridica: string;
  optJuridicaDesc: string;
  // Categories
  labelCategoryNatural: string;
  labelCategoryJuridica: string;
  selectOption: string;
  hintCategory: string;
  naturalCategories: RegisterCategory[];
  juridicaCategories: RegisterCategory[];
  // Basic fields
  labelNameNatural: string;
  labelNameJuridica: string;
  labelLegalRep: string;
  labelEmail: string;
  labelPhone: string;
  // Password
  labelPassword: string;
  placeholderPassword: string;
  hintPassword: string;
  showPassword: string;
  hidePassword: string;
  // City
  labelCity: string;
  selectCity: string;
  // Identity & docs section
  sectionIdentity: string;
  labelIdentityNatural: string;
  labelIdentityJuridica: string;
  // Payment
  labelPayment: string;
  placeholderPayment: string;
  hintPayment: string;
  // License doc upload
  labelDocument: string;
  optional: string;
  // Submit
  submitBtn: string;
  hintAfterSubmit: string;
};

const ES_NATURAL_CATEGORIES: RegisterCategory[] = [
  { value: 'GUIA',        label: 'Guía turístico' },
  { value: 'CONDUCTOR',   label: 'Conductor' },
  { value: 'FOTOGRAFO',   label: 'Fotógrafo' },
  { value: 'INSTRUCTOR',  label: 'Instructor (buceo, surf, senderismo...)' },
  { value: 'PESCADOR',    label: 'Pescador' },
  { value: 'COCINERO',    label: 'Cocinero' },
  { value: 'ARTESANO',    label: 'Artesano' },
  { value: 'OTRO',        label: 'Otro' },
];

const ES_JURIDICA_CATEGORIES: RegisterCategory[] = [
  { value: 'AGENCIA_VIAJES',      label: 'Agencia de viajes' },
  { value: 'OPERADOR_TURISTICO',  label: 'Operador turístico' },
  { value: 'TRANSPORTE',          label: 'Empresa de transporte' },
  { value: 'AVENTURA',            label: 'Empresa de aventura' },
  { value: 'HOTEL',               label: 'Hotel' },
  { value: 'OTRO',                label: 'Otro' },
];

const PT_NATURAL_CATEGORIES: RegisterCategory[] = [
  { value: 'GUIA',       label: 'Guia turístico' },
  { value: 'CONDUCTOR',  label: 'Motorista / Condutor' },
  { value: 'FOTOGRAFO',  label: 'Fotógrafo' },
  { value: 'INSTRUCTOR', label: 'Instrutor (mergulho, surf, trekking...)' },
  { value: 'PESCADOR',   label: 'Pescador' },
  { value: 'COCINERO',   label: 'Cozinheiro' },
  { value: 'ARTESANO',   label: 'Artesão' },
  { value: 'OUTRO',      label: 'Outro' },
];

const PT_JURIDICA_CATEGORIES: RegisterCategory[] = [
  { value: 'AGENCIA_VIAJES',     label: 'Agência de viagens' },
  { value: 'OPERADOR_TURISTICO', label: 'Operador turístico' },
  { value: 'TRANSPORTE',         label: 'Empresa de transporte' },
  { value: 'AVENTURA',           label: 'Empresa de aventura' },
  { value: 'HOTEL',              label: 'Hotel' },
  { value: 'OUTRO',              label: 'Outro' },
];

export const REGISTER_I18N: Record<string, RegisterI18n> = {
  co: {
    lang: 'es',
    countryCode: 'CO',
    pageTitle: 'Registro de operador turístico',
    pageDesc: 'Cuéntanos cómo ofreces tus experiencias para pedirte solo lo necesario y verificar tu cuenta.',
    backHref: '/login',
    backLabel: 'Iniciar sesión',
    sectionType: '¿Cómo vas a ofrecer tus experiencias?',
    optNatural: 'Persona natural',
    optNaturalDesc: 'Guía, conductor, fotógrafo, instructor, cocinero, artesano…',
    optJuridica: 'Persona jurídica',
    optJuridicaDesc: 'Agencia, operador turístico, transporte, hotel…',
    labelCategoryNatural: '¿Qué tipo de experiencia ofreces?',
    labelCategoryJuridica: '¿Qué tipo de empresa eres?',
    selectOption: 'Selecciona una opción',
    hintCategory: 'Nos ayuda a mostrarte los documentos correctos y a categorizar tu perfil.',
    naturalCategories: ES_NATURAL_CATEGORIES,
    juridicaCategories: ES_JURIDICA_CATEGORIES,
    labelNameNatural: 'Nombre completo',
    labelNameJuridica: 'Razón social',
    labelLegalRep: 'Representante legal',
    labelEmail: 'Correo electrónico',
    labelPhone: 'Teléfono / WhatsApp',
    labelPassword: 'Contraseña',
    placeholderPassword: 'Mínimo 8 caracteres',
    hintPassword: 'Con esta contraseña accederás a tu panel de operador.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
    labelCity: 'Ciudad donde operas',
    selectCity: 'Selecciona una ciudad',
    sectionIdentity: 'Identidad y documentos',
    labelIdentityNatural: 'Cédula de ciudadanía (número)',
    labelIdentityJuridica: 'Documento fiscal (NIT)',
    labelPayment: 'Cuenta de pago — Nequi, Daviplata o número bancario',
    placeholderPayment: '+57 300 000 0000 o número de cuenta',
    hintPayment: 'Aquí recibirás los pagos de NativaGo. Puedes completarlo después si aún no lo tienes.',
    labelDocument: 'Documento de soporte (cédula, licencia o registro — PDF o imagen)',
    optional: '(opcional)',
    submitBtn: 'Crear cuenta y enviar para verificación',
    hintAfterSubmit: 'Podrás entrar a tu panel y armar tu primera experiencia en borrador mientras revisamos tu cuenta.',
  },

  br: {
    lang: 'pt',
    countryCode: 'BR',
    pageTitle: 'Cadastro de operador turístico',
    pageDesc: 'Conte-nos como você oferece suas experiências para solicitar apenas o necessário e verificar sua conta.',
    backHref: '/login',
    backLabel: 'Entrar na conta',
    sectionType: 'Como você vai oferecer suas experiências?',
    optNatural: 'Pessoa física',
    optNaturalDesc: 'Guia, motorista, fotógrafo, instrutor, cozinheiro, artesão…',
    optJuridica: 'Pessoa jurídica',
    optJuridicaDesc: 'Agência, operador turístico, transporte, hotel…',
    labelCategoryNatural: 'Que tipo de experiência você oferece?',
    labelCategoryJuridica: 'Que tipo de empresa você é?',
    selectOption: 'Selecione uma opção',
    hintCategory: 'Isso nos ajuda a mostrar os documentos corretos e a categorizar seu perfil.',
    naturalCategories: PT_NATURAL_CATEGORIES,
    juridicaCategories: PT_JURIDICA_CATEGORIES,
    labelNameNatural: 'Nome completo',
    labelNameJuridica: 'Razão social',
    labelLegalRep: 'Representante legal',
    labelEmail: 'E-mail',
    labelPhone: 'Telefone / WhatsApp',
    labelPassword: 'Senha',
    placeholderPassword: 'Mínimo 8 caracteres',
    hintPassword: 'Com esta senha você acessará seu painel de operador.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
    labelCity: 'Cidade onde você atua',
    selectCity: 'Selecione uma cidade',
    sectionIdentity: 'Identidade e documentos',
    labelIdentityNatural: 'CPF (número)',
    labelIdentityJuridica: 'CNPJ (número)',
    labelPayment: 'Chave PIX — celular, CPF ou e-mail',
    placeholderPayment: 'celular, CPF ou e-mail registrado no PIX',
    hintPayment: 'Você receberá os pagamentos do NativaGo aqui. Pode preencher depois se ainda não tiver.',
    labelDocument: 'Documento de suporte (identidade, licença ou registro — PDF ou imagem)',
    optional: '(opcional)',
    submitBtn: 'Criar conta e enviar para verificação',
    hintAfterSubmit: 'Você poderá acessar seu painel e criar sua primeira experiência em rascunho enquanto analisamos sua conta.',
  },

  mx: {
    lang: 'es',
    countryCode: 'MX',
    pageTitle: 'Registro de operador turístico',
    pageDesc: 'Cuéntanos cómo ofreces tus experiencias para pedirte solo lo necesario y verificar tu cuenta.',
    backHref: '/login',
    backLabel: 'Iniciar sesión',
    sectionType: '¿Cómo vas a ofrecer tus experiencias?',
    optNatural: 'Persona física',
    optNaturalDesc: 'Guía, conductor, fotógrafo, instructor, cocinero, artesano…',
    optJuridica: 'Persona moral',
    optJuridicaDesc: 'Agencia, operador turístico, transporte, hotel…',
    labelCategoryNatural: '¿Qué tipo de experiencia ofreces?',
    labelCategoryJuridica: '¿Qué tipo de empresa eres?',
    selectOption: 'Selecciona una opción',
    hintCategory: 'Nos ayuda a mostrarte los documentos correctos y a categorizar tu perfil.',
    naturalCategories: ES_NATURAL_CATEGORIES,
    juridicaCategories: ES_JURIDICA_CATEGORIES,
    labelNameNatural: 'Nombre completo',
    labelNameJuridica: 'Razón social',
    labelLegalRep: 'Representante legal',
    labelEmail: 'Correo electrónico',
    labelPhone: 'Teléfono / WhatsApp',
    labelPassword: 'Contraseña',
    placeholderPassword: 'Mínimo 8 caracteres',
    hintPassword: 'Con esta contraseña accederás a tu panel de operador.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
    labelCity: 'Ciudad donde operas',
    selectCity: 'Selecciona una ciudad',
    sectionIdentity: 'Identidad y documentos',
    labelIdentityNatural: 'CURP (número)',
    labelIdentityJuridica: 'RFC (número)',
    labelPayment: 'Cuenta CLABE o número bancario (SPEI)',
    placeholderPayment: '18 dígitos CLABE',
    hintPayment: 'Aquí recibirás los pagos de NativaGo. Puedes completarlo después si aún no lo tienes.',
    labelDocument: 'Documento de soporte (identificación, licencia o registro — PDF o imagen)',
    optional: '(opcional)',
    submitBtn: 'Crear cuenta y enviar para verificación',
    hintAfterSubmit: 'Podrás entrar a tu panel y armar tu primera experiencia en borrador mientras revisamos tu cuenta.',
  },
};

// Error messages per language for the server action
export const REGISTER_ERRORS: Record<string, Record<string, string>> = {
  es: {
    required: 'Completa todos los campos obligatorios.',
    password: 'La contraseña debe tener al menos 8 caracteres.',
    city: 'Ciudad inválida. Selecciona otra.',
    email: 'Este email ya está registrado. Inicia sesión en /login.',
  },
  pt: {
    required: 'Preencha todos os campos obrigatórios.',
    password: 'A senha deve ter pelo menos 8 caracteres.',
    city: 'Cidade inválida. Selecione outra.',
    email: 'Este e-mail já está cadastrado. Faça login em /login.',
  },
};

// Map operator type to audience for document filtering
export const DOCUMENT_AUDIENCE_BY_CODE: Record<string, OperatorType | 'BOTH'> = {
  CNPJ: 'AGENCY',
  CPF: 'FREELANCE',
  CADASTUR: 'BOTH',
  RNT: 'BOTH',
  RFC: 'BOTH',
  REPSE: 'AGENCY',
  SECTUR: 'BOTH',
};

export function documentTypeAppliesToOperator(code: string, operatorType: OperatorType): boolean {
  const audience = DOCUMENT_AUDIENCE_BY_CODE[code] ?? 'BOTH';
  return audience === 'BOTH' || audience === operatorType;
}
