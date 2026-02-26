import { apiClient } from "@/lib/apiClient";

export interface Product {
  id: string;
  title: string;
  description?: string;
  city?: string;
  price?: number;
}

// Productos obtenidos desde Nativago vía backend FastAPI (proxy)
export async function listNativagoProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/api/nativago/products");
  return data;
}
