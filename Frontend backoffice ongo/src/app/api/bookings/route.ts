import { NextResponse } from "next/server";

interface Booking {
  id: string;
  experienceTitle: string;
  userName: string;
  status: string;
  city?: string;
  createdAt?: string;
}

// Datos de ejemplo en memoria para demo
const bookings: Booking[] = [
  {
    id: "1",
    experienceTitle: "Tour histórico por la ciudad",
    userName: "Juan Pérez",
    status: "confirmada",
    city: "Cusco",
    createdAt: "2026-02-20",
  },
  {
    id: "2",
    experienceTitle: "Experiencia gastronómica local",
    userName: "María Gómez",
    status: "pendiente",
    city: "Lima",
    createdAt: "2026-02-22",
  },
];

export async function GET() {
  return NextResponse.json(bookings);
}
