import prisma from '@/lib/db';
import type { CategoryListItem, CategoryRepository } from '@/domain/repositories/CategoryRepository';

export class PrismaCategoryRepository implements CategoryRepository {
  async findMany(): Promise<CategoryListItem[]> {
    return prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }
}
