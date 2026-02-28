import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/blob";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

// Helper para extraer el archivo del form-data
async function getFileFromRequest(request: NextRequest): Promise<File | null> {
  const formData = await request.formData();
  const file = formData.get("file");
  if (file && file instanceof File) {
    return file;
  }
  return null;
}

export async function POST(request: NextRequest) {
  // Autenticación
  const rawToken = getAuthTokenFromRequest(request);
  if (!rawToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = verifyAuthToken(rawToken);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extraer archivo
  const file = await getFileFromRequest(request);
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Subir imagen a Vercel Blob
  try {
    const url = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
