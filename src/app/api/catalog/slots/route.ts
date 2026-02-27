import { NextRequest, NextResponse } from 'next/server';
import { listSlotsByExperience } from '@/services/catalog/slots';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const experienceParam = searchParams.get('experience');
  const experienceId = experienceParam ? Number(experienceParam) : NaN;

  if (!experienceParam || Number.isNaN(experienceId)) {
    return NextResponse.json(
      { error: 'Missing or invalid experience query parameter' },
      { status: 400 }
    );
  }

  const slots = await listSlotsByExperience(experienceId);
  return NextResponse.json(slots);
}
