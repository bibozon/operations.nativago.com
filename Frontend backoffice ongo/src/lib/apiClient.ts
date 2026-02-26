import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("session_token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

export interface LoginResponse {
  token: string;
}

export async function loginOperator(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
  return data;
}
