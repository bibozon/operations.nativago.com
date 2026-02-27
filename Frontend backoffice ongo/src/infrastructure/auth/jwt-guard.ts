import { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

interface TokenPayload {
  sub: string;
  role: string;
}

function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

export async function requireAdmin(req: NextRequest): Promise<TokenPayload> {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = verify(token, JWT_SECRET);
  } catch {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (payload.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  return payload as TokenPayload;
}

export async function requireAdminOrPartner(req: NextRequest): Promise<TokenPayload> {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = verify(token, JWT_SECRET);
  } catch {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (payload.role !== "ADMIN" && payload.role !== "PARTNER") {
    throw new Response("Forbidden", { status: 403 });
  }

  return payload as TokenPayload;
}
