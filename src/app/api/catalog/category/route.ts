import { NextResponse } from 'next/server';
import { createCategory, updateCategory, deleteCategory } from '@/services/catalog/cms';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, slug } = body ?? {};

  if (!name || !slug) {
    return NextResponse.json(
      { error: 'name and slug are required' },
      { status: 400 },
    );
  }

  const category = await createCategory({ name, slug });
  return NextResponse.json(category, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, name, slug } = body ?? {};

  const categoryId = Number(id);
  if (!categoryId || Number.isNaN(categoryId)) {
    return NextResponse.json(
      { error: 'valid id is required' },
      { status: 400 },
    );
  }

  if (!name && !slug) {
    return NextResponse.json(
      { error: 'nothing to update' },
      { status: 400 },
    );
  }

  const updated = await updateCategory(categoryId, { name, slug });
  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { id } = body ?? {};

  const categoryId = Number(id);
  if (!categoryId || Number.isNaN(categoryId)) {
    return NextResponse.json(
      { error: 'valid id is required' },
      { status: 400 },
    );
  }

  await deleteCategory(categoryId);
  return NextResponse.json({ ok: true }, { status: 200 });
}
