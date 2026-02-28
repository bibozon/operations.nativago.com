export async function sendBookingEmail(email: string, bookingData: any): Promise<void> {
  // Simulación de envío de email
  console.log(`Email enviado a ${email} con datos de reserva:`, bookingData);
}
