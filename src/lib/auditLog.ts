import prisma from '@/lib/db';
import type { Prisma } from '@prisma/client';

export type AuditActor = {
  userId?: number | string | null;
  email?: string | null;
  role?: string | null;
};

export type ExperienceAuditAction = 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'DELETE';

// Registro de auditoría de actividades: quién y cuándo creó, modificó,
// aprobó/rechazó o eliminó cada experiencia. No lanza si falla el insert
// del log — un problema de auditoría no debe tumbar la operación real.
export async function logExperienceChange(params: {
  experienceId: string;
  action: ExperienceAuditAction;
  changes?: Record<string, unknown>;
  actor: AuditActor;
}) {
  try {
    await prisma.experienceAuditLog.create({
      data: {
        experienceId: params.experienceId,
        action: params.action,
        changes: (params.changes as Prisma.InputJsonValue) ?? undefined,
        performedByUserId: params.actor.userId != null ? String(params.actor.userId) : null,
        performedByEmail: params.actor.email ?? null,
        performedByRole: params.actor.role ?? null,
      },
    });
  } catch (error) {
    console.error('logExperienceChange failed', error);
  }
}

// Diff superficial entre el registro previo y los campos que se intentaron
// actualizar — solo incluye claves realmente presentes en `next` y cuyo
// valor cambió, para no inflar el log con campos que no se tocaron.
export function diffFields(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(next)) {
    if (next[key] === undefined) continue;
    const prevValue = prev[key];
    const nextValue = next[key];
    const changed = Array.isArray(nextValue)
      ? JSON.stringify(prevValue) !== JSON.stringify(nextValue)
      : prevValue !== nextValue;
    if (changed) {
      changes[key] = { from: prevValue, to: nextValue };
    }
  }
  return changes;
}
