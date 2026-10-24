import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

// ENDPOINT TEMPORAL -- crea/resetea 4 cuentas de prueba (una por rol del
// CMS: SUPERADMIN, SUPPORT, ADMIN de operador, STAFF de operador) con una
// contraseña conocida, porque ninguna estaba disponible: las existentes
// tienen password hasheado desconocido, y no existe NINGÚN OperatorMember
// (ADMIN/STAFF) en la base real -- ver comentario en schema.prisma, línea
// ~107. A propósito FUERA de /api/admin/ -- el middleware exige sesión
// válida en todo ese prefijo, así que un endpoint de recuperación ahí
// adentro nunca sería alcanzable sin ya estar logueado (ver
// middleware.ts). Protegido por un token de un solo uso embebido aquí.
// SE ELIMINA en el commit inmediatamente siguiente a confirmar que los 4
// logins funcionan -- no debe quedar desplegado.
const ONE_TIME_TOKEN = 'kXp9QwZt2FvN7hYrJ4mBsL1cRdWx6uAe';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const password = req.nextUrl.searchParams.get('password');
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'password debe tener al menos 8 caracteres (?password=...)' },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  // 1) SUPERADMIN -- usuario ya existente, solo reset de password.
  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@nativago.com' },
    update: { password: hashed },
    create: { email: 'admin@nativago.com', password: hashed, name: 'Super Admin', role: 'SUPERADMIN' },
  });

  // 2) SUPPORT -- usuario ya existente, solo reset de password.
  const support = await prisma.user.upsert({
    where: { email: 'nativago@yopmail.com' },
    update: { password: hashed },
    create: { email: 'nativago@yopmail.com', password: hashed, name: 'NativaGo Soporte', role: 'SUPPORT' },
  });

  // 3) Operator demo para alojar los roles ADMIN/STAFF -- no existía
  // ningún Operator en la base (tabla vacía), así que se crea uno nuevo,
  // ya aprobado y con contrato aceptado para no quedar atrapado en
  // onboarding al entrar.
  const city = await prisma.city.findFirst({ where: { name: 'Cartagena' } });
  if (!city) {
    return NextResponse.json({ error: 'No se encontró la ciudad Cartagena para crear el Operator demo' }, { status: 500 });
  }

  const operator = await prisma.operator.upsert({
    where: { email: 'demo-roles@nativago.com' },
    update: {},
    create: {
      name: 'Operador Demo (roles ADMIN/STAFF)',
      email: 'demo-roles@nativago.com',
      cityId: city.id,
      countryId: city.countryId,
      type: 'AGENCY',
      verificationStatus: 'APPROVED',
      liabilityAccepted: true,
      liabilityAcceptedAt: new Date(),
      contractAccepted: true,
      contractAcceptedAt: new Date(),
    },
  });

  // 4) Admin operador -- User OPERATOR_AGENCY + OperatorMember rol ADMIN.
  const operatorAdminUser = await prisma.user.upsert({
    where: { email: 'admin.operador.demo@nativago.com' },
    update: { password: hashed, operatorTermsAccepted: true, operatorTermsAcceptedAt: new Date() },
    create: {
      email: 'admin.operador.demo@nativago.com',
      password: hashed,
      name: 'Admin Operador Demo',
      role: 'OPERATOR_AGENCY',
      operatorTermsAccepted: true,
      operatorTermsAcceptedAt: new Date(),
    },
  });
  await prisma.operatorMember.upsert({
    where: { operatorId_userId: { operatorId: operator.id, userId: operatorAdminUser.id } },
    update: { role: 'ADMIN' },
    create: { operatorId: operator.id, userId: operatorAdminUser.id, role: 'ADMIN' },
  });

  // 5) Funcionario (staff) del operador -- User OPERATOR_AGENCY + OperatorMember rol STAFF.
  const operatorStaffUser = await prisma.user.upsert({
    where: { email: 'staff.operador.demo@nativago.com' },
    update: { password: hashed, operatorTermsAccepted: true, operatorTermsAcceptedAt: new Date() },
    create: {
      email: 'staff.operador.demo@nativago.com',
      password: hashed,
      name: 'Funcionario Operador Demo',
      role: 'OPERATOR_AGENCY',
      operatorTermsAccepted: true,
      operatorTermsAcceptedAt: new Date(),
    },
  });
  await prisma.operatorMember.upsert({
    where: { operatorId_userId: { operatorId: operator.id, userId: operatorStaffUser.id } },
    update: { role: 'STAFF' },
    create: { operatorId: operator.id, userId: operatorStaffUser.id, role: 'STAFF' },
  });

  return NextResponse.json({
    ok: true,
    password,
    accounts: {
      superadmin: superadmin.email,
      support: support.email,
      operatorAdmin: operatorAdminUser.email,
      operatorStaff: operatorStaffUser.email,
    },
    message: 'Las 4 cuentas quedaron listas con la misma contraseña. Elimina este endpoint ahora.',
  });
}
