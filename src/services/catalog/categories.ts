import prisma from "@/lib/db";

export async function deleteCategoryIfUnused(categoryId: number) {
  const experienceCount = await prisma.experience.count({ where: { categoryId } });
  if (experienceCount > 0) {
    throw new Error('Cannot delete category: it is used by experiences');
  }
  await prisma.category.delete({ where: { id: categoryId } });
}

export async function listCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}