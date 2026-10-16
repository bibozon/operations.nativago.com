import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

// ENDPOINT TEMPORAL -- creado para un reset de contraseña de un solo uso
// del admin, porque la contraseña real se perdió y no hay forma de
// conectarse a la base de datos ni un flujo real de "olvidé mi
// contraseña" implementado todavía. Protegido por un token de un solo
// uso embebido aquí mismo (no por env var, para no depender de
// configuración adicional en Vercel). SE ELIMINA en el commit
// inmediatamente siguiente a confirmar que el login funciona -- no debe
// quedar desplegado.
const ONE_TIME_TOKEN = 'WRR70CTwnNY_niN-c7OSVqxJIWDGQ39E';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const newPassword = req.nextUrl.searchParams.get('newPassword');
  const email = req.nextUrl.searchParams.get('email') ?? 'admin@nativago.com';

  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'newPassword debe tener al menos 8 caracteres (?newPassword=...)' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'user_not_found', email }, { status: 404 });
  }

  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true, email, message: 'Password actualizado. Elimina este endpoint ahora.' });
}
