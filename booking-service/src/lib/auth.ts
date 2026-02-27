import { jwtVerify, JWTPayload } from "jose";
import { NextRequest, NextResponse } from "next/server";

export type Role = "user" | "partner" | "admin" | "service";

export interface AuthClaims {
  sub: string;
  role: Role;
  iss: string;
  aud: string;
  exp?: number;
}

const ISSUER = "nativago-auth";
const AUDIENCE = "nativago-services";

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

function mapPayloadToClaims(payload: JWTPayload): AuthClaims {
  const sub = typeof payload.sub === "string" ? payload.sub : undefined;
  const role = typeof payload.role === "string" ? (payload.role as Role) : undefined;
  const iss = typeof payload.iss === "string" ? payload.iss : undefined;
  const aud = typeof payload.aud === "string" ? payload.aud : undefined;

  if (!sub || !role || !iss || !aud) {
    throw new Error("Invalid JWT payload");
  }

  if (!["user", "partner", "admin", "service"].includes(role)) {
    throw new Error("Invalid role in token");
  }

  return {
    sub,
    role,
    iss,
    aud,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
  };
}

// Verifica un token (JWT o service token estático) y devuelve las claims.
export async function verifyToken(rawToken: string): Promise<AuthClaims> {
  const serviceToken = process.env.SERVICE_TOKEN;

  // Service token estático: acceso como rol service
  if (serviceToken && rawToken === serviceToken) {
    return {
      sub: "service",
      role: "service",
      iss: ISSUER,
      aud: AUDIENCE,
    };
  }

  // Caso JWT firmado
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(rawToken, secret, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  const claims = mapPayloadToClaims(payload);

  if (claims.iss !== ISSUER || claims.aud !== AUDIENCE) {
    throw new Error("Invalid iss or aud");
  }

  return claims;
}

export interface AuthContext extends AuthClaims {}

// Comprueba rol permitido. El rol service siempre se acepta para llamadas internas.
export function assertRoleAllowed(auth: AuthContext, allowedRoles: Role[]): void {
  if (auth.role === "service") {
    return;
  }
  if (!allowedRoles.includes(auth.role)) {
    throw new Error("Forbidden");
  }
}

export function getAuthFromHeaders(headers: Headers): AuthContext | null {
  const sub = headers.get("x-nativago-sub");
  const role = headers.get("x-nativago-role") as Role | null;
  const iss = headers.get("x-nativago-iss");
  const aud = headers.get("x-nativago-aud");

  if (!sub || !role || !iss || !aud) {
    return null;
  }

  return { sub, role, iss, aud };
}

// Helpers de alto nivel para usar directamente en los route handlers

// Requiere un JWT o service token válido. Opcionalmente aplica control de rol.
// Devuelve AuthContext o un NextResponse de error (401/403).
export async function requireAuth(
  req: NextRequest,
  options?: { roles?: Role[] }
): Promise<AuthContext | NextResponse> {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring("Bearer ".length).trim();

  try {
    const claims = await verifyToken(token);
    const auth: AuthContext = claims;

    if (options?.roles) {
      try {
        assertRoleAllowed(auth, options.roles);
      } catch {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    return auth;
  } catch (error) {
    console.error("requireAuth error", error);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

// Permite acceso público, pero intenta resolver un usuario si hay token válido.
// Nunca lanza error: o devuelve AuthContext o null.
export async function allowPublic(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring("Bearer ".length).trim();

  try {
    const claims = await verifyToken(token);
    const auth: AuthContext = claims;
    return auth;
  } catch (error) {
    console.warn("allowPublic token invalid, ignoring", error);
    return null;
  }
}

// Helper simple para usar cuando ya tienes AuthContext (p.ej. desde middleware).
// Devuelve NextResponse de 403 si el rol no está permitido, o null si todo ok.
export function requireRole(auth: AuthContext, roles: Role[]): NextResponse | null {
  try {
    assertRoleAllowed(auth, roles);
    return null;
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}
