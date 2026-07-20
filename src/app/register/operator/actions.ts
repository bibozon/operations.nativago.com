'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { signAuthToken } from '@/lib/auth';
import { uploadImage } from '@/lib/blob';
import { operatorTypeFromPrestadorTipo, type PrestadorTipo } from '@/lib/operatorRegistration';

export type RegisterState = { error: string } | null;

// Firma compatible con useFormState de react-dom (React 18)
export async function registerOperator(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name               = (formData.get('name') as string) ?? '';
  const email              = (formData.get('email') as string) ?? '';
  const phone              = (formData.get('phone') as string) ?? '';
  const password           = (formData.get('password') as string) ?? '';
  const cityId             = (formData.get('cityId') as string) ?? '';
  const prestadorTipo      = ((formData.get('prestadorTipo') as string) ?? 'NATURAL') as PrestadorTipo;
  const identityDocumentNumber = (formData.get('identityDocumentNumber') as string) ?? '';
  const legalRepresentative    = (formData.get('legalRepresentative') as string) ?? '';
  const categoria              = (formData.get('categoria') as string) ?? '';
  const paymentAccount         = (formData.get('paymentAccount') as string) ?? '';
  const liabilityAccepted      = formData.get('liabilityAccepted') === 'on';
  const file                   = formData.get('licenseDocument');

  if (!name || !email || !password || !cityId || !identityDocumentNumber || !liabilityAccepted) {
    return { error: 'Completa todos los campos obligatorios.' };
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const city = await prisma.city.findUnique({ where: { id: cityId }, select: { countryId: true } });
  if (!city?.countryId) {
    return { error: 'Ciudad inválida. Selecciona otra.' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Este email ya está registrado. Inicia sesión en /login.' };
  }

  // Subir documento de soporte directamente (sin pasar por /api/upload)
  let licenseDocumentUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      licenseDocumentUrl = await uploadImage(file);
    } catch {
      // No bloquear el registro si falla la subida del archivo
    }
  }

  const operatorType = operatorTypeFromPrestadorTipo(prestadorTipo);
  const role         = operatorType === 'AGENCY' ? ('OPERATOR_AGENCY' as const) : ('OPERATOR_FREELANCE' as const);
  const hashedPassword = await bcrypt.hash(password, 12);

  const { user, operator } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password:               hashedPassword,
        role,
        operatorTermsAccepted:    true,
        operatorTermsAcceptedAt:  new Date(),
      },
    });

    const operator = await tx.operator.create({
      data: {
        name,
        email,
        phone:               phone || null,
        cityId,
        countryId:           city.countryId,
        type:                operatorType,
        verificationStatus:  'DRAFT',
        licenseNumber:       identityDocumentNumber,
        licenseDocument:     licenseDocumentUrl,
        categoria:           categoria || null,
        legalRepresentative: legalRepresentative || null,
        paymentAccount:      paymentAccount || null,
        liabilityAccepted:   true,
        liabilityAcceptedAt: new Date(),
        userId:              user.id,
      },
    });

    await tx.operatorMember.create({
      data: { operatorId: operator.id, userId: user.id, role: 'ADMIN' },
    });

    return { user, operator };
  });

  // Documentos dinámicos por país+tipo
  const relevantTypes = await prisma.documentType.findMany({ where: { countryId: city.countryId } });
  const documentsToCreate = relevantTypes
    .map((dt) => {
      const value = (formData.get(`doc_${dt.id}`) as string) ?? '';
      return value ? { operatorId: operator.id, documentTypeId: dt.id, value } : null;
    })
    .filter((d): d is { operatorId: string; documentTypeId: string; value: string } => d !== null);

  if (documentsToCreate.length > 0) {
    await prisma.operatorDocument.createMany({ data: documentsToCreate });
  }

  const token = signAuthToken({
    userId:       user.id,
    email:        user.email,
    role,
    operatorId:   operator.id,
    operatorRole: 'ADMIN',
    name:         user.name,
  });

  const cookieStore = await cookies();
  cookieStore.set('auth', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  });

  redirect('/operator/dashboard');
}
