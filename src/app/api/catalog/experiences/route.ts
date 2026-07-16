import { NextRequest, NextResponse } from 'next/server';
import { listExperiences } from '@/services/catalog/experiences';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const citySlug = searchParams.get('city') ?? undefined;
  const categorySlug = searchParams.get('category') ?? undefined;
  const countryCode = searchParams.get('country') ?? undefined;
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  const page = pageParam ? Number(pageParam) : undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  const experiences = await listExperiences({
    citySlug,
    categorySlug,
    countryCode,
    page,
    limit,
  });

  return NextResponse.json(experiences);
}
