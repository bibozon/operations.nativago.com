import { NextResponse } from 'next/server';
import { listCities } from '@/services/catalog/cities';

export async function GET() {
  const cities = await listCities();
  return NextResponse.json(cities);
}
