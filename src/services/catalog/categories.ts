import prisma from "@/lib/db";
import { PrismaCategoryRepository } from '@/infrastructure/persistence/prisma/PrismaCategoryRepository';

const categoryRepository = new PrismaCategoryRepository();

export async function deleteCategoryIfUnused(categoryId: string) {
  const experienceCount = await prisma.experience.count({ where: { categoryId } });
  if (experienceCount > 0) {
    throw new Error('Cannot delete category: it is used by experiences');
  }
  await prisma.category.delete({ where: { id: categoryId } });
}

// Category es taxonomía global — no se filtra por país (ver
// CategoryRepository). La curación por país (CountryCategory) queda
// modelada en la DB y lista para Fase 2/3, no se consume todavía acá.
export async function listCategories() {
  try {
    return await categoryRepository.findMany();
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}
