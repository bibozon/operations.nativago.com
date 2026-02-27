import { NextRequest, NextResponse } from "next/server";
import { services, Service } from "./data";

export async function GET() {
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const newService: Service = {
    id: Date.now().toString(),
    name: body.name,
    description: body.description,
    city: body.city,
    price: body.price,
    active: body.active ?? true,
  };

  services.push(newService);

  return NextResponse.json(newService, { status: 201 });
}
