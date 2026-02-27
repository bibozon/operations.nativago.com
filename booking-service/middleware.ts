import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Proteger sólo los endpoints de API. El resto (p.ej. página raíz) puede quedar público.
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const token = authHeader.substring("Bearer ".length).trim();

  try {
    const claims = await verifyToken(token);

    // Adjuntar usuario al request mediante cabeceras internas
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nativago-sub", claims.sub);
    requestHeaders.set("x-nativago-role", claims.role);
    requestHeaders.set("x-nativago-iss", claims.iss);
    requestHeaders.set("x-nativago-aud", claims.aud);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Auth middleware error", error);
    return new NextResponse("Unauthorized", { status: 401 });
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
