import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role, Operator } from '@prisma/client';
import prisma from '@/lib/db';
import { verifyAuthToken, type AuthTokenPayload, type AuthOperatorRole } from '@/lib/auth';

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

// SUPERADMIN + SUPPORT: acceso operativo día a día (dashboard, experiencias,
// reservas, check-in, operadores) pero no configuración/categorías/ciudades.
export function requireStaffOrAbove(): Promise<AuthTokenPayload> {
  return requireRole(['SUPERADMIN' as Role, 'SUPPORT' as Role]);
}

// Versión sin redirect, para checks de ownership: SUPERADMIN/SUPPORT ven y
// gestionan todos los operadores; el resto se restringe a auth.operatorId.
export function isStaffOrAbove(role: string): boolean {
  return role === 'SUPERADMIN' || role === 'SUPPORT';
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

  const membership = await prisma.operatorMember.findFirst({
    where: { userId: auth.userId },
    select: { operator: { select: { contractAccepted: true } } },
  });

  if (!membership?.operator.contractAccepted) {
    redirect('/legal/operador/aceite');
  }

  return auth;
}

// Combina requireOperator() con el registro completo del Operator — en
// particular countryId, que es la frontera de aislamiento multi-país: un
// operador solo puede crear/editar ciudades, categorías y experiencias
// dentro de su propio country. Centraliza el lookup que antes se repetía
// (ad hoc) en cada página.
//
// Resuelve el Operator vía OperatorMember (no vía Operator.userId): un
// operador puede tener varios usuarios (ADMIN y STAFF), y OperatorMember es
// la única fuente de verdad para permisos desde que existe.
export async function requireOperatorContext(): Promise<{
  auth: AuthTokenPayload;
  operator: Operator;
  operatorRole: AuthOperatorRole;
}> {
  const auth = await requireOperator();

  const membership = await prisma.operatorMember.findFirst({
    where: { userId: auth.userId },
    include: { operator: true },
  });
  if (!membership) {
    redirect('/register/operator');
  }
  if (!membership.operator.countryId) {
    throw new Error(`Operator ${membership.operator.id} has no countryId — run prisma/backfill-country.js`);
  }

  return { auth, operator: membership.operator, operatorRole: membership.role };
}

// Solo el ADMIN del operador (no STAFF) puede gestionar el equipo o (a
// futuro) datos sensibles de la cuenta como el perfil de pago.
export async function requireOperatorAdmin() {
  const ctx = await requireOperatorContext();
  if (ctx.operatorRole !== 'ADMIN') {
    redirect(ctx.operator.type === 'AGENCY' ? '/admin/agency' : '/admin/freelance');
  }
  return ctx;
}
