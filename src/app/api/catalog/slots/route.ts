import { NextRequest, NextResponse } from 'next/server';
import { listSlotsByExperience } from '@/services/catalog/slots';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const experienceId = searchParams.get('experience');

  if (!experienceId) {
    return NextResponse.json(
      { error: 'Missing or invalid experience query parameter' },
      { status: 400 }
    );
  }

  const slots = await listSlotsByExperience(experienceId);
  return NextResponse.json(slots);
}
