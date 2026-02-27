import { apiClient } from "@/lib/apiClient";

export interface Booking {
  id: string;
  experienceTitle: string;
  userName: string;
  status: string;
  city?: string;
  createdAt?: string;
}

export async function listBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>("/api/bookings");
  return data;
}
