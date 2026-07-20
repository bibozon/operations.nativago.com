import crypto from 'crypto';
import { cookies } from 'next/headers';

// Sin caracteres ambiguos (0/O, 1/l/I) — se muestra una sola vez al crear
// una cuenta (Soporte o miembro de equipo), así que debe ser fácil de leer.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generateTempPassword(): string {
  const bytes = crypto.randomBytes(14);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

const FLASH_COOKIE = 'flash_new_credentials';

// Credenciales de una cuenta recién creada, guardadas de forma efímera para
// sobrevivir el redirect posterior a la creación (no hay infraestructura de
// email en este repo — se muestran una vez en la propia página, nunca en la
// URL ni en logs). Expiran solas a los 30s; también se pueden descartar antes
// con clearFlashCredentials() desde una Server Action.
export async function setFlashCredentials(email: string, password: string) {
  const store = await cookies();
  store.set(FLASH_COOKIE, JSON.stringify({ email, password }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30,
  });
}

export async function readFlashCredentials(): Promise<{ email: string; password: string } | null> {
  const store = await cookies();
  const raw = store.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { email: string; password: string };
  } catch {
    return null;
  }
}

export async function clearFlashCredentials() {
  const store = await cookies();
  store.delete(FLASH_COOKIE);
}
