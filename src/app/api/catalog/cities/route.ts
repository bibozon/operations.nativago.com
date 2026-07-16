import { NextRequest, NextResponse } from 'next/server';
import { listCities } from '@/services/catalog/cities';

export async function GET(request: NextRequest) {
  const countryCode = request.nextUrl.searchParams.get('country') ?? undefined;
  const cities = await listCities(countryCode);
  return NextResponse.json(cities);
}
