import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { uploadImage } from '@/lib/blob';
import { checkRateLimit } from '@/lib/rateLimit';
import type { OnboardingCountry, OperatorKind } from '@/lib/operatorOnboarding/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_COUNTRIES: OnboardingCountry[] = ['CO', 'BR', 'MX', 'CL', 'AR', 'PE'];
const VALID_KINDS: OperatorKind[] = ['EMPRESA', 'INDEPENDIENTE'];

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { ok: rlOk } = checkRateLimit(`register-operator:${ip}`, 10);
  if (!rlOk) {
    return NextResponse.json({ error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }, { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const operatorKind = String(formData.get('operatorKind') ?? '') as OperatorKind;
  const country = String(formData.get('country') ?? '') as OnboardingCountry;
  const legalName = String(formData.get('legalName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const taxId = String(formData.get('taxId') ?? '').trim();
  const tourismLicense = String(formData.get('tourismLicense') ?? '').trim();
  const professionalCredentialNumber = formData.get('professionalCredentialNumber');
  const legalDocument = formData.get('legalDocument');

  if (!VALID_KINDS.includes(operatorKind)) {
    return NextResponse.json({ error: 'Tipo de operador inválido.' }, { status: 400 });
  }
  if (!VALID_COUNTRIES.includes(country)) {
    return NextResponse.json({ error: 'País inválido.' }, { status: 400 });
  }
  if (!legalName || !email || !phone || !taxId || !tourismLicense) {
    return NextResponse.json({ error: 'Completa todos los campos obligatorios.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }
  // Colombia/Independiente es el único caso que exige este campo — ver
  // src/lib/operatorOnboarding/legalFieldsConfig.ts.
  if (country === 'CO' && operatorKind === 'INDEPENDIENTE' && !professionalCredentialNumber) {
    return NextResponse.json({ error: 'Falta el número de tarjeta profesional.' }, { status: 400 });
  }

  const existing = await prisma.operatorOnboardingSubmission.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe una solicitud con este email. Te contactaremos pronto.' },
      { status: 409 },
    );
  }

  // No bloquea el registro si falla la subida (mismo criterio que
  // src/app/register/operator/actions.ts) — el equipo de NativaGo puede
  // pedir el documento de nuevo durante la revisión en vez de perder toda
  // la solicitud por un problema transitorio de storage.
  let legalDocumentUrl: string | null = null;
  if (legalDocument instanceof File && legalDocument.size > 0) {
    try {
      legalDocumentUrl = await uploadImage(legalDocument);
    } catch (err) {
      console.error('[register-operator] upload failed:', err);
    }
  }

  const submission = await prisma.operatorOnboardingSubmission.create({
    data: {
      operatorKind,
      country,
      legalName,
      email,
      phone,
      taxId,
      tourismLicense,
      professionalCredentialNumber:
        typeof professionalCredentialNumber === 'string' && professionalCredentialNumber.trim()
          ? professionalCredentialNumber.trim()
          : null,
      legalDocumentUrl,
    },
  });

  return NextResponse.json({ id: submission.id, status: submission.status }, { status: 201 });
}
