import prisma from '@/lib/db';

// Alfabeto sin I, O, 0, 1 para evitar confusión visual al leerlo en voz alta.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  let code = 'NV-';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function generateUniqueBookingCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const exists = await prisma.booking.findUnique({ where: { bookingCode: code } });
    if (!exists) return code;
  }
  throw new Error('No se pudo generar un código de reserva único');
}
