import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role, Operator } from '@prisma/client';
import prisma from '@/lib/db';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth';

export async function getAuthFromCookies(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  if (!token) return null;

  return verifyAuthToken(token);
}

export async function requireAuth(): Promise<AuthTokenPayload> {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/login');
  return auth;
}

export async function requireRole(roles: Role[]): Promise<AuthTokenPayload> {
  const auth = await requireAuth();

  if (!roles.includes(auth.role as Role)) {
    redirect('/admin');
  }

  return auth;
}

export function requireSuperadmin(): Promise<AuthTokenPayload> {
  return requireRole(['SUPERADMIN' as Role]);
}

export async function requireOperator(): Promise<AuthTokenPayload> {
  const auth = await requireRole([
    'OPERATOR_AGENCY' as Role,
    'OPERATOR_FREELANCE' as Role,
  ]);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { operatorTermsAccepted: true },
  });

  if (!user?.operatorTermsAccepted) {
    redirect('/register/operator/terms');
  }

   const operator = await prisma.operator.findFirst({
     where: { userId: auth.userId },
     select: { contractAccepted: true },
   });

   if (!operator?.contractAccepted) {
     redirect('/legal/operador/aceite');
   }

  return auth;
}

// Combina requireOperator() con el registro completo del Operator — en
// particular countryId, que es la frontera de aislamiento multi-país: un
// operador solo puede crear/editar ciudades, categorías y experiencias
// dentro de su propio country. Centraliza el lookup que antes se repetía
// (ad hoc) en cada página.
export async function requireOperatorContext(): Promise<{ auth: AuthTokenPayload; operator: Operator }> {
  const auth = await requireOperator();

  const operator = await prisma.operator.findFirst({ where: { userId: auth.userId } });
  if (!operator) {
    redirect('/register/operator');
  }
  if (!operator.countryId) {
    throw new Error(`Operator ${operator.id} has no countryId — run prisma/backfill-country.js`);
  }

  return { auth, operator };
}
