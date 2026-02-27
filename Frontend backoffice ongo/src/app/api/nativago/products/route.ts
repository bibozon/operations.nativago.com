import { NextResponse } from "next/server";

interface Product {
  id: string;
  title: string;
  description?: string;
  city?: string;
  price?: number;
}

// Datos de ejemplo. En el futuro se puede conectar a la API real de Nativago.
const products: Product[] = [
  {
    id: "p1",
    title: "Full Day Machu Picchu",
    description: "Excursión completa a Machu Picchu con guía certificado.",
    city: "Cusco",
    price: 250,
  },
  {
    id: "p2",
    title: "City Tour Lima",
    description: "Recorrido por los principales puntos turísticos de Lima.",
    city: "Lima",
    price: 80,
  },
  {
    id: "p3",
    title: "Experiencia Amazónica",
    description: "3 días en lodge en la selva amazónica.",
    city: "Iquitos",
    price: 450,
  },
];

export async function GET() {
  return NextResponse.json(products);
}
