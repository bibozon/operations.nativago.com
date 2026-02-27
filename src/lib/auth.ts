import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export type AuthRole = 'SUPERADMIN' | 'OPERATOR_AGENCY' | 'OPERATOR_FREELANCE';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: AuthRole;
  operatorId?: number | null;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getAuthTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get('auth');
  return cookie?.value ?? null;
}

export function getAuthUserFromRequest(request: NextRequest): AuthTokenPayload | null {
  const token = getAuthTokenFromRequest(request);
  if (!token) return null;

  return verifyAuthToken(token);
}
