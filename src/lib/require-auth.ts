import { NextRequest } from "next/server";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

export function requireAuth(request: NextRequest) {
  const rawToken = getAuthTokenFromRequest(request);

  if (!rawToken) {
    return null;
  }

  const token = verifyAuthToken(rawToken);

  if (!token) {
    return null;
  }

  return token;
}
