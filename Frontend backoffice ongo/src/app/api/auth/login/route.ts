import { NextRequest, NextResponse } from "next/server";

// Credenciales fijas de super admin para entorno de demo
const SUPER_ADMIN_EMAIL = "superadmin@nativago.com";
const SUPER_ADMIN_PASSWORD = "superadmin123";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 });
  }

  // El frontend solo necesita un token cualquiera almacenado en localStorage
  const token = "superadmin-demo-token";

  return NextResponse.json({ token });
}
