import { NextRequest, NextResponse } from "next/server";
import { services } from "../data";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();

  const index = services.findIndex((s) => s.id === id);
  if (index === -1) {
    return NextResponse.json({ message: "Servicio no encontrado" }, { status: 404 });
  }

  services[index] = {
    ...services[index],
    ...body,
  };

  return NextResponse.json(services[index]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  const index = services.findIndex((s) => s.id === id);
  if (index === -1) {
    return NextResponse.json({ message: "Servicio no encontrado" }, { status: 404 });
  }

  services.splice(index, 1);

  return NextResponse.json({ success: true });
}
