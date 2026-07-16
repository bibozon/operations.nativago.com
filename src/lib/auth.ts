import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getEnv } from './env';

const JWT_SECRET = getEnv('JWT_SECRET', 'dummy_secret_for_build');

export function getJwtSecret() {
  if (!JWT_SECRET || JWT_SECRET === 'dummy_secret_for_build') {
    if (typeof window === 'undefined') {
      throw new Error('JWT_SECRET not configured');
    }
    // Client/browser: fallback
    return 'dummy_secret_for_build';
  }
  return JWT_SECRET;
}

export type AuthRole = 'SUPERADMIN' | 'OPERATOR_AGENCY' | 'OPERATOR_FREELANCE';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: AuthRole;
  operatorId?: string | null;
  name?: string | null;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
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
