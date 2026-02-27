import { NextRequest, NextResponse } from "next/server";
import { catalogPrisma } from "@/services/catalog/infrastructure/db/client";
import { partnerPrisma } from "@/services/partner/infrastructure/db/client";

interface ExperienceDto {
  id: string;
  title: string;
  image?: string;
  price: number;
  duration: number;
  city: {
    id: string;
    name: string;
    country: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  partner: {
    id: string;
    name: string;
  } | null;
  rating: number;
  featured: boolean;
}

async function mapExperience(exp: any): Promise<ExperienceDto> {
  const partner = await partnerPrisma.partner.findUnique({ where: { id: exp.partnerId } });

  return {
    id: exp.id,
    title: exp.title,
    image: exp.image ?? undefined,
    price: exp.price ? Number(exp.price) : 0,
    duration: exp.durationMinutes,
    city: exp.city
      ? {
          id: exp.city.id,
          name: exp.city.name,
          country: exp.city.country,
        }
      : null,
    category: exp.category
      ? {
          id: exp.category.id,
          name: exp.category.name,
        }
      : null,
    partner: partner
      ? {
          id: partner.id,
          name: partner.name,
        }
      : null,
    rating: exp.rating ?? 0,
    featured: exp.featured ?? false,
  };
}

export async function GET(req: NextRequest) {
  const featured = req.nextUrl.searchParams.get("featured");
  const cityId = req.nextUrl.searchParams.get("city");

  const where: any = {};
  if (featured === "true") {
    where.featured = true;
  }
  if (cityId) {
    where.cityId = cityId;
  }

  const experiences = await catalogPrisma.experience.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      city: true,
      category: true,
    },
  });

  const result: ExperienceDto[] = [];
  for (const exp of experiences) {
    result.push(await mapExperience(exp));
  }

  return NextResponse.json(result);
}
import { NextRequest, NextResponse } from "next/server";
import { getExperienceById, listExperiences } from "@/services/catalog/application/catalogService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const experience = await getExperienceById(id);
    if (!experience) {
      return NextResponse.json({ message: "Experience not found" }, { status: 404 });
    }
    return NextResponse.json(experience);
  }

  const experiences = await listExperiences();
  return NextResponse.json(experiences);
}
