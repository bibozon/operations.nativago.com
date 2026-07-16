import { NextRequest, NextResponse } from 'next/server';
import { getExperienceById } from '@/services/catalog/experiences';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const countryCode = request.nextUrl.searchParams.get('country') ?? undefined;

  const experience = await getExperienceById(id, countryCode);

  if (!experience) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  return NextResponse.json(experience);
}
