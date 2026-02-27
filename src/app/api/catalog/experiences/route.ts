import { NextRequest, NextResponse } from 'next/server';
import { listExperiences } from '@/services/catalog/experiences';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const citySlug = searchParams.get('city') ?? undefined;
  const categorySlug = searchParams.get('category') ?? undefined;
  const featuredParam = searchParams.get('featured');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  let featured: boolean | undefined;
  if (featuredParam === 'true') featured = true;
  if (featuredParam === 'false') featured = false;

  const page = pageParam ? Number(pageParam) : undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  const authUser = getAuthUserFromRequest(request);

  const experiences = await listExperiences({
    citySlug,
    categorySlug,
    featured,
    page,
    limit,
    operatorId:
      authUser && authUser.role !== 'SUPERADMIN' && authUser.operatorId
        ? authUser.operatorId
        : undefined,
  });

  return NextResponse.json(experiences);
}
