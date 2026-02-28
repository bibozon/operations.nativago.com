import { NextRequest, NextResponse } from 'next/server';
import { getExperienceById } from '@/services/catalog/experiences';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;

  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid experience id' }, { status: 400 });
  }

  const experience = await getExperienceById(id);

  if (!experience) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  return NextResponse.json(experience);
}
