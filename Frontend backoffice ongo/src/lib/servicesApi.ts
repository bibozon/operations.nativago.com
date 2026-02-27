import { apiClient } from "@/lib/apiClient";

export interface Service {
  id: string;
  name: string;
  description?: string;
  city?: string;
  price?: number;
  active: boolean;
}

export async function listServices(): Promise<Service[]> {
  const { data } = await apiClient.get<Service[]>("/api/experiences");
  return data;
}

export async function createService(payload: Omit<Service, "id">): Promise<Service> {
  const { data } = await apiClient.post<Service>("/api/experiences", payload);
  return data;
}

export async function updateService(id: string, payload: Partial<Omit<Service, "id">>): Promise<Service> {
  const { data } = await apiClient.put<Service>(`/api/experiences/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/api/experiences/${id}`);
}
