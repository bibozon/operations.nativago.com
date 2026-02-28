import { put } from "@vercel/blob";

/**
 * Sube un archivo a Vercel Blob Storage y retorna la URL pública.
 * @param file Archivo a subir (File API)
 * @returns URL pública del archivo subido
 */
export async function uploadImage(file: File): Promise<string> {
  const filename = `${Date.now()}-${file.name}`;
  const blob = await put(filename, file, { access: "public" });
  return blob.url;
}
