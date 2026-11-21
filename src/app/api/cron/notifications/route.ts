import { NextRequest, NextResponse } from 'next/server';
import { processOutbox } from '@/services/notifications/outbox';

// Lo invoca Vercel Cron (ver vercel.json). Vercel envía
// "Authorization: Bearer <CRON_SECRET>" cuando la variable CRON_SECRET existe.
// Sin secreto configurado o con uno incorrecto, responde 401: nunca es público.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = (process.env.CRON_SECRET ?? '').trim();
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processOutbox({ limit: 50 });
  return NextResponse.json({ ok: true, ...result });
}
