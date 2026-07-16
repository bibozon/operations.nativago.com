import { NextResponse } from 'next/server';
import { generateOperatorContract } from '@/services/operator/contract';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let operatorId = url.searchParams.get('id');

    if (!operatorId) {
      const body = await request.json().catch(() => null);
      if (body && typeof body.id === 'string') {
        operatorId = body.id;
      }
    }

    if (!operatorId) {
      return NextResponse.json({ error: 'Invalid operator id' }, { status: 400 });
    }

    const urlPath = await generateOperatorContract(operatorId);

    return NextResponse.json({ success: true, url: urlPath });
  } catch (err) {
    console.error('Error generating operator contract', err);
    return NextResponse.json({ error: 'Failed to generate contract' }, { status: 500 });
  }
}
