import { NextResponse } from 'next/server';
import { generateOperatorContract } from '@/services/operator/contract';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    let operatorId: number | null = idParam ? Number(idParam) : null;

    if (!operatorId || !Number.isFinite(operatorId)) {
      const body = await request.json().catch(() => null as any);
      if (body && typeof body.id === 'number') {
        operatorId = body.id;
      }
    }

    if (!operatorId || !Number.isFinite(operatorId)) {
      return NextResponse.json({ error: 'Invalid operator id' }, { status: 400 });
    }

    const urlPath = await generateOperatorContract(operatorId);

    return NextResponse.json({ success: true, url: urlPath });
  } catch (err) {
    console.error('Error generating operator contract', err);
    return NextResponse.json({ error: 'Failed to generate contract' }, { status: 500 });
  }
}
